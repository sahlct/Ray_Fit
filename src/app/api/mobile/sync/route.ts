import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';
import { runDailyEvaluationWorker } from '@/lib/benchmark-engine';
import { HealthMetricType } from '@prisma/client';

export interface MobileTelemetryItem {
  metricType: HealthMetricType;
  value: number;
  unit: string;
  recordedAt: string | Date;
  batteryLevel?: number;
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { deviceUuid, vendorName, modelNumber, batteryLevel, readings } = body;

    if (!deviceUuid) {
      return NextResponse.json(
        { error: 'deviceUuid (band MAC address) is required.' },
        { status: 400 }
      );
    }

    const cleanUuid = deviceUuid.trim().toUpperCase();

    // 2. Ensure device is registered and paired to this student
    let device = await prisma.wearableDevice.findFirst({
      where: {
        tenantId,
        deviceUuid: cleanUuid,
      },
    });

    if (!device) {
      // Auto-register device for this student in this tenant
      device = await prisma.wearableDevice.create({
        data: {
          tenantId,
          studentId,
          deviceUuid: cleanUuid,
          vendorName: vendorName || 'Rays Band',
          modelNumber: modelNumber || 'RB-Pro',
          batteryLevel: typeof batteryLevel === 'number' ? batteryLevel : 100,
          status: 'ACTIVE',
          lastSyncAt: new Date(),
        },
      });
    } else {
      // Ensure it is paired to current student and update battery/sync status
      device = await prisma.wearableDevice.update({
        where: { id: device.id },
        data: {
          studentId,
          status: 'ACTIVE',
          lastSyncAt: new Date(),
          batteryLevel: typeof batteryLevel === 'number' ? batteryLevel : device.batteryLevel,
          modelNumber: modelNumber || device.modelNumber,
        },
      });
    }

    // 3. Process telemetry readings
    const readingsList: MobileTelemetryItem[] = Array.isArray(readings) ? readings : [];
    let insertedCount = 0;
    const datesToRecalculate = new Set<string>();

    for (const r of readingsList) {
      try {
        const recordedAt = r.recordedAt ? new Date(r.recordedAt) : new Date();
        const dateKey = recordedAt.toISOString().split('T')[0];
        datesToRecalculate.add(dateKey);

        await prisma.healthMetricRecord.create({
          data: {
            tenantId,
            studentId,
            deviceId: device.id,
            metricType: r.metricType,
            numericVal: r.value,
            unit: r.unit || 'units',
            recordedAt,
            rawPayload: {
              source: 'Flutter Mobile App',
              deviceUuid: cleanUuid,
              vendorName: vendorName || 'Rays Band',
            },
          },
        });
        insertedCount++;
      } catch (err: any) {
        console.warn(`Error storing reading: ${err.message}`);
      }
    }

    // 4. Trigger evaluation engine for all affected dates
    // If no specific dates in readings, at least evaluate today
    if (datesToRecalculate.size === 0) {
      datesToRecalculate.add(new Date().toISOString().split('T')[0]);
    }

    const evaluationResults = [];
    for (const dStr of datesToRecalculate) {
      try {
        const evalRes = await runDailyEvaluationWorker(tenantId, new Date(dStr));
        evaluationResults.push({ date: dStr, ...evalRes });
      } catch (evalErr) {
        console.error('Error running daily evaluation:', evalErr);
      }
    }

    // 5. Fetch updated task evaluation results for this student
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestEvaluations = await prisma.taskEvaluationResult.findMany({
      where: {
        tenantId,
        studentId,
        evaluationDate: today,
      },
      include: {
        timetableEntry: {
          include: {
            assignment: {
              include: {
                task: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${insertedCount} band measurements.`,
      device: {
        id: device.id,
        deviceUuid: device.deviceUuid,
        vendorName: device.vendorName,
        batteryLevel: device.batteryLevel,
        lastSyncAt: device.lastSyncAt,
      },
      insertedCount,
      recalculatedDates: Array.from(datesToRecalculate),
      evaluations: latestEvaluations.map((ev) => ({
        taskId: ev.timetableEntry?.assignment?.taskId,
        taskTitle: ev.timetableEntry?.assignment?.task?.title,
        status: ev.status,
        aggregatedValue: ev.aggregatedValue ? Number(ev.aggregatedValue) : null,
        thresholdSummary: ev.thresholdSummary,
      })),
    });
  } catch (err: any) {
    console.error('Mobile sync error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to sync band telemetry.' },
      { status: 500 }
    );
  }
}

