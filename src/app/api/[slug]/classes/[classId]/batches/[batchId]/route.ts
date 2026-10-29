import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string; classId: string; batchId: string }> }
) {
  try {
    const { slug, classId, batchId } = await props.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    const batch = await prisma.batch.findFirst({
      where: {
        id: batchId,
        class: {
          id: classId,
          tenantId: tenant.id,
        },
      },
      include: {
        class: true,
        instructors: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                userType: true,
              },
            },
          },
        },
        enrollments: {
          where: { isActive: true },
          include: {
            student: {
              include: {
                assignedDevices: true,
                healthRecords: {
                  take: 3,
                  orderBy: { recordedAt: 'desc' },
                },
                evaluations: {
                  take: 3,
                  orderBy: { evaluatedAt: 'desc' },
                  include: {
                    benchmarkVersion: {
                      include: { task: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        },
        tasks: {
          include: {
            task: {
              include: {
                benchmarks: {
                  take: 1,
                  orderBy: { versionNumber: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found.' }, { status: 404 });
    }

    return NextResponse.json({ batch });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ slug: string; classId: string; batchId: string }> }
) {
  try {
    const { slug, classId, batchId } = await props.params;
    const body = await req.json();
    const { name, capacity, schedule, isActive } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    const updated = await prisma.batch.update({
      where: { id: batchId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(capacity ? { capacity: Number(capacity) } : {}),
        ...(typeof schedule !== 'undefined' ? { schedule: schedule?.trim() || null } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
      },
    });

    await logAuditEvent({
      tenantId: tenant.id,
      action: 'BATCH_UPDATED',
      module: 'BATCHES',
      details: { batchId: updated.id, name: updated.name },
    });

    return NextResponse.json({ success: true, batch: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ slug: string; classId: string; batchId: string }> }
) {
  try {
    const { slug, batchId } = await props.params;
    const { searchParams } = new URL(req.url);
    const enrollmentId = searchParams.get('enrollmentId');

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    if (enrollmentId) {
      // Remove student from batch
      const enrollment = await prisma.studentEnrollment.findUnique({
        where: { id: enrollmentId },
        include: { student: true, batch: true },
      });

      if (!enrollment) {
        return NextResponse.json({ error: 'Enrollment record not found.' }, { status: 404 });
      }

      await prisma.studentEnrollment.delete({
        where: { id: enrollmentId },
      });

      await logAuditEvent({
        tenantId: tenant.id,
        action: 'STUDENT_UNENROLLED',
        module: 'BATCHES',
        details: { student: enrollment.student.fullName, batch: enrollment.batch.name },
      });

      return NextResponse.json({ success: true, message: 'Student removed from batch.' });
    }

    return NextResponse.json({ error: 'Specify enrollmentId to unenroll student.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
