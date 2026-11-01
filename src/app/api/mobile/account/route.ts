import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

async function handleAccountDeletion(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization Bearer token is required.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim();
    const session = await verifySessionToken(token);
    if (!session || !session.id) {
      return NextResponse.json(
        { error: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    const userId = session.id;

    // Fetch the target user to ensure they exist
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        assignedDevices: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User account not found or already deleted.' },
        { status: 404 }
      );
    }

    // Optional confirmation / password check
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      // Body may be empty on standard DELETE requests
    }

    if (body?.password) {
      const isMatch = await bcrypt.compare(body.password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Incorrect password provided.' },
          { status: 400 }
        );
      }
    }

    // Execute atomic cleanup of all user records, enrollments, and health telemetry
    await prisma.$transaction(async (tx) => {
      // 1. Unbind and release any smartband hardware paired to this user
      await tx.wearableDevice.updateMany({
        where: { studentId: userId },
        data: { studentId: null },
      });

      // 2. Delete all wearable health telemetry metrics (steps, heart rate, bp, spo2, sleep)
      await tx.healthMetricRecord.deleteMany({
        where: { studentId: userId },
      });

      // 3. Delete all benchmark evaluation results & compliance logs
      await tx.taskEvaluationResult.deleteMany({
        where: { studentId: userId },
      });

      // 4. Delete academic class / batch enrollments
      await tx.studentEnrollment.deleteMany({
        where: { studentId: userId },
      });

      // 5. Delete batch instructor mappings if any
      await tx.batchInstructor.deleteMany({
        where: { userId: userId },
      });

      // 6. Delete any self-registration requests matching this user in this tenant
      if (user.tenantId) {
        await tx.registrationRequest.deleteMany({
          where: {
            tenantId: user.tenantId,
            email: user.email,
          },
        });
      }

      // 7. Delete the user record itself
      await tx.user.delete({
        where: { id: userId },
      });
    });

    // Write audit log entry for account deletion
    await logAuditEvent({
      tenantId: user.tenantId,
      userId: null,
      action: 'USER_ACCOUNT_SELF_DELETED',
      module: 'USERS',
      details: {
        deletedUserId: user.id,
        email: user.email,
        fullName: user.fullName,
        tenantSlug: user.tenant?.slug || session.tenantSlug || 'unknown',
        method: 'mobile_self_delete',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Your account and all associated health records have been permanently deleted.',
    });
  } catch (err: any) {
    console.error('Account deletion error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete user account.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  return handleAccountDeletion(req);
}

export async function POST(req: NextRequest) {
  return handleAccountDeletion(req);
}

