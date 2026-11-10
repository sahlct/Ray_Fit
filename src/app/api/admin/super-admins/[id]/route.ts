import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { PlatformRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { fullName, phone, password, isActive } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser || targetUser.platformRole !== PlatformRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Platform Super Admin not found." }, { status: 404 });
    }

    // Safety: prevent deactivating own active account
    if (id === session.id && isActive === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own active super admin account." },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (fullName && fullName.trim()) updateData.fullName = fullName.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (password && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
      }
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Platform Super Admin updated successfully.",
    });
  } catch (error: any) {
    console.error("[API PATCH /admin/super-admins/[id]] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update super admin" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const { id } = await params;

    if (id === session.id) {
      return NextResponse.json(
        { error: "You cannot delete your own active super admin account." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser || targetUser.platformRole !== PlatformRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Platform Super Admin not found." }, { status: 404 });
    }

    // Check count of active super admins to ensure at least one super admin remains
    const superAdminCount = await prisma.user.count({
      where: {
        platformRole: PlatformRole.SUPER_ADMIN,
        isActive: true,
      },
    });

    if (superAdminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the sole remaining active Platform Super Admin." },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Platform Super Admin removed successfully.",
    });
  } catch (error: any) {
    console.error("[API DELETE /admin/super-admins/[id]] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete super admin" }, { status: 500 });
  }
}

