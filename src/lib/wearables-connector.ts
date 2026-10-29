import { HealthMetricType } from '@prisma/client';
import { prisma } from './prisma';
import { runDailyEvaluationWorker } from './benchmark-engine';

export interface RawTelemetryReading {
  deviceUuid: string;
  metricType: HealthMetricType;
  value: number;
  unit: string;
  recordedAt: string | Date;
  batteryLevel?: number;
}

export interface IngestPayload {
  tenantId: string;
  vendorName?: string;
  readings: RawTelemetryReading[];
}

export interface IngestResult {
  success: boolean;
  insertedCount: number;
  unpairedCount: number;
  errors: string[];
}

export class WearablesConnectorService {
  /**
   * Registers a new wearable device in the school fleet
   */
  static async registerDevice(data: {
    tenantId: string;
    deviceUuid: string;
    vendorName: string;
    modelNumber?: string;
  }) {
    return await prisma.wearableDevice.create({
      data: {
        tenantId: data.tenantId,
        deviceUuid: data.deviceUuid.trim().toUpperCase(),
        vendorName: data.vendorName,
        modelNumber: data.modelNumber,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Pairs a wearable device to a specific student
   */
  static async pairDevice(deviceId: string, studentId: string, tenantId: string) {
    // Check if device is already assigned
    const device = await prisma.wearableDevice.findFirst({
      where: { id: deviceId, tenantId },
    });
    if (!device) throw new Error('Device not found.');

    // Remove any existing pairing for this student if 1:1 pairing
    await prisma.wearableDevice.updateMany({
      where: { tenantId, studentId },
      data: { studentId: null, status: 'UNPAIRED' },
    });

    return await prisma.wearableDevice.update({
      where: { id: deviceId },
      data: {
        studentId,
        status: 'ACTIVE',
      },
      include: { student: true },
    });
  }

  /**
   * Ingests a batch of telemetry measurements from wearable devices or simulators
   */
  static async ingestTelemetry(payload: IngestPayload): Promise<IngestResult> {
    const { tenantId, readings } = payload;
    let insertedCount = 0;
    let unpairedCount = 0;
    const errors: string[] = [];
    const datesToRecalculate = new Set<string>();

    for (const r of readings) {
      try {
        const uuid = r.deviceUuid.trim().toUpperCase();
        // Lookup device
        const device = await prisma.wearableDevice.findFirst({
          where: { tenantId, deviceUuid: uuid },
          include: { student: true },
        });

        if (!device) {
          errors.push(`Device with UUID ${uuid} is not registered for this school.`);
          continue;
        }

        if (!device.studentId) {
          unpairedCount++;
          errors.push(`Device ${uuid} is active but not paired to any student.`);
          continue;
        }

        const recordedAt = new Date(r.recordedAt);
        const dateKey = recordedAt.toISOString().split('T')[0];
        datesToRecalculate.add(dateKey);

        // Store health record
        await prisma.healthMetricRecord.create({
          data: {
            tenantId,
            studentId: device.studentId,
            deviceId: device.id,
            metricType: r.metricType,
            numericVal: r.value,
            unit: r.unit,
            recordedAt,
          },
        });

        // Update device telemetry status
        await prisma.wearableDevice.update({
          where: { id: device.id },
          data: {
            lastSyncAt: new Date(),
            batteryLevel: r.batteryLevel ?? device.batteryLevel,
          },
        });

        insertedCount++;
      } catch (err: any) {
        errors.push(`Error processing reading for ${r.deviceUuid}: ${err.message}`);
      }
    }

    // Trigger recalculation for affected dates to resolve late-arriving records
    for (const dStr of datesToRecalculate) {
      try {
        await runDailyEvaluationWorker(tenantId, new Date(dStr));
      } catch (e) {
        console.error('Error during recalculation:', e);
      }
    }

    return {
      success: insertedCount > 0 || readings.length === 0,
      insertedCount,
      unpairedCount,
      errors,
    };
  }
}
