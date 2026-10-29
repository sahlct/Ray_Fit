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
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || url.searchParams.get('q') || '';
    const isAll = url.searchParams.get('all') === 'true';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || url.searchParams.get('page_no') || '1'));
    const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '10'));

    const where: any = { tenantId: tenant.id };
    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { academicPeriod: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const total = await prisma.class.count({ where });

    const classes = await prisma.class.findMany({
      where,
      include: {
        batches: {
          include: {
            instructors: {
              include: { user: true },
            },
            enrollments: {
              where: { isActive: true },
              include: {
                student: {
                  include: {
                    assignedDevices: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      ...(isAll ? {} : { skip: (page - 1) * limit, take: limit }),
    });

    return NextResponse.json({
      classes,
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

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const body = await req.json();
    const { type } = body; // "CREATE_CLASS" | "CREATE_BATCH" | "ENROLL_STUDENT"

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    if (type === 'CREATE_CLASS') {
      const { name, academicPeriod, description } = body;
      if (!name || !academicPeriod) {
        return NextResponse.json(
          { error: 'Class name and Academic Period are required.' },
          { status: 400 }
        );
      }

      const newClass = await prisma.class.create({
        data: {
          tenantId: tenant.id,
          name: name.trim(),
          academicPeriod: academicPeriod.trim(),
          description: description?.trim(),
          isActive: true,
        },
      });

      await logAuditEvent({
        tenantId: tenant.id,
        action: 'CLASS_CREATED',
        module: 'CLASSES',
        details: { className: newClass.name, period: newClass.academicPeriod },
      });

      return NextResponse.json({ success: true, class: newClass }, { status: 201 });
    }

    if (type === 'CREATE_BATCH') {
      const { classId, name, capacity, schedule, instructorId } = body;
      if (!classId || !name) {
        return NextResponse.json(
          { error: 'Class ID and Batch name are required.' },
          { status: 400 }
        );
      }

      const newBatch = await prisma.batch.create({
        data: {
          classId,
          name: name.trim(),
          capacity: Number(capacity) || 30,
          schedule: schedule?.trim(),
          isActive: true,
        },
      });

      if (instructorId) {
        await prisma.batchInstructor.create({
          data: {
            batchId: newBatch.id,
            userId: instructorId,
            role: 'Assigned Coach',
          },
        });
      }

      await logAuditEvent({
        tenantId: tenant.id,
        action: 'BATCH_CREATED',
        module: 'BATCHES',
        details: { batchName: newBatch.name, classId },
      });

      return NextResponse.json({ success: true, batch: newBatch }, { status: 201 });
    }

    if (type === 'ENROLL_STUDENT') {
      const { batchId, studentId, rollNumber } = body;
      if (!batchId || !studentId) {
        return NextResponse.json(
          { error: 'Batch ID and Student ID are required.' },
          { status: 400 }
        );
      }

      // Check capacity
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        include: {
          enrollments: { where: { isActive: true } },
        },
      });

      if (!batch) {
        return NextResponse.json({ error: 'Batch not found.' }, { status: 404 });
      }

      if (batch.enrollments.length >= batch.capacity) {
        return NextResponse.json(
          { error: `Batch has reached maximum capacity of ${batch.capacity} students.` },
          { status: 400 }
        );
      }

      // Check active enrollment in same batch
      const existing = await prisma.studentEnrollment.findFirst({
        where: { batchId, studentId, isActive: true },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Student is already actively enrolled in this batch.' },
          { status: 409 }
        );
      }

      const enrollment = await prisma.studentEnrollment.create({
        data: {
          batchId,
          studentId,
          rollNumber: rollNumber?.trim() || null,
          isActive: true,
        },
        include: { student: true, batch: true },
      });

      await logAuditEvent({
        tenantId: tenant.id,
        action: 'STUDENT_ENROLLED',
        module: 'BATCHES',
        details: { student: enrollment.student.fullName, batch: enrollment.batch.name },
      });

      return NextResponse.json({ success: true, enrollment }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid operation type.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
