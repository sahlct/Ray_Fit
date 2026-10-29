import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { FieldType, PlatformRole, TenantStatus } from '@prisma/client';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || searchParams.get('q') || '';
    const isAll = searchParams.get('all') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || searchParams.get('page_no') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));

    const where: any = {};
    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { slug: { contains: search.trim(), mode: 'insensitive' } },
        { contactEmail: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const total = await prisma.tenant.count({ where });

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            classes: true,
            wearableDevices: true,
            tasks: true,
          },
        },
        users: {
          where: { role: { name: 'School Admin' } },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(isAll ? {} : { skip: (page - 1) * limit, take: limit }),
    });

    return NextResponse.json({
      tenants,
      pagination: {
        total,
        page: isAll ? 1 : page,
        limit: isAll ? total : limit,
        totalPages: isAll ? 1 : (Math.ceil(total / limit) || 1),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      slug,
      contactEmail,
      contactPhone,
      address,
      primaryColor,
      secondaryColor,
      adminFullName,
      adminEmail,
      adminPassword,
    } = body;

    if (!name || !slug || !contactEmail || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Organization Name, Slug, Contact Email, Admin Email, and Admin Password are required.' },
        { status: 400 }
      );
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // Check slug uniqueness
    const existing = await prisma.tenant.findUnique({
      where: { slug: cleanSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Organization with slug "${cleanSlug}" already exists.` },
        { status: 409 }
      );
    }

    // Precompute password hash outside database transaction
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Run transactional provisioning with extended timeout for cloud databases
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Create Tenant
        const tenant = await tx.tenant.create({
          data: {
            name: name.trim(),
            slug: cleanSlug,
            contactEmail: contactEmail.trim().toLowerCase(),
            contactPhone: contactPhone?.trim() || null,
            address: address?.trim() || null,
            primaryColor: primaryColor || '#0f766e',
            secondaryColor: secondaryColor || '#f59e0b',
            status: TenantStatus.ACTIVE,
            subscriptionPlan: 'standard',
          },
        });

        // 2. Create School Admin Role
        const adminRole = await tx.role.create({
          data: {
            tenantId: tenant.id,
            name: 'School Admin',
            description: 'Full administrative access for school domain',
            isSystem: true,
          },
        });

        // Assign all system permissions to School Admin role in a single fast batch
        const allPerms = await tx.permission.findMany({ select: { id: true } });
        if (allPerms.length > 0) {
          await tx.rolePermission.createMany({
            data: allPerms.map((p) => ({
              roleId: adminRole.id,
              permissionId: p.id,
            })),
            skipDuplicates: true,
          });
        }

        // 3. Create default User Types
        const studentType = await tx.userType.create({
          data: {
            tenantId: tenant.id,
            name: 'Student',
            slug: 'student',
            iconName: 'GraduationCap',
            isSystem: true,
          },
        });

        // Add default custom fields for Student
        await tx.customField.createMany({
          data: [
            {
              userTypeId: studentType.id,
              label: 'Date of Birth',
              fieldKey: 'date_of_birth',
              fieldType: FieldType.DATE,
              isRequired: true,
              displayOrder: 1,
            },
            {
              userTypeId: studentType.id,
              label: 'Guardian Name',
              fieldKey: 'guardian_name',
              fieldType: FieldType.TEXT,
              isRequired: true,
              displayOrder: 2,
            },
            {
              userTypeId: studentType.id,
              label: 'Emergency Phone',
              fieldKey: 'emergency_phone',
              fieldType: FieldType.PHONE,
              isRequired: true,
              displayOrder: 3,
            },
          ],
        });

        // 4. Create Coach, Teacher, Physio, Parent roles & types
        await tx.role.createMany({
          data: [
            { tenantId: tenant.id, name: 'Coach', isSystem: false },
            { tenantId: tenant.id, name: 'Teacher', isSystem: false },
            { tenantId: tenant.id, name: 'Physiotherapist', isSystem: false },
            { tenantId: tenant.id, name: 'Student', isSystem: true },
            { tenantId: tenant.id, name: 'Parent', isSystem: true },
          ],
        });

        await tx.userType.createMany({
          data: [
            { tenantId: tenant.id, name: 'Coach', slug: 'coach', iconName: 'Activity', isSystem: true },
            { tenantId: tenant.id, name: 'Teacher', slug: 'teacher', iconName: 'BookOpen', isSystem: true },
            { tenantId: tenant.id, name: 'Physiotherapist', slug: 'physiotherapist', iconName: 'HeartPulse', isSystem: true },
            { tenantId: tenant.id, name: 'Parent', slug: 'parent', iconName: 'Users', isSystem: true },
          ],
        });

        // 5. Create Primary Company Super Admin Account
        const adminUser = await tx.user.create({
          data: {
            tenantId: tenant.id,
            email: adminEmail.trim().toLowerCase(),
            fullName: adminFullName?.trim() || `${name} Administrator`,
            passwordHash,
            roleId: adminRole.id,
            platformRole: PlatformRole.TENANT_USER,
            isActive: true,
          },
        });

        return { tenant, adminUser };
      },
      {
        maxWait: 15000,
        timeout: 60000,
      }
    );

    await logAuditEvent({
      tenantId: result.tenant.id,
      action: 'TENANT_PROVISIONED',
      module: 'TENANTS',
      details: {
        tenantName: result.tenant.name,
        slug: result.tenant.slug,
        adminEmail: result.adminUser.email,
      },
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (err: any) {
    console.error('Tenant provisioning error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      contactEmail,
      contactPhone,
      address,
      primaryColor,
      secondaryColor,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tenant ID is required.' }, { status: 400 });
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(contactEmail ? { contactEmail: contactEmail.trim().toLowerCase() } : {}),
        ...(typeof contactPhone !== 'undefined' ? { contactPhone: contactPhone?.trim() || null } : {}),
        ...(typeof address !== 'undefined' ? { address: address?.trim() || null } : {}),
        ...(primaryColor ? { primaryColor } : {}),
        ...(secondaryColor ? { secondaryColor } : {}),
        ...(status ? { status: status as TenantStatus } : {}),
      },
    });

    await logAuditEvent({
      tenantId: updated.id,
      action: 'TENANT_UPDATED',
      module: 'TENANTS',
      details: { tenantName: updated.name, status: updated.status },
    });

    return NextResponse.json({ success: true, tenant: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tenant ID is required.' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    // Delete tenant and cascade all relations
    await prisma.tenant.delete({
      where: { id },
    });

    await logAuditEvent({
      action: 'TENANT_DELETED',
      module: 'TENANTS',
      details: { tenantName: tenant.name, slug: tenant.slug },
    });

    return NextResponse.json({
      success: true,
      message: `Organization "${tenant.name}" deleted successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

