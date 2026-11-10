import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { PlatformRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const superAdmins = await prisma.user.findMany({
      where: {
        platformRole: PlatformRole.SUPER_ADMIN,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: superAdmins,
      currentUserId: session.id,
    });
  } catch (error: any) {
    console.error("[API GET /admin/super-admins] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch super admins" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const body = await request.json();
    const { fullName, email, phone, password } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "Full Name is required." }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        tenantId: null,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "A platform administrator with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newSuperAdmin = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || null,
        passwordHash,
        platformRole: PlatformRole.SUPER_ADMIN,
        tenantId: null,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: newSuperAdmin,
      message: "Platform Super Admin created successfully.",
    });
  } catch (error: any) {
    console.error("[API POST /admin/super-admins] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create super admin" }, { status: 500 });
  }
}
