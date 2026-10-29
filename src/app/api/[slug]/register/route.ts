import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// GET /api/[slug]/register - Fetch public tenant details and available user types with custom fields
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        status: true,
        userTypes: {
          include: {
            customFields: {
              orderBy: { displayOrder: "asc" },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant organization not found." }, { status: 404 });
    }

    if (tenant.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This organization portal is currently inactive. Please contact your administrator." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
      },
      userTypes: tenant.userTypes,
    });
  } catch (err: any) {
    console.error("GET /api/[slug]/register error:", err);
    return NextResponse.json({ error: "Failed to load registration configuration." }, { status: 500 });
  }
}

// POST /api/[slug]/register - Submit outer registration request
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
      return NextResponse.json({ error: "Tenant organization not found." }, { status: 404 });
    }

    if (tenant.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This organization portal is currently inactive." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      userTypeId,
      fullName,
      email,
      phone,
      password,
      profileData = {},
    } = body;

    // Validation
    if (!userTypeId || !fullName?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Full Name, Email, Password, and User Type are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify userType belongs to tenant
    const userType = await prisma.userType.findFirst({
      where: {
        id: userTypeId,
        tenantId: tenant.id,
      },
      include: {
        customFields: true,
      },
    });

    if (!userType) {
      return NextResponse.json({ error: "Invalid user type selected." }, { status: 400 });
    }

    // Check required custom fields
    for (const field of userType.customFields) {
      if (field.isRequired) {
        const val = profileData[field.fieldKey];
        if (val === undefined || val === null || val === "") {
          return NextResponse.json(
            { error: `The custom field "${field.label}" is required.` },
            { status: 400 }
          );
        }
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in directly." },
        { status: 400 }
      );
    }

    // Check if there is already a pending request
    const existingRequest = await (prisma as any).registrationRequest.findFirst({
      where: {
        tenantId: tenant.id,
        email: normalizedEmail,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error:
            "A registration request with this email is already awaiting admin approval. Please wait for confirmation.",
        },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create registration request record
    const registration = await (prisma as any).registrationRequest.create({
      data: {
        tenantId: tenant.id,
        userTypeId: userType.id,
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : null,
        passwordHash,
        profileData,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Registration request for ${fullName.trim()} submitted successfully! The school administrator has been notified and will review your profile shortly.`,
      requestId: registration.id,
    });
  } catch (err: any) {
    console.error("POST /api/[slug]/register error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process registration request." },
      { status: 500 }
    );
  }
}
