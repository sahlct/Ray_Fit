import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  await clearSessionCookie();
  const referer = req.headers.get('referer');
  // If request expects JSON
  if (req.headers.get('accept')?.includes('application/json')) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(new URL('/', req.url));
}

export async function GET(req: NextRequest) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL('/', req.url));
}
