import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    let banners: any[] = [];
    if ((prisma as any).adBanner?.findMany) {
      banners = await (prisma as any).adBanner.findMany({
        where: { tenantId: tenant.id },
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "desc" },
        ],
      });
    } else {
      banners = await prisma.$queryRaw`
        SELECT "id", "tenantId", "title", "imageUrl", "targetUrl", "placement", "sortOrder", "isActive", "createdAt", "updatedAt"
        FROM "AdBanner"
        WHERE "tenantId" = ${tenant.id}
        ORDER BY "sortOrder" ASC, "createdAt" DESC
      `;
    }

    return NextResponse.json({
      success: true,
      banners,
    });
  } catch (err: any) {
    console.error("Fetch banners error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const body = await req.json();
    const { title, imageUrl, targetUrl, placement, sortOrder, isActive } = body;

    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: "Title and Image URL are required." },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    const trimmedTitle = title.trim();
    const trimmedImageUrl = imageUrl.trim();
    const cleanTargetUrl = targetUrl?.trim() || null;
    const placementVal = placement || "APP_DASHBOARD_CAROUSEL";
    const sortVal = typeof sortOrder === "number" ? sortOrder : 0;
    const activeVal = isActive !== undefined ? Boolean(isActive) : true;

    let banner: any;
    if ((prisma as any).adBanner?.create) {
      banner = await (prisma as any).adBanner.create({
        data: {
          tenantId: tenant.id,
          title: trimmedTitle,
          imageUrl: trimmedImageUrl,
          targetUrl: cleanTargetUrl,
          placement: placementVal,
          sortOrder: sortVal,
          isActive: activeVal,
        },
      });
    } else {
      const id = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "AdBanner" ("id", "tenantId", "title", "imageUrl", "targetUrl", "placement", "sortOrder", "isActive", "createdAt", "updatedAt")
        VALUES (${id}, ${tenant.id}, ${trimmedTitle}, ${trimmedImageUrl}, ${cleanTargetUrl}, ${placementVal}, ${sortVal}, ${activeVal}, NOW(), NOW())
      `;
      banner = {
        id,
        tenantId: tenant.id,
        title: trimmedTitle,
        imageUrl: trimmedImageUrl,
        targetUrl: cleanTargetUrl,
        placement: placementVal,
        sortOrder: sortVal,
        isActive: activeVal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    await logAuditEvent({
      tenantId: tenant.id,
      action: "BANNER_CREATED",
      module: "MARKETING",
      details: { bannerId: banner.id, title: banner.title },
    });

    return NextResponse.json({ success: true, banner }, { status: 201 });
  } catch (err: any) {
    console.error("Create banner error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
