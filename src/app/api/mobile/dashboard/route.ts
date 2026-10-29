import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
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

    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Past 7 days start
    const past7DaysStart = new Date(targetDate);
    past7DaysStart.setDate(past7DaysStart.getDate() - 6);
    past7DaysStart.setHours(0, 0, 0, 0);

    // 1. Fetch today's records
    const todayRecords = await prisma.healthMetricRecord.findMany({
      where: {
        tenantId,
        studentId,
        recordedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { recordedAt: 'asc' },
    });

    // 2. Fetch past 7 days records for trend graphs
    const weekRecords = await prisma.healthMetricRecord.findMany({
      where: {
        tenantId,
        studentId,
        recordedAt: {
          gte: past7DaysStart,
          lte: endOfDay,
        },
      },
      orderBy: { recordedAt: 'asc' },
    });

    // Aggregate today metrics
    let totalSteps = 0;
    let totalCalories = 0;
    let totalSleepMinutes = 0;
    let latestHeartRate: number | null = null;
    let minHeartRate: number | null = null;
    let maxHeartRate: number | null = null;
    let latestSpO2: number | null = null;
    let latestSystolic: number | null = null;
    let latestDiastolic: number | null = null;
    let activeMinutes = 0;

    const hrTimeline: { time: string; value: number }[] = [];
    const hourlySteps: Record<number, number> = {};

    for (let h = 0; h < 24; h++) hourlySteps[h] = 0;

    for (const r of todayRecords) {
      const val = Number(r.numericVal);
      const timeStr = r.recordedAt.toISOString();
      const hour = new Date(r.recordedAt).getHours();

      switch (r.metricType) {
        case 'STEPS':
          totalSteps += val;
          hourlySteps[hour] = (hourlySteps[hour] || 0) + val;
          break;
        case 'CALORIES_BURNED':
          totalCalories += val;
          break;
        case 'SLEEP_DURATION_MINUTES':
          totalSleepMinutes += val;
          break;
        case 'ACTIVE_MINUTES':
          activeMinutes += val;
          break;
        case 'HEART_RATE':
          latestHeartRate = val;
          if (minHeartRate === null || val < minHeartRate) minHeartRate = val;
          if (maxHeartRate === null || val > maxHeartRate) maxHeartRate = val;
          hrTimeline.push({
            time: `${hour.toString().padStart(2, '0')}:${new Date(r.recordedAt).getMinutes().toString().padStart(2, '0')}`,
            value: val,
          });
          break;
        case 'SPO2_PERCENTAGE':
          latestSpO2 = val;
          break;
        case 'BLOOD_PRESSURE_SYSTOLIC':
          latestSystolic = val;
          break;
        case 'BLOOD_PRESSURE_DIASTOLIC':
          latestDiastolic = val;
          break;
      }
    }

    // Weekly steps trend (day by day)
    const dailyStepsTrend: { date: string; day: string; steps: number }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(targetDate);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dStart = new Date(d);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);

      const dayStepRecs = weekRecords.filter(
        (r) => r.metricType === 'STEPS' && r.recordedAt >= dStart && r.recordedAt <= dEnd
      );
      const dayTotal = dayStepRecs.reduce((acc, curr) => acc + Number(curr.numericVal), 0);

      dailyStepsTrend.push({
        date: dStr,
        day: dayNames[d.getDay()],
        steps: dayTotal,
      });
    }

    // 3. Assigned wearable device
    const pairedDevice = await prisma.wearableDevice.findFirst({
      where: { tenantId, studentId },
    });

    // Fetch active banners for mobile dashboard carousel
    const banners = await prisma.adBanner.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      banners,
      summary: {
        date: targetDate.toISOString().split('T')[0],
        steps: totalSteps,
        stepGoal: 8000,
        calories: totalCalories,
        caloriesGoal: 500,
        sleepMinutes: totalSleepMinutes,
        sleepGoalMinutes: 480, // 8 hours
        activeMinutes,
        heartRate: {
          latest: latestHeartRate,
          min: minHeartRate,
          max: maxHeartRate,
        },
        spO2: latestSpO2,
        bloodPressure: {
          systolic: latestSystolic,
          diastolic: latestDiastolic,
        },
      },
      charts: {
        hourlySteps: Object.entries(hourlySteps).map(([h, s]) => ({
          hour: parseInt(h),
          steps: s,
        })),
        heartRateTimeline: hrTimeline.slice(-30), // latest 30 points
        weeklySteps: dailyStepsTrend,
      },
      device: pairedDevice
        ? {
            id: pairedDevice.id,
            deviceUuid: pairedDevice.deviceUuid,
            vendorName: pairedDevice.vendorName,
            modelNumber: pairedDevice.modelNumber,
            batteryLevel: pairedDevice.batteryLevel,
            status: pairedDevice.status,
            lastSyncAt: pairedDevice.lastSyncAt,
          }
        : null,
    });
  } catch (err: any) {
    console.error('Dashboard API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch mobile dashboard.' },
      { status: 500 }
    );
  }
}

