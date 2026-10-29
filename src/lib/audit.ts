import { prisma } from './prisma';

export async function logAuditEvent(params: {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  module: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId || null,
        userId: params.userId || null,
        action: params.action,
        module: params.module,
        details: params.details || {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
