import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        userTypes: {
          include: {
            _count: {
              select: {
                users: true,
                customFields: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    return NextResponse.json({ userTypes: tenant.userTypes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const body = await req.json();
    const { name, slug: customSlug, iconName } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'User Type Name is required.' }, { status: 400 });
    }

    const cleanSlug = (customSlug || name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');

    // Check uniqueness
    const existing = await prisma.userType.findFirst({
      where: {
        tenantId: tenant.id,
        slug: cleanSlug,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A user type with identifier "${cleanSlug}" already exists.` },
        { status: 409 }
      );
    }

    const newUserType = await prisma.userType.create({
      data: {
        tenantId: tenant.id,
        name: name.trim(),
        slug: cleanSlug,
        iconName: iconName || 'User',
        isSystem: false,
      },
    });

    await logAuditEvent({
      tenantId: tenant.id,
      action: 'USER_TYPE_CREATED',
      module: 'USER_TYPES',
      details: { name: newUserType.name, slug: newUserType.slug, icon: newUserType.iconName },
    });

    return NextResponse.json({ success: true, userType: newUserType }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const body = await req.json();
    const { id, name, iconName } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    if (!id || !name || !name.trim()) {
      return NextResponse.json({ error: 'User Type ID and Name are required.' }, { status: 400 });
    }

    const existing = await prisma.userType.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'User Type not found.' }, { status: 404 });
    }

    const updated = await prisma.userType.update({
      where: { id },
      data: {
        name: name.trim(),
        ...(iconName ? { iconName } : {}),
      },
    });

    await logAuditEvent({
      tenantId: tenant.id,
      action: 'USER_TYPE_UPDATED',
      module: 'USER_TYPES',
      details: { id: updated.id, name: updated.name },
    });

    return NextResponse.json({ success: true, userType: updated });
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User Type ID is required.' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    const userType = await prisma.userType.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!userType) {
      return NextResponse.json({ error: 'User Type not found.' }, { status: 404 });
    }

    if (userType.isSystem) {
      return NextResponse.json(
        { error: 'Core system user types (e.g. Student, Coach, Teacher) cannot be deleted.' },
        { status: 403 }
      );
    }

    if (userType._count.users > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete "${userType.name}" because ${userType._count.users} user(s) are currently assigned to it. Please reassign those users first.`,
        },
        { status: 400 }
      );
    }

    // Delete custom fields under this user type first, then delete user type
    await prisma.customField.deleteMany({
      where: { userTypeId: id },
    });

    await prisma.userType.delete({
      where: { id },
    });

    await logAuditEvent({
      tenantId: tenant.id,
      action: 'USER_TYPE_DELETED',
      module: 'USER_TYPES',
      details: { userTypeName: userType.name, slug: userType.slug },
    });

    return NextResponse.json({ success: true, message: `User Type "${userType.name}" deleted.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
