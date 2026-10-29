import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BenchmarkOperator, FrequencyType, HealthMetricType } from '@prisma/client';
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
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const total = await prisma.healthTask.count({ where });

    const tasks = await prisma.healthTask.findMany({
      where,
      include: {
        createdBy: true,
        benchmarks: {
          orderBy: { versionNumber: 'desc' },
        },
        assignments: {
          include: {
            batch: { include: { class: true } },
            class: true,
            timetableEntries: {
              take: 10,
              orderBy: { scheduledDate: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(isAll ? {} : { skip: (page - 1) * limit, take: limit }),
    });

    return NextResponse.json({
      tasks,
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
    const { action } = body; // "CREATE_TASK" | "ASSIGN_TASK" | "UPDATE_BENCHMARK"

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    if (action === 'CREATE_TASK') {
      const {
        title,
        description,
        metricType,
        unit,
        operator,
        minValue,
        maxValue,
        targetValue,
        clinicalNotes,
        createdById,
        criticalZones,
      } = body;

      if (!title || !metricType || !unit || !operator) {
        return NextResponse.json(
          { error: 'Title, Metric Type, Unit, and Benchmark Operator are required.' },
          { status: 400 }
        );
      }

      // Sanitize critical zones: each must have type: "BELOW" | "ABOVE" and numeric value
      const sanitizedCriticalZones = Array.isArray(criticalZones)
        ? criticalZones
            .filter(
              (z: any) =>
                z &&
                (z.type === 'BELOW' || z.type === 'ABOVE') &&
                z.value !== undefined &&
                z.value !== null &&
                !isNaN(Number(z.value))
            )
            .map((z: any) => ({
              id: z.id || Math.random().toString(36).substring(2, 9),
              type: z.type === 'BELOW' ? 'BELOW' : 'ABOVE',
              value: Number(z.value),
              label:
                z.label?.trim() ||
                (z.type === 'BELOW'
                  ? `Critical Low (< ${z.value} ${unit})`
                  : `Critical High (> ${z.value} ${unit})`),
            }))
        : null;

      // Find coach or admin
      const creatorId =
        createdById ||
        (await prisma.user.findFirst({ where: { tenantId: tenant.id } }))?.id;

      if (!creatorId) {
        return NextResponse.json({ error: 'No author user found.' }, { status: 400 });
      }

      // Create task
      const task = await prisma.healthTask.create({
        data: {
          tenantId: tenant.id,
          createdById: creatorId,
          title: title.trim(),
          description: description?.trim(),
          metricType: metricType as HealthMetricType,
          unit: unit.trim(),
          frequency: FrequencyType.DAILY,
          isActive: true,
        },
      });

      // Create initial BenchmarkVersion (version 1)
      const benchmark = await prisma.benchmarkVersion.create({
        data: {
          taskId: task.id,
          tenantId: tenant.id,
          versionNumber: 1,
          operator: operator as BenchmarkOperator,
          minValue: minValue ? Number(minValue) : null,
          maxValue: maxValue ? Number(maxValue) : null,
          targetValue: targetValue ? Number(targetValue) : (operator === 'EXACT_MATCH' && minValue ? Number(minValue) : null),
          clinicalNotes: clinicalNotes?.trim() || null,
          criticalZones: sanitizedCriticalZones ?? undefined,
          effectiveFrom: new Date(),
        },
      });

      await logAuditEvent({
        tenantId: tenant.id,
        action: 'TASK_CREATED',
        module: 'TASKS',
        details: { taskId: task.id, title: task.title, metric: task.metricType, criticalZonesCount: sanitizedCriticalZones?.length || 0 },
      });

      return NextResponse.json({ success: true, task, benchmark }, { status: 201 });
    }

    if (action === 'ASSIGN_TASK') {
      const { taskId, batchId, classId, startDate, endDate, startTime, endTime, durationMinutes } = body;

      if (!taskId || (!batchId && !classId) || !startDate || !endDate) {
        return NextResponse.json(
          { error: 'Task, target Batch/Class, Start Date, and End Date are required.' },
          { status: 400 }
        );
      }

      // Calculate duration in minutes if not provided
      let durationMins = durationMinutes ? Number(durationMinutes) : null;
      const windowStart = startTime || '08:00';
      const windowEnd = endTime || '09:30';

      if (!durationMins && windowStart && windowEnd) {
        try {
          const [sh, sm] = windowStart.split(':').map(Number);
          const [eh, em] = windowEnd.split(':').map(Number);
          const startM = sh * 60 + sm;
          const endM = eh * 60 + em;
          durationMins = endM >= startM ? endM - startM : 24 * 60 - startM + endM;
        } catch (_) {
          durationMins = 90;
        }
      }

      // Find latest benchmark version for this task
      const benchmark = await prisma.benchmarkVersion.findFirst({
        where: { taskId, tenantId: tenant.id },
        orderBy: { versionNumber: 'desc' },
      });

      if (!benchmark) {
        return NextResponse.json(
          { error: 'No benchmark configured for this task.' },
          { status: 400 }
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      const assignment = await prisma.healthTaskAssignment.create({
        data: {
          taskId,
          batchId: batchId || null,
          classId: classId || null,
          startDate: start,
          endDate: end,
          isActive: true,
        },
      });

      // Generate timetable entries for the next 7 days or date range
      const daysCount = Math.min(
        14,
        Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)))
      );

      for (let i = 0; i <= daysCount; i++) {
        const schedDate = new Date(start);
        schedDate.setDate(start.getDate() + i);
        schedDate.setHours(0, 0, 0, 0);

        await prisma.timetableAssignment.create({
          data: {
            tenantId: tenant.id,
            assignmentId: assignment.id,
            benchmarkVersionId: benchmark.id,
            scheduledDate: schedDate,
            windowStartTime: windowStart,
            windowEndTime: windowEnd,
            durationMinutes: durationMins,
            status: i === 0 ? 'ACTIVE' : 'SCHEDULED',
          },
        });
      }

      await logAuditEvent({
        tenantId: tenant.id,
        action: 'TASK_ASSIGNED',
        module: 'TIMETABLES',
        details: { taskId, batchId, classId, scheduledDays: daysCount, windowStart, windowEnd, durationMins },
      });

      return NextResponse.json({ success: true, assignment }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
