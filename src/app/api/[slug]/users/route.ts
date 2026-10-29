import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { getSession } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const isAuthorized =
      session.platformRole === 'SUPER_ADMIN' ||
      session.roleName === 'School Admin' ||
      session.permissions?.includes('*') ||
      session.permissions?.includes('USERS:VIEW') ||
      session.permissions?.includes('USERS:MANAGE');

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role permissions.' }, { status: 403 });
    }

    const url = new URL(req.url);
    const userTypeSlug = url.searchParams.get('type');
    const search = url.searchParams.get('search') || url.searchParams.get('q') || '';
    const isAll = url.searchParams.get('all') === 'true';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || url.searchParams.get('page_no') || '1'));
    const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '10'));

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    const where: any = {
      tenantId: tenant.id,
      ...(userTypeSlug && userTypeSlug !== 'all'
        ? { userType: { slug: userTypeSlug } }
        : {}),
    };

    if (search.trim()) {
      where.OR = [
        { fullName: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { phone: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      include: {
        role: true,
        userType: {
          include: {
            customFields: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        enrollments: {
          include: {
            batch: {
              include: { class: true },
            },
          },
        },
        assignedDevices: true,
      },
      orderBy: { createdAt: 'desc' },
      ...(isAll ? {} : { skip: (page - 1) * limit, take: limit }),
    });

    return NextResponse.json({
      users,
      pagination: {
        total,
        page: isAll ? 1 : page,
        limit: isAll ? total : limit,
        totalPages: isAll ? 1 : (Math.ceil(total / limit) || 1),
      },
    });
  } catch (err: any) {
    console.error('Fetch users error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    const canManage =
      session.platformRole === 'SUPER_ADMIN' ||
      session.roleName === 'School Admin' ||
      session.permissions?.includes('*') ||
      session.permissions?.includes('USERS:MANAGE') ||
      session.permissions?.includes('USERS:CREATE');
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role permissions.' }, { status: 403 });
    }

    const body = await req.json();
    const { email, fullName, phone, password, roleId, userTypeId, profileData } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: 'Email, Full Name, and Password are required account fields.' },
        { status: 400 }
      );
    }

    // Check duplicate email in this tenant
    const existing = await prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email: email.toLowerCase().trim(),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email address already exists in this school.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let assignedRoleId = roleId || null;
    if (!assignedRoleId) {
      if (userTypeId) {
        const ut = await prisma.userType.findUnique({ where: { id: userTypeId } });
        if (ut) {
          const matchingRole = await prisma.role.findFirst({
            where: {
              tenantId: tenant.id,
              name: { contains: ut.name, mode: 'insensitive' },
            },
          });
          if (matchingRole) assignedRoleId = matchingRole.id;
        }
      }
      if (!assignedRoleId) {
        const fallbackRole = await prisma.role.findFirst({
          where: { tenantId: tenant.id },
          orderBy: { isSystem: 'asc' },
        });
        if (fallbackRole) assignedRoleId = fallbackRole.id;
      }
    }

    const newUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: email.toLowerCase().trim(),
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : null,
        passwordHash,
        roleId: assignedRoleId,
        userTypeId: userTypeId || null,
        profileData: profileData || {},
        isActive: true,
      },
      include: {
        role: true,
        userType: true,
      },
    });

    await logAuditEvent({
      tenantId: tenant.id,
      action: 'USER_CREATED',
      module: 'USERS',
      details: { email: newUser.email, fullName: newUser.fullName, role: newUser.role?.name },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (err: any) {
    console.error('Create user error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    const canManage =
      session.platformRole === 'SUPER_ADMIN' ||
      session.roleName === 'School Admin' ||
      session.permissions?.includes('*') ||
      session.permissions?.includes('USERS:MANAGE') ||
      session.permissions?.includes('USERS:EDIT');
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role permissions.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      userId,
      fullName,
      email,
      phone,
      roleId,
      userTypeId,
      profileData,
      newPassword,
      isActive,
    } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { id: userId, tenantId: tenant.id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found in this institution.' }, { status: 404 });
    }

    // Check duplicate email if changed
    if (email && email.toLowerCase().trim() !== existingUser.email) {
      const emailConflict = await prisma.user.findFirst({
        where: {
          tenantId: tenant.id,
          email: email.toLowerCase().trim(),
          id: { not: userId },
        },
      });

      if (emailConflict) {
        return NextResponse.json(
          { error: 'Another user with this email address already exists.' },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (typeof phone !== 'undefined') updateData.phone = phone ? phone.trim() : null;
    if (roleId) updateData.roleId = roleId;
    if (userTypeId) updateData.userTypeId = userTypeId;
    if (profileData) updateData.profileData = profileData;
    if (newPassword && newPassword.trim()) {
      updateData.passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    }
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: true,
        userType: true,
      },
    });

    await logAuditEvent({
      tenantId: tenant.id,
      action: 'USER_UPDATED',
      module: 'USERS',
      details: {
        userId: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    const canManage =
      session.platformRole === 'SUPER_ADMIN' ||
      session.roleName === 'School Admin' ||
      session.permissions?.includes('*') ||
      session.permissions?.includes('USERS:MANAGE') ||
      session.permissions?.includes('USERS:DELETE');
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role permissions.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    const userToDelete = await prisma.user.findFirst({
      where: { id: userId, tenantId: tenant.id },
      include: { role: true },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found in this institution.' }, { status: 404 });
    }

    // Cleanly delete student enrollments and cascade user
    await prisma.studentEnrollment.deleteMany({
      where: { studentId: userId },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    await logAuditEvent({
      tenantId: tenant.id,
      action: 'USER_DELETED',
      module: 'USERS',
      details: { email: userToDelete.email, fullName: userToDelete.fullName },
    });

    return NextResponse.json({
      success: true,
      message: `User "${userToDelete.fullName}" was successfully deleted.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
