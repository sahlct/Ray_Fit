import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string; classId: string }> }
) {
  try {
    const { slug, classId } = await props.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    const classItem = await prisma.class.findFirst({
      where: {
        id: classId,
        tenantId: tenant.id,
      },
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
                    healthRecords: {
                      take: 1,
                      orderBy: { recordedAt: 'desc' },
                    },
                    evaluations: {
                      take: 1,
                      orderBy: { evaluatedAt: 'desc' },
                    },
                  },
                },
              },
            },
            tasks: {
              include: {
                task: true,
              },
            },
          },
        },
        tasks: {
          include: {
            task: true,
          },
        },
      },
    });

    if (!classItem) {
      return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
    }

    return NextResponse.json({ class: classItem });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ slug: string; classId: string }> }
) {
  try {
    const { slug, classId } = await props.params;
    const body = await req.json();
    const { name, academicPeriod, description, isActive } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    const updated = await prisma.class.update({
      where: { id: classId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(academicPeriod ? { academicPeriod: academicPeriod.trim() } : {}),
        ...(typeof description !== 'undefined' ? { description: description?.trim() || null } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
      },
    });

    await logAuditEvent({
      tenantId: tenant.id,
      action: 'CLASS_UPDATED',
      module: 'CLASSES',
      details: { classId: updated.id, name: updated.name },
    });

    return NextResponse.json({ success: true, class: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
