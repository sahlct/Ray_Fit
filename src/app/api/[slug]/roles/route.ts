import { NextRequest, NextResponse } from 'next/server';
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
      session.permissions?.includes('ROLES:VIEW') ||
      session.permissions?.includes('ROLES:MANAGE') ||
      session.permissions?.includes('USERS:VIEW');

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role permissions.' }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        roles: {
          include: {
            permissions: {
              include: { permission: true },
            },
            _count: {
              select: { users: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    const allPermissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    return NextResponse.json({
      roles: tenant.roles,
      availablePermissions: allPermissions,
    });
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

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const canManageRoles =
      session.platformRole === 'SUPER_ADMIN' ||
      session.roleName === 'School Admin' ||
      session.permissions?.includes('*') ||
      session.permissions?.includes('ROLES:MANAGE') ||
      session.permissions?.includes('ROLES:CREATE');

    if (!canManageRoles) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role permissions.' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body; // "CREATE_ROLE" | "UPDATE_PERMISSIONS"

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    if (action === 'CREATE_ROLE') {
      const { name, description, permissionIds } = body;
      if (!name) {
        return NextResponse.json({ error: 'Role name is required.' }, { status: 400 });
      }

      const role = await prisma.role.create({
        data: {
          tenantId: tenant.id,
          name: name.trim(),
          description: description?.trim(),
          isSystem: false,
        },
      });

      if (Array.isArray(permissionIds) && permissionIds.length > 0) {
        for (const pId of permissionIds) {
          await prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: pId },
          });
        }
      }

      await logAuditEvent({
        tenantId: tenant.id,
        action: 'ROLE_CREATED',
        module: 'ROLES',
        details: { roleName: role.name, permissionsCount: permissionIds?.length || 0 },
      });

      return NextResponse.json({ success: true, role }, { status: 201 });
    }

    if (action === 'UPDATE_PERMISSIONS') {
      const { roleId, permissionIds } = body;
      if (!roleId || !Array.isArray(permissionIds)) {
        return NextResponse.json(
          { error: 'Role ID and permission IDs are required.' },
          { status: 400 }
        );
      }

      // Clear existing and assign new
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      for (const pId of permissionIds) {
        await prisma.rolePermission.create({
          data: { roleId, permissionId: pId },
        });
      }

      await logAuditEvent({
        tenantId: tenant.id,
        action: 'ROLE_PERMISSIONS_UPDATED',
        module: 'ROLES',
        details: { roleId, updatedCount: permissionIds.length },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
