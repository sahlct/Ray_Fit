import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, setSessionCookie } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, tenantSlug } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const result = await authenticateUser(email, password, tenantSlug);

    if (!result.success || !result.session) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed.' },
        { status: 401 }
      );
    }

    await setSessionCookie(result.session);

    await logAuditEvent({
      tenantId: result.session.tenantId,
      userId: result.session.id,
      action: 'USER_LOGIN',
      module: 'AUTH',
      details: { email: result.session.email, role: result.session.roleName },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent') || 'Browser',
    });

    const redirectUrl =
      result.session.platformRole === 'SUPER_ADMIN'
        ? '/admin'
        : `/${result.session.tenantSlug || tenantSlug}/dashboard`;

    return NextResponse.json({
      success: true,
      redirectUrl,
      user: result.session,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}
