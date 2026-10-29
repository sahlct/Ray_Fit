import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'ray_fit_super_secret_jwt_key_2026_fitness_health_secure_token'
);

const SESSION_COOKIE_NAME = 'rayfit_session';

interface SessionPayload {
  id: string;
  email: string;
  platformRole: 'SUPER_ADMIN' | 'TENANT_USER';
  tenantId: string | null;
  tenantSlug?: string | null;
  roleName?: string | null;
  userTypeSlug?: string | null;
  permissions?: string[];
}

async function getMiddlewareSession(request: NextRequest): Promise<SessionPayload | null> {
  // Support Bearer token from Mobile App as well as session cookies
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as unknown as SessionPayload;
    } catch {
      return null;
    }
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;


  // 1. Skip static assets, images, next internals, auth and mobile endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/mobile') ||
    pathname.match(/\.(png|jpg|jpeg|svg|css|js|webp)$/)
  ) {
    return NextResponse.next();
  }

  const session = await getMiddlewareSession(request);
  const segments = pathname.split('/').filter(Boolean);
  const potentialSlug = segments[0];

  // 2. Super Admin Route Protection (/admin and /api/admin)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!session) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.platformRole !== 'SUPER_ADMIN') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Forbidden: Super Admin platform role required.' },
          { status: 403 }
        );
      }
      // Redirect company admin back to their own company portal
      const targetSlug = session.tenantSlug || 'login';
      return NextResponse.redirect(new URL(`/${targetSlug}/dashboard`, request.url));
    }

    return NextResponse.next();
  }

  // 3. Multi-Tenant Scoping & Role-Based Access Control
  if (potentialSlug && potentialSlug !== 'admin' && potentialSlug !== 'api' && potentialSlug !== 'login') {
    // Check if it's a public tenant page: e.g. /[slug]/login or /[slug]/register
    const isTenantLogin = segments[1] === 'login';
    const isPublicTenantPage = isTenantLogin || segments[1] === 'register';

    if (!session && !isPublicTenantPage) {
      const loginUrl = new URL(`/${potentialSlug}/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session) {
      // If user is a tenant user, prevent accessing any other tenant's portal or API
      if (session.platformRole === 'TENANT_USER' && session.tenantSlug && session.tenantSlug !== potentialSlug) {
        // Cross-tenant access blocked!
        return NextResponse.redirect(new URL(`/${session.tenantSlug}/dashboard`, request.url));
      }

      // If logged in and browsing tenant login page, redirect directly to dashboard
      if (isTenantLogin && session.tenantSlug === potentialSlug) {
        return NextResponse.redirect(new URL(`/${potentialSlug}/dashboard`, request.url));
      }

      // Role-Based Access Control (RBAC) within Tenant
      const isSchoolAdmin =
        session.platformRole === 'SUPER_ADMIN' ||
        session.roleName === 'School Admin' ||
        session.permissions?.includes('*') ||
        session.permissions?.includes('TENANTS:MANAGE') ||
        session.permissions?.includes('USERS:MANAGE') ||
        session.permissions?.includes('ROLES:MANAGE');

      const isStudent =
        !isSchoolAdmin &&
        (session.roleName?.toLowerCase() === 'student' || session.userTypeSlug === 'student');

      if (isStudent) {
        // Administrative pages strictly forbidden for Student role
        const adminOnlySubpaths = ['users', 'roles', 'audit', 'classes'];
        const currentSubPath = segments[1];
        if (currentSubPath && adminOnlySubpaths.includes(currentSubPath)) {
          return NextResponse.redirect(new URL(`/${potentialSlug}/dashboard`, request.url));
        }
      }
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-slug', potentialSlug);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 4. API Tenant Boundary & Role Protection: /api/[slug]/...
  if (pathname.startsWith('/api/') && segments.length >= 2) {
    const apiTenantSlug = segments[1];
    const isPublicApi = segments[2] === 'register';
    if (apiTenantSlug !== 'admin' && apiTenantSlug !== 'auth' && apiTenantSlug !== 'mobile' && !isPublicApi) {
      if (!session) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      }

      if (session.platformRole === 'TENANT_USER' && session.tenantSlug) {
        if (session.tenantSlug !== apiTenantSlug) {
          return NextResponse.json(
            { error: 'Unauthorized: Cross-tenant resource access is prohibited.' },
            { status: 403 }
          );
        }
      }

      // RBAC for APIs: Students cannot access administrative mutations/endpoints
      const isSchoolAdmin =
        session.platformRole === 'SUPER_ADMIN' ||
        session.roleName === 'School Admin' ||
        session.permissions?.includes('*') ||
        session.permissions?.includes('TENANTS:MANAGE') ||
        session.permissions?.includes('USERS:MANAGE') ||
        session.permissions?.includes('ROLES:MANAGE');

      const isStudent =
        !isSchoolAdmin &&
        (session.roleName?.toLowerCase() === 'student' || session.userTypeSlug === 'student');

      const restrictedSubApis = ['roles', 'users', 'user-types', 'fields'];
      const apiAction = segments[2];
      if (isStudent && apiAction && restrictedSubApis.includes(apiAction)) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient privileges for this role.' },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
