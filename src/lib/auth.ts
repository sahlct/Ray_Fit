import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'ray_fit_super_secret_jwt_key_2026_fitness_health_secure_token'
);

const SESSION_COOKIE_NAME = 'rayfit_session';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  platformRole: 'SUPER_ADMIN' | 'TENANT_USER';
  tenantId: string | null;
  tenantSlug?: string | null;
  tenantName?: string | null;
  roleId?: string | null;
  roleName?: string | null;
  userTypeId?: string | null;
  userTypeSlug?: string | null;
  permissions: string[]; // ["USERS:VIEW", "TASKS:ASSIGN", etc.]
}

export async function signSessionToken(payload: SessionUser): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function setSessionCookie(sessionUser: SessionUser) {
  const token = await signSessionToken(sessionUser);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function authenticateUser(
  email: string,
  plainPassword: string,
  tenantSlug?: string
): Promise<{ success: boolean; session?: SessionUser; error?: string }> {
  // If tenantSlug is provided, look up the tenant first
  let tenantId: string | null = null;
  let tenant = null;

  if (tenantSlug && tenantSlug !== 'admin') {
    tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return { success: false, error: 'School/Organization not found.' };
    }

    if (tenant.status === 'SUSPENDED') {
      return { success: false, error: 'This organization account is currently suspended.' };
    }

    tenantId = tenant.id;
  }

  // Find user
  const user = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase().trim(),
      ...(tenantId ? { tenantId } : {}),
      ...(tenantSlug === 'admin' ? { platformRole: 'SUPER_ADMIN' } : {}),
    },
    include: {
      tenant: true,
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
      userType: true,
    },
  });

  if (!user) {
    return { success: false, error: 'Invalid email or password.' };
  }

  if (!user.isActive) {
    return { success: false, error: 'This account has been deactivated.' };
  }

  const passwordValid = await bcrypt.compare(plainPassword, user.passwordHash);
  if (!passwordValid) {
    return { success: false, error: 'Invalid email or password.' };
  }

  // Compile permissions
  const permissions: string[] = [];
  if (user.platformRole === 'SUPER_ADMIN') {
    permissions.push('*');
  } else if (user.role?.permissions) {
    for (const rp of user.role.permissions) {
      permissions.push(`${rp.permission.module}:${rp.permission.action}`);
    }
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    platformRole: user.platformRole,
    tenantId: user.tenantId,
    tenantSlug: user.tenant?.slug || null,
    tenantName: user.tenant?.name || null,
    roleId: user.roleId,
    roleName: user.role?.name || null,
    userTypeId: user.userTypeId,
    userTypeSlug: user.userType?.slug || null,
    permissions,
  };

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { success: true, session: sessionUser };
}

export function hasPermission(
  session: SessionUser | null,
  module: string,
  action: string
): boolean {
  if (!session) return false;
  if (session.platformRole === 'SUPER_ADMIN') return true;
  if (session.permissions.includes('*')) return true;
  return (
    session.permissions.includes(`${module}:${action}`) ||
    session.permissions.includes(`${module}:MANAGE`)
  );
}
