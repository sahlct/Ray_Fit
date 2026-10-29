import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ slug: string; bannerId: string }> }
) {
  try {
    const { slug, bannerId } = await props.params;
    const body = await req.json();

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    let existingBanner: any;
    if ((prisma as any).adBanner?.findFirst) {
      existingBanner = await (prisma as any).adBanner.findFirst({
        where: { id: bannerId, tenantId: tenant.id },
      });
    } else {
      const rows: any[] = await prisma.$queryRaw`
        SELECT * FROM "AdBanner" WHERE "id" = ${bannerId} AND "tenantId" = ${tenant.id} LIMIT 1
      `;
      existingBanner = rows[0] || null;
    }

    if (!existingBanner) {
      return NextResponse.json({ error: "Banner not found." }, { status: 404 });
    }

    const newTitle = body.title !== undefined ? body.title.trim() : existingBanner.title;
    const newImageUrl = body.imageUrl !== undefined ? body.imageUrl.trim() : existingBanner.imageUrl;
    const newTargetUrl = body.targetUrl !== undefined ? (body.targetUrl ? body.targetUrl.trim() : null) : existingBanner.targetUrl;
    const newPlacement = body.placement !== undefined ? body.placement : existingBanner.placement;
    const newSortOrder = body.sortOrder !== undefined ? Number(body.sortOrder) : existingBanner.sortOrder;
    const newIsActive = body.isActive !== undefined ? Boolean(body.isActive) : existingBanner.isActive;

    let updated: any;
    if ((prisma as any).adBanner?.update) {
      updated = await (prisma as any).adBanner.update({
        where: { id: bannerId },
        data: {
          title: newTitle,
          imageUrl: newImageUrl,
          targetUrl: newTargetUrl,
          placement: newPlacement,
          sortOrder: newSortOrder,
          isActive: newIsActive,
        },
      });
    } else {
      await prisma.$executeRaw`
        UPDATE "AdBanner"
        SET "title" = ${newTitle},
            "imageUrl" = ${newImageUrl},
            "targetUrl" = ${newTargetUrl},
            "placement" = ${newPlacement},
            "sortOrder" = ${newSortOrder},
            "isActive" = ${newIsActive},
            "updatedAt" = NOW()
        WHERE "id" = ${bannerId}
      `;
      updated = {
        ...existingBanner,
        title: newTitle,
        imageUrl: newImageUrl,
        targetUrl: newTargetUrl,
        placement: newPlacement,
        sortOrder: newSortOrder,
        isActive: newIsActive,
      };
    }

    return NextResponse.json({ success: true, banner: updated });
  } catch (err: any) {
    console.error("Update banner error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ slug: string; bannerId: string }> }
) {
  try {
    const { slug, bannerId } = await props.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    if ((prisma as any).adBanner?.delete) {
      await (prisma as any).adBanner.delete({
        where: { id: bannerId },
      });
    } else {
      await prisma.$executeRaw`DELETE FROM "AdBanner" WHERE "id" = ${bannerId} AND "tenantId" = ${tenant.id}`;
    }

    await logAuditEvent({
      tenantId: tenant.id,
      action: "BANNER_DELETED",
      module: "MARKETING",
      details: { bannerId },
    });

    return NextResponse.json({ success: true, message: "Banner deleted." });
  } catch (err: any) {
    console.error("Delete banner error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
