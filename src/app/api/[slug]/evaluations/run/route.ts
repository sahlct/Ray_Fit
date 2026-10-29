import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runDailyEvaluationWorker } from '@/lib/benchmark-engine';
import { logAuditEvent } from '@/lib/audit';

export async function POST(
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

    const result = await runDailyEvaluationWorker(tenant.id, new Date());

    await logAuditEvent({
      tenantId: tenant.id,
      action: 'DAILY_EVALUATION_EXECUTED',
      module: 'BENCHMARKS',
      details: { processedCount: result.processedCount, entries: result.entriesCount },
    });

    return NextResponse.json({
      success: true,
      message: `Daily health evaluation completed successfully. Processed ${result.processedCount} student evaluations.`,
      result,
    });
  } catch (err: any) {
    console.error('Evaluation run error:', err);
    return NextResponse.json(
      { error: err.message || 'Evaluation run failed' },
      { status: 500 }
    );
  }
}
