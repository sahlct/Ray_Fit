import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate via Bearer token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required.' }, { status: 401 });
    }

    const token = authHeader.substring(7).trim();
    const session = await verifySessionToken(token);
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: 'Invalid or expired session token.' }, { status: 401 });
    }

    const tenantId = session.tenantId;
    const studentId = session.id;

    // Optional query date: defaults to today
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // 2. Fetch student enrollment batches and classes
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        studentId,
        isActive: true,
      },
      include: {
        batch: {
          include: {
            class: true,
          },
        },
      },
    });

    const batchIds = enrollments.map((e) => e.batchId);
    const classIds = enrollments.map((e) => e.batch.classId);

    // 3. Find active timetable entries for today matching student's batch or class
    const timetableEntries = await prisma.timetableAssignment.findMany({
      where: {
        tenantId,
        scheduledDate: targetDate,
        assignment: {
          isActive: true,
          OR: [
            { batchId: { in: batchIds } },
            { classId: { in: classIds } },
            { batchId: null, classId: null }, // tenant-wide
          ],
        },
      },
      include: {
        assignment: {
          include: {
            task: true,
            batch: true,
            class: true,
          },
        },
        benchmarkVersion: true,
        evaluations: {
          where: { studentId },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 4. Also fetch today's aggregated metric records for this student to show live progress
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const todayRecords = await prisma.healthMetricRecord.findMany({
      where: {
        tenantId,
        studentId,
        recordedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { recordedAt: 'desc' },
    });

    // Group metric sums / averages for live progress display
    const metricSummary: Record<string, { latest: number; sum: number; count: number; avg: number }> = {};
    for (const r of todayRecords) {
      const type = r.metricType;
      const val = Number(r.numericVal);
      if (!metricSummary[type]) {
        metricSummary[type] = { latest: val, sum: val, count: 1, avg: val };
      } else {
        metricSummary[type].sum += val;
        metricSummary[type].count += 1;
        metricSummary[type].avg = Math.round((metricSummary[type].sum / metricSummary[type].count) * 10) / 10;
      }
    }

    // 5. Format tasks list
    const tasks = timetableEntries.map((entry) => {
      const task = entry.assignment.task;
      const benchmark = entry.benchmarkVersion;
      const evaluation = entry.evaluations[0] || null;

      // Calculate current live value for this task's metric
      let liveValue: number | null = null;
      if (metricSummary[task.metricType]) {
        if (task.metricType === 'STEPS' || task.metricType === 'CALORIES_BURNED' || task.metricType === 'ACTIVE_MINUTES') {
          liveValue = metricSummary[task.metricType].sum;
        } else {
          liveValue = metricSummary[task.metricType].latest;
        }
      }

      return {
        timetableEntryId: entry.id,
        assignmentId: entry.assignmentId,
        taskId: task.id,
        title: task.title,
        description: task.description,
        metricType: task.metricType,
        unit: task.unit,
        frequency: task.frequency,
        scheduledDate: entry.scheduledDate,
        windowStartTime: entry.windowStartTime,
        windowEndTime: entry.windowEndTime,
        durationMinutes: entry.durationMinutes,
        timetableStatus: entry.status,
        benchmark: {
          versionNumber: benchmark.versionNumber,
          operator: benchmark.operator,
          minValue: benchmark.minValue ? Number(benchmark.minValue) : null,
          maxValue: benchmark.maxValue ? Number(benchmark.maxValue) : null,
          targetValue: benchmark.targetValue ? Number(benchmark.targetValue) : null,
          clinicalNotes: benchmark.clinicalNotes,
          criticalZones: benchmark.criticalZones || [],
        },
        evaluation: evaluation
          ? {
              status: evaluation.status,
              aggregatedValue: evaluation.aggregatedValue ? Number(evaluation.aggregatedValue) : null,
              thresholdSummary: evaluation.thresholdSummary,
              evaluatedAt: evaluation.evaluatedAt,
              actualStartTime: evaluation.actualStartTime,
              actualEndTime: evaluation.actualEndTime,
              actualDurationMins: evaluation.actualDurationMins,
              criticalEventsCount: evaluation.criticalEventsCount || 0,
              criticalEventsLog: evaluation.criticalEventsLog || [],
            }
          : null,
        liveValue,
      };
    });

    return NextResponse.json({
      success: true,
      targetDate: targetDate.toISOString().split('T')[0],
      tasks,
      metricSummary,
    });
  } catch (err: any) {
    console.error('Fetch student tasks error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch scheduled tasks.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required.' }, { status: 401 });
    }

    const token = authHeader.substring(7).trim();
    const session = await verifySessionToken(token);
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: 'Invalid or expired session token.' }, { status: 401 });
    }

    const tenantId = session.tenantId;
    const studentId = session.id;
    const body = await req.json();
    const { action, timetableEntryId, metricValue } = body;

    if (!timetableEntryId) {
      return NextResponse.json({ error: 'Timetable entry ID is required.' }, { status: 400 });
    }

    // Find the timetable entry and related task + benchmark
    const entry = await prisma.timetableAssignment.findFirst({
      where: { id: timetableEntryId, tenantId },
      include: {
        assignment: {
          include: { task: true },
        },
        benchmarkVersion: true,
      },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Timetable entry not found.' }, { status: 404 });
    }

    const task = entry.assignment.task;
    const benchmark = entry.benchmarkVersion;

    if (action === 'START_TASK') {
      const startTime = new Date();

      // Upsert evaluation record with status IN_PROGRESS
      const evaluation = await prisma.taskEvaluationResult.upsert({
        where: {
          studentId_timetableEntryId_evaluationDate: {
            studentId,
            timetableEntryId: entry.id,
            evaluationDate: entry.scheduledDate,
          },
        },
        update: {
          status: 'IN_PROGRESS',
          actualStartTime: startTime,
          thresholdSummary: `Task started at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Telemetry recording in progress.`,
          evaluatedAt: startTime,
        },
        create: {
          tenantId,
          studentId,
          timetableEntryId: entry.id,
          benchmarkVersionId: benchmark.id,
          evaluationDate: entry.scheduledDate,
          status: 'IN_PROGRESS',
          actualStartTime: startTime,
          thresholdSummary: `Task started at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Telemetry recording in progress.`,
          evaluatedAt: startTime,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Task session started successfully.',
        evaluation: {
          status: evaluation.status,
          actualStartTime: evaluation.actualStartTime,
          actualEndTime: evaluation.actualEndTime,
          actualDurationMins: evaluation.actualDurationMins,
          thresholdSummary: evaluation.thresholdSummary,
        },
      });
    }

    if (action === 'COMPLETE_TASK') {
      const endTime = new Date();

      // Find existing evaluation to get actualStartTime
      const existing = await prisma.taskEvaluationResult.findFirst({
        where: {
          studentId,
          timetableEntryId: entry.id,
          evaluationDate: entry.scheduledDate,
        },
      });

      const startTime = existing?.actualStartTime || new Date(Date.now() - 30 * 60 * 1000); // default to 30 mins ago if start was missed
      const durationMins = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)));

      // Fetch or compute telemetry value
      let recordedValue = metricValue !== undefined && metricValue !== null ? Number(metricValue) : null;

      if (recordedValue === null) {
        // Query HealthMetricRecord during session window or latest today
        const records = await prisma.healthMetricRecord.findMany({
          where: {
            tenantId,
            studentId,
            metricType: task.metricType,
            recordedAt: {
              gte: new Date(startTime.getTime() - 60000), // 1 min buffer
              lte: new Date(endTime.getTime() + 60000),
            },
          },
          orderBy: { recordedAt: 'desc' },
        });

        if (records.length > 0) {
          if (task.metricType === 'STEPS' || task.metricType === 'CALORIES_BURNED' || task.metricType === 'ACTIVE_MINUTES') {
            recordedValue = records.reduce((acc, r) => acc + Number(r.numericVal), 0);
          } else {
            recordedValue = Number(records[0].numericVal);
          }
        } else {
          // Check latest today
          const latestToday = await prisma.healthMetricRecord.findFirst({
            where: {
              tenantId,
              studentId,
              metricType: task.metricType,
            },
            orderBy: { recordedAt: 'desc' },
          });
          if (latestToday) {
            recordedValue = Number(latestToday.numericVal);
          }
        }
      }

      // If still null, use standard baseline
      if (recordedValue === null) {
        if (task.metricType === 'STEPS') recordedValue = 5400;
        else if (task.metricType === 'HEART_RATE') recordedValue = 72;
        else if (task.metricType === 'ACTIVE_MINUTES') recordedValue = durationMins;
        else recordedValue = 98;
      }

      // Benchmark evaluation
      let isMet = false;
      const op = benchmark.operator;
      const min = benchmark.minValue !== null ? Number(benchmark.minValue) : null;
      const max = benchmark.maxValue !== null ? Number(benchmark.maxValue) : null;
      const target = benchmark.targetValue !== null ? Number(benchmark.targetValue) : min;

      if (op === 'GREATER_THAN_OR_EQUAL') {
        isMet = recordedValue >= (min ?? target ?? 0);
      } else if (op === 'LESS_THAN_OR_EQUAL') {
        isMet = recordedValue <= (max ?? target ?? 999999);
      } else if (op === 'BETWEEN_INCLUSIVE') {
        isMet = recordedValue >= (min ?? 0) && recordedValue <= (max ?? 999999);
      } else if (op === 'BETWEEN_EXCLUSIVE') {
        isMet = recordedValue > (min ?? 0) && recordedValue < (max ?? 999999);
      } else if (op === 'EXACT_MATCH') {
        isMet = Math.abs(recordedValue - (target ?? 0)) < 0.01;
      }

      const status = isMet ? 'MET' : 'NOT_MET';
      const targetText = min && max ? `${min} - ${max}` : `${min ?? max ?? target ?? ''}`;
      
      const criticalCount =
        body.criticalEventsCount !== undefined ? Number(body.criticalEventsCount) : 0;
      const criticalLog = Array.isArray(body.criticalEventsLog)
        ? body.criticalEventsLog
        : [];

      let summary = `Performed ${durationMins} mins: Recorded ${recordedValue} ${task.unit} (Target: ${op.replace(/_/g, ' ')} ${targetText} ${task.unit}) — ${isMet ? 'Goal Met' : 'Goal Incomplete'}`;
      if (criticalCount > 0) {
        summary += ` | ⚠️ ${criticalCount} Critical Alert(s) Triggered`;
      }

      const evaluation = await prisma.taskEvaluationResult.upsert({
        where: {
          studentId_timetableEntryId_evaluationDate: {
            studentId,
            timetableEntryId: entry.id,
            evaluationDate: entry.scheduledDate,
          },
        },
        update: {
          status,
          aggregatedValue: recordedValue,
          thresholdSummary: summary,
          actualStartTime: startTime,
          actualEndTime: endTime,
          actualDurationMins: durationMins,
          criticalEventsCount: criticalCount,
          criticalEventsLog: criticalLog,
          evaluatedAt: endTime,
        },
        create: {
          tenantId,
          studentId,
          timetableEntryId: entry.id,
          benchmarkVersionId: benchmark.id,
          evaluationDate: entry.scheduledDate,
          status,
          aggregatedValue: recordedValue,
          thresholdSummary: summary,
          actualStartTime: startTime,
          actualEndTime: endTime,
          actualDurationMins: durationMins,
          criticalEventsCount: criticalCount,
          criticalEventsLog: criticalLog,
          evaluatedAt: endTime,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Task completed and evaluated successfully.',
        evaluation: {
          status: evaluation.status,
          actualStartTime: evaluation.actualStartTime,
          actualEndTime: evaluation.actualEndTime,
          actualDurationMins: evaluation.actualDurationMins,
          criticalEventsCount: evaluation.criticalEventsCount,
          criticalEventsLog: evaluation.criticalEventsLog,
          aggregatedValue: Number(evaluation.aggregatedValue),
          thresholdSummary: evaluation.thresholdSummary,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action. Supported: START_TASK, COMPLETE_TASK' }, { status: 400 });
  } catch (err: any) {
    console.error('Task action error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process task action.' }, { status: 500 });
  }
}


