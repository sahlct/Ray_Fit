import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signSessionToken, SessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Find all user accounts matching this email (across all organizations / platform)
    const matchingUsers = await prisma.user.findMany({
      where: {
        email: cleanEmail,
        isActive: true,
      },
      include: {
        tenant: true,
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        userType: true,
        enrollments: {
          where: { isActive: true },
          include: {
            batch: {
              include: { class: true },
            },
          },
        },
        assignedDevices: {
          select: {
            id: true,
            deviceUuid: true,
            vendorName: true,
            modelNumber: true,
            batteryLevel: true,
            status: true,
            lastSyncAt: true,
          },
        },
      },
    });

    if (!matchingUsers || matchingUsers.length === 0) {
      return NextResponse.json(
        { error: 'No account found with this email.' },
        { status: 401 }
      );
    }

    // 2. Filter accounts where the password is valid
    const verifiedAccounts = [];
    for (const user of matchingUsers) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (isMatch) {
        verifiedAccounts.push(user);
      }
    }

    if (verifiedAccounts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid password. Please check your credentials.' },
        { status: 401 }
      );
    }

    // 3. Build organization profile list for the mobile app
    const organizations = [];

    for (const user of verifiedAccounts) {
      const permissions: string[] = [];
      if (user.platformRole === 'SUPER_ADMIN') {
        permissions.push('*');
      } else if (user.role?.permissions) {
        for (const rp of user.role.permissions) {
          permissions.push(`${rp.permission.module}:${rp.permission.action}`);
        }
      }

      const sessionUser: SessionUser = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        platformRole: user.platformRole,
        tenantId: user.tenantId,
        tenantSlug: user.tenant?.slug || null,
        tenantName: user.tenant?.name || 'Platform Admin',
        roleId: user.roleId,
        roleName: user.role?.name || (user.platformRole === 'SUPER_ADMIN' ? 'Super Admin' : 'User'),
        userTypeId: user.userTypeId,
        userTypeSlug: user.userType?.slug || 'student',
        permissions,
      };

      const token = await signSessionToken(sessionUser);

      // Student academic info if available
      const enrollment = user.enrollments[0];
      const academicInfo = enrollment
        ? {
            enrollmentId: enrollment.id,
            rollNumber: enrollment.rollNumber,
            className: enrollment.batch?.class?.name,
            batchName: enrollment.batch?.name,
            academicPeriod: enrollment.batch?.class?.academicPeriod,
          }
        : null;

      organizations.push({
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name || 'Ray Fit Master',
        tenantSlug: user.tenant?.slug || 'admin',
        tenantLogo: user.tenant?.logoUrl || null,
        primaryColor: user.tenant?.primaryColor || '#0f766e',
        secondaryColor: user.tenant?.secondaryColor || '#f59e0b',
        roleName: user.role?.name || (user.platformRole === 'SUPER_ADMIN' ? 'Platform Admin' : 'Student'),
        userTypeSlug: user.userType?.slug || 'student',
        userTypeName: user.userType?.name || 'Student',
        academicInfo,
        assignedDevice: user.assignedDevices[0] || null,
        token,
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    await logAuditEvent({
      userId: verifiedAccounts[0].id,
      tenantId: verifiedAccounts[0].tenantId,
      action: 'MOBILE_LOGIN_SUCCESS',
      module: 'AUTH',
      details: { email: cleanEmail, orgCount: organizations.length },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent') || 'FlutterMobileApp',
    });

    return NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      user: {
        email: cleanEmail,
        fullName: verifiedAccounts[0].fullName,
      },
      organizations,
    });
  } catch (err: any) {
    console.error('Mobile login error:', err);
    return NextResponse.json(
      { error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}

