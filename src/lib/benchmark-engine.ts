import { BenchmarkOperator, EvaluationStatus } from '@prisma/client';
import { prisma } from './prisma';

export interface BenchmarkCriteria {
  operator: BenchmarkOperator;
  minValue?: number | null;
  maxValue?: number | null;
  targetValue?: number | null;
  unit: string;
}

export interface EvaluationOutcome {
  status: EvaluationStatus;
  thresholdSummary: string;
  aggregatedValue: number | null;
}

/**
 * Evaluates an aggregated numeric health measurement against a BenchmarkVersion rule.
 * Crucial Rule: Missing telemetry (null/undefined) MUST return NO_DATA and never NOT_MET.
 */
export function evaluateBenchmark(
  criteria: BenchmarkCriteria,
  actualValue: number | null | undefined
): EvaluationOutcome {
  if (actualValue === null || actualValue === undefined) {
    return {
      status: EvaluationStatus.NO_DATA,
      aggregatedValue: null,
      thresholdSummary: 'No wearable synchronization telemetry received for this evaluation window',
    };
  }

  const { operator, minValue, maxValue, targetValue, unit } = criteria;
  const val = Number(actualValue);
  let isMet = false;
  let targetDesc = '';

  switch (operator) {
    case BenchmarkOperator.GREATER_THAN_OR_EQUAL: {
      const target = minValue ?? targetValue ?? 0;
      isMet = val >= target;
      targetDesc = `>= ${target.toLocaleString()} ${unit}`;
      break;
    }
    case BenchmarkOperator.LESS_THAN_OR_EQUAL: {
      const target = maxValue ?? targetValue ?? 0;
      isMet = val <= target;
      targetDesc = `<= ${target.toLocaleString()} ${unit}`;
      break;
    }
    case BenchmarkOperator.BETWEEN_INCLUSIVE: {
      const min = minValue ?? 0;
      const max = maxValue ?? 0;
      isMet = val >= min && val <= max;
      targetDesc = `Between ${min.toLocaleString()} and ${max.toLocaleString()} ${unit} (inclusive)`;
      break;
    }
    case BenchmarkOperator.BETWEEN_EXCLUSIVE: {
      const min = minValue ?? 0;
      const max = maxValue ?? 0;
      isMet = val > min && val < max;
      targetDesc = `Between ${min.toLocaleString()} and ${max.toLocaleString()} ${unit} (exclusive)`;
      break;
    }
    case BenchmarkOperator.EXACT_MATCH: {
      const target = targetValue ?? minValue ?? 0;
      isMet = val === target;
      targetDesc = `Exactly ${target.toLocaleString()} ${unit}`;
      break;
    }
    default:
      isMet = false;
      targetDesc = 'Undefined condition';
  }

  const status = isMet ? EvaluationStatus.MET : EvaluationStatus.NOT_MET;
  const verb = isMet ? 'Achieved' : 'Recorded';
  const thresholdSummary = `${verb} ${val.toLocaleString()} ${unit} (Target: ${targetDesc})`;

  return {
    status,
    aggregatedValue: val,
    thresholdSummary,
  };
}

/**
 * Evaluates all timetable assignments for a given date and tenant.
 * Can be triggered on-demand via API or background task.
 */
export async function runDailyEvaluationWorker(tenantId: string, date: Date = new Date()) {
  const evalDate = new Date(date);
  evalDate.setHours(0, 0, 0, 0);

  // Find all active timetable assignments for this date
  const timetableEntries = await prisma.timetableAssignment.findMany({
    where: {
      tenantId,
      scheduledDate: evalDate,
    },
    include: {
      assignment: {
        include: {
          task: true,
          batch: {
            include: {
              enrollments: {
                where: { isActive: true },
                include: { student: true },
              },
            },
          },
          class: {
            include: {
              batches: {
                include: {
                  enrollments: {
                    where: { isActive: true },
                    include: { student: true },
                  },
                },
              },
            },
          },
        },
      },
      benchmarkVersion: true,
    },
  });

  let processedCount = 0;

  for (const entry of timetableEntries) {
    const { assignment, benchmarkVersion } = entry;
    const task = assignment.task;

    // Collect eligible students
    const studentMap = new Map<string, string>(); // studentId -> studentName
    if (assignment.batch) {
      assignment.batch.enrollments.forEach((e) => studentMap.set(e.studentId, e.student.fullName));
    } else if (assignment.class) {
      assignment.class.batches.forEach((b) =>
        b.enrollments.forEach((e) => studentMap.set(e.studentId, e.student.fullName))
      );
    }

    const nextDay = new Date(evalDate);
    nextDay.setDate(evalDate.getDate() + 1);

    for (const [studentId] of studentMap.entries()) {
      // Find telemetry records for this student on this date for this metric
      const records = await prisma.healthMetricRecord.findMany({
        where: {
          tenantId,
          studentId,
          metricType: task.metricType,
          recordedAt: {
            gte: evalDate,
            lt: nextDay,
          },
        },
      });

      let actualValue: number | null = null;
      if (records.length > 0) {
        // Aggregate: for STEPS/CALORIES, sum; for HR/BP/SPO2, avg or latest
        if (task.metricType === 'STEPS' || task.metricType === 'CALORIES_BURNED') {
          actualValue = records.reduce((sum, r) => sum + Number(r.numericVal), 0);
        } else {
          // Average for heart rate, blood pressure, etc.
          const sum = records.reduce((s, r) => s + Number(r.numericVal), 0);
          actualValue = Math.round((sum / records.length) * 10) / 10;
        }
      }

      const outcome = evaluateBenchmark(
        {
          operator: benchmarkVersion.operator,
          minValue: benchmarkVersion.minValue ? Number(benchmarkVersion.minValue) : null,
          maxValue: benchmarkVersion.maxValue ? Number(benchmarkVersion.maxValue) : null,
          targetValue: benchmarkVersion.targetValue ? Number(benchmarkVersion.targetValue) : null,
          unit: task.unit,
        },
        actualValue
      );

      // Upsert evaluation result
      await prisma.taskEvaluationResult.upsert({
        where: {
          studentId_timetableEntryId_evaluationDate: {
            studentId,
            timetableEntryId: entry.id,
            evaluationDate: evalDate,
          },
        },
        create: {
          tenantId,
          studentId,
          timetableEntryId: entry.id,
          benchmarkVersionId: benchmarkVersion.id,
          evaluationDate: evalDate,
          status: outcome.status,
          aggregatedValue: outcome.aggregatedValue,
          thresholdSummary: outcome.thresholdSummary,
        },
        update: {
          status: outcome.status,
          aggregatedValue: outcome.aggregatedValue,
          thresholdSummary: outcome.thresholdSummary,
          evaluatedAt: new Date(),
        },
      });

      processedCount++;
    }
  }

  return { processedCount, entriesCount: timetableEntries.length };
}
