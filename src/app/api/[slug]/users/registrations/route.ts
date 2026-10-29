import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

// GET /api/[slug]/users/registrations - List registration requests with pagination & search
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const isAuthorized =
      session.platformRole === "SUPER_ADMIN" ||
      session.roleName === "School Admin" ||
      session.permissions?.includes("*") ||
      session.permissions?.includes("USERS:VIEW") ||
      session.permissions?.includes("USERS:MANAGE");

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        userTypes: {
          include: {
            customFields: {
              orderBy: { displayOrder: "asc" },
            },
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "10"));
    const search = url.searchParams.get("search") || url.searchParams.get("q") || "";
    const status = url.searchParams.get("status") || "ALL";
    const userTypeId = url.searchParams.get("userTypeId");

    const where: any = {
      tenantId: tenant.id,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (userTypeId && userTypeId !== "ALL") {
      where.userTypeId = userTypeId;
    }

    if (search.trim()) {
      where.OR = [
        { fullName: { contains: search.trim(), mode: "insensitive" } },
        { email: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const [total, requests] = await Promise.all([
      (prisma as any).registrationRequest.count({ where }),
      (prisma as any).registrationRequest.findMany({
        where,
        include: {
          userType: {
            include: {
              customFields: {
                orderBy: { displayOrder: "asc" },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      requests,
      userTypes: tenant.userTypes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    console.error("GET /api/[slug]/users/registrations error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/[slug]/users/registrations - Approve or Reject registration request
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const canManage =
      session.platformRole === "SUPER_ADMIN" ||
      session.roleName === "School Admin" ||
      session.permissions?.includes("*") ||
      session.permissions?.includes("USERS:MANAGE");

    if (!canManage) {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can approve or reject registrations." },
        { status: 403 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    const body = await req.json();
    const { requestId, action, reviewNotes } = body;

    if (!requestId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const registration = await (prisma as any).registrationRequest.findFirst({
      where: {
        id: requestId,
        tenantId: tenant.id,
      },
      include: {
        userType: true,
      },
    });

    if (!registration) {
      return NextResponse.json({ error: "Registration request not found." }, { status: 404 });
    }

    if (registration.status !== "PENDING") {
      return NextResponse.json(
        { error: `This request has already been ${registration.status.toLowerCase()}.` },
        { status: 400 }
      );
    }

    if (action === "REJECT") {
      const updated = await (prisma as any).registrationRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          reviewNotes: reviewNotes || "Rejected by administrator.",
          reviewedAt: new Date(),
          reviewedById: session.id,
        },
      });

      await logAuditEvent({
        tenantId: tenant.id,
        userId: session.id,
        action: "REGISTRATION_REQUEST_REJECTED",
        module: "REGISTRATIONS",
        details: {
          requestId,
          email: registration.email,
          fullName: registration.fullName,
          reviewNotes,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Registration application for ${registration.fullName} was rejected.`,
        request: updated,
      });
    }

    // Action === "APPROVE"
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email: registration.email.toLowerCase(),
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `A user with email ${registration.email} already exists in this tenant.` },
        { status: 400 }
      );
    }

    // Find role for userType
    let role = await prisma.role.findFirst({
      where: {
        tenantId: tenant.id,
        name: { equals: registration.userType.name, mode: "insensitive" },
      },
    });

    if (!role) {
      role = await prisma.role.findFirst({
        where: {
          tenantId: tenant.id,
        },
      });
    }

    if (!role) {
      // Create a role if none exist
      role = await prisma.role.create({
        data: {
          tenantId: tenant.id,
          name: registration.userType.name,
          description: `Auto-generated role for ${registration.userType.name}`,
          isSystem: false,
        },
      });
    }

    // Execute atomic transaction: Create user and update registration request
    const result = await prisma.$transaction(
      async (tx) => {
        const newUser = await tx.user.create({
          data: {
            tenantId: tenant.id,
            userTypeId: registration.userTypeId,
            roleId: role!.id,
            fullName: registration.fullName,
            email: registration.email.toLowerCase(),
            phone: registration.phone,
            passwordHash: registration.passwordHash,
            profileData: registration.profileData as any,
            isActive: true,
          },
        });

        const updatedRequest = await (tx as any).registrationRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            reviewNotes: reviewNotes || "Approved by organization administrator.",
            reviewedAt: new Date(),
            reviewedById: session.id,
          },
        });

        return { newUser, updatedRequest };
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );

    await logAuditEvent({
      tenantId: tenant.id,
      userId: session.id,
      action: "REGISTRATION_REQUEST_APPROVED",
      module: "REGISTRATIONS",
      details: {
        requestId,
        createdUserId: result.newUser.id,
        email: registration.email,
        fullName: registration.fullName,
        userTypeName: registration.userType.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Applicant ${registration.fullName} was successfully approved and activated as an official ${registration.userType.name}!`,
      user: result.newUser,
      request: result.updatedRequest,
    });
  } catch (err: any) {
    console.error("POST /api/[slug]/users/registrations error:", err);
    return NextResponse.json({ error: err.message || "Failed to process application." }, { status: 500 });
  }
}
