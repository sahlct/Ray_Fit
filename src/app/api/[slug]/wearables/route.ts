import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WearablesConnectorService } from '@/lib/wearables-connector';
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
        { deviceUuid: { contains: search.trim(), mode: 'insensitive' } },
        { vendorName: { contains: search.trim(), mode: 'insensitive' } },
        { modelNumber: { contains: search.trim(), mode: 'insensitive' } },
        { student: { fullName: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    const total = await prisma.wearableDevice.count({ where });

    const devices = await prisma.wearableDevice.findMany({
      where,
      include: {
        student: true,
        measurements: {
          take: 5,
          orderBy: { recordedAt: 'desc' },
        },
      },
      orderBy: { registeredAt: 'desc' },
      ...(isAll ? {} : { skip: (page - 1) * limit, take: limit }),
    });

    return NextResponse.json({
      devices,
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
    const { action } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    if (action === 'REGISTER_DEVICE') {
      const { deviceUuid, vendorName, modelNumber } = body;
      if (!deviceUuid || !vendorName) {
        return NextResponse.json(
          { error: 'Device UUID and Vendor Name are required.' },
          { status: 400 }
        );
      }

      const existing = await prisma.wearableDevice.findFirst({
        where: { tenantId: tenant.id, deviceUuid: deviceUuid.trim().toUpperCase() },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'A device with this UUID is already registered in this school.' },
          { status: 409 }
        );
      }

      const device = await WearablesConnectorService.registerDevice({
        tenantId: tenant.id,
        deviceUuid,
        vendorName,
        modelNumber,
      });

      await logAuditEvent({
        tenantId: tenant.id,
        action: 'WEARABLE_REGISTERED',
        module: 'WEARABLES',
        details: { deviceUuid: device.deviceUuid, vendor: device.vendorName },
      });

      return NextResponse.json({ success: true, device }, { status: 201 });
    }

    if (action === 'PAIR_DEVICE') {
      const { deviceId, studentId } = body;
      if (!deviceId || !studentId) {
        return NextResponse.json(
          { error: 'Device ID and Student ID are required.' },
          { status: 400 }
        );
      }

      const device = await WearablesConnectorService.pairDevice(
        deviceId,
        studentId,
        tenant.id
      );

      await logAuditEvent({
        tenantId: tenant.id,
        action: 'WEARABLE_PAIRED',
        module: 'WEARABLES',
        details: { deviceUuid: device.deviceUuid, student: device.student?.fullName },
      });

      return NextResponse.json({ success: true, device });
    }

    if (action === 'UNPAIR_DEVICE') {
      const { deviceId } = body;
      const device = await prisma.wearableDevice.update({
        where: { id: deviceId },
        data: { studentId: null, status: 'UNPAIRED' },
      });

      return NextResponse.json({ success: true, device });
    }

    if (action === 'SIMULATE_TELEMETRY') {
      const { deviceUuid, metricType, value, unit } = body;

      if (!deviceUuid || !metricType || value === undefined) {
        return NextResponse.json(
          { error: 'Device UUID, Metric Type, and Value are required.' },
          { status: 400 }
        );
      }

      const result = await WearablesConnectorService.ingestTelemetry({
        tenantId: tenant.id,
        readings: [
          {
            deviceUuid,
            metricType,
            value: Number(value),
            unit: unit || 'units',
            recordedAt: new Date(),
            batteryLevel: Math.floor(Math.random() * 20) + 75,
          },
        ],
      });

      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
