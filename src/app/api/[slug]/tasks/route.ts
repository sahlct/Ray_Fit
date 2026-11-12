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
        metrics,
        createdById,
        // Legacy single metric fields fallback
        metricType,
        unit,
        operator,
        minValue,
        maxValue,
        targetValue,
        clinicalNotes,
        criticalZones,
      } = body;

      if (!title?.trim()) {
        return NextResponse.json({ error: 'Task Title is required.' }, { status: 400 });
      }

      const creatorId =
        createdById ||
        (await prisma.user.findFirst({ where: { tenantId: tenant.id } }))?.id;

      if (!creatorId) {
        return NextResponse.json({ error: 'No author user found.' }, { status: 400 });
      }

      let metricConfigs: any[] = [];
      if (Array.isArray(metrics) && metrics.length > 0) {
        metricConfigs = metrics;
      } else if (metricType && unit && operator) {
        metricConfigs = [{
          metricType,
          unit,
          operator,
          minValue,
          maxValue,
          targetValue,
          clinicalNotes,
          criticalZones,
        }];
      } else {
        return NextResponse.json(
          { error: 'At least one benchmark metric must be configured for the task.' },
          { status: 400 }
        );
      }

      // Enforce: No duplicate metric types in the same task
      const seenTypes = new Set<string>();
      for (const m of metricConfigs) {
        if (!m.metricType || !m.unit || !m.operator) {
          return NextResponse.json(
            { error: 'Metric type, measurement unit, and comparison operator are required for every metric.' },
            { status: 400 }
          );
        }
        if (seenTypes.has(m.metricType)) {
          return NextResponse.json(
            { error: `Duplicate metric type '${m.metricType}' found. Each metric type can only be added once per task.` },
            { status: 400 }
          );
        }
        seenTypes.add(m.metricType);
      }

      const createdTasks: any[] = [];

      for (const m of metricConfigs) {
        const sanitizedCriticalZones = Array.isArray(m.criticalZones)
          ? m.criticalZones
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
                    ? `Critical Low (< ${z.value} ${m.unit})`
                    : `Critical High (> ${z.value} ${m.unit})`),
              }))
          : null;

        const task = await prisma.healthTask.create({
          data: {
            tenantId: tenant.id,
            createdById: creatorId,
            title: title.trim(),
            description: description?.trim() || null,
            metricType: m.metricType as HealthMetricType,
            unit: m.unit.trim(),
            frequency: FrequencyType.DAILY,
            isActive: true,
          },
        });

        const benchmark = await prisma.benchmarkVersion.create({
          data: {
            taskId: task.id,
            tenantId: tenant.id,
            versionNumber: 1,
            operator: m.operator as BenchmarkOperator,
            minValue: m.minValue ? Number(m.minValue) : null,
            maxValue: m.maxValue ? Number(m.maxValue) : null,
            targetValue: m.targetValue
              ? Number(m.targetValue)
              : m.operator === 'EXACT_MATCH' && m.minValue
              ? Number(m.minValue)
              : null,
            clinicalNotes: m.clinicalNotes?.trim() || null,
            criticalZones: sanitizedCriticalZones ?? undefined,
            effectiveFrom: new Date(),
          },
        });

        createdTasks.push({ ...task, benchmarks: [benchmark] });
      }

      await logAuditEvent({
        tenantId: tenant.id,
        action: 'TASK_CREATED',
        module: 'TASKS',
        details: { title: title.trim(), metricsCount: createdTasks.length },
      });

      return NextResponse.json({ success: true, tasks: createdTasks, task: createdTasks[0] }, { status: 201 });
    }

    if (action === 'ASSIGN_TASK') {
      const { taskId, taskIds, batchId, classId, startDate, endDate, startTime, endTime, durationMinutes } = body;

      const targetTaskIds: string[] = Array.isArray(taskIds) && taskIds.length > 0
        ? taskIds
        : (taskId ? [taskId] : []);

      if (targetTaskIds.length === 0 || (!batchId && !classId) || !startDate || !endDate) {
        return NextResponse.json(
          { error: 'Task(s), target Program/Batch, Start Date, and End Date are required.' },
          { status: 400 }
        );
      }

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

      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysCount = Math.min(
        14,
        Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)))
      );

      const createdAssignments: any[] = [];

      for (const tId of targetTaskIds) {
        const benchmark = await prisma.benchmarkVersion.findFirst({
          where: { taskId: tId, tenantId: tenant.id },
          orderBy: { versionNumber: 'desc' },
        });

        if (!benchmark) continue;

        const assignment = await prisma.healthTaskAssignment.create({
          data: {
            taskId: tId,
            batchId: batchId || null,
            classId: classId || null,
            startDate: start,
            endDate: end,
            isActive: true,
          },
        });

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

        createdAssignments.push(assignment);
      }

      await logAuditEvent({
        tenantId: tenant.id,
        action: 'TASK_ASSIGNED',
        module: 'TIMETABLES',
        details: { taskCount: targetTaskIds.length, batchId, classId, scheduledDays: daysCount, durationMins },
      });

      return NextResponse.json({ success: true, assignments: createdAssignments, assignment: createdAssignments[0] }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
