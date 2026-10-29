import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim();
    const session = await verifySessionToken(token);
    if (!session || !session.tenantId) {
      return NextResponse.json(
        { error: "Invalid or expired session token." },
        { status: 401 }
      );
    }

    const tenantId = session.tenantId;

    let banners: any[] = [];
    if ((prisma as any).adBanner?.findMany) {
      banners = await (prisma as any).adBanner.findMany({
        where: {
          tenantId,
          isActive: true,
        },
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "desc" },
        ],
      });
    } else {
      banners = await prisma.$queryRaw`
        SELECT "id", "tenantId", "title", "imageUrl", "targetUrl", "placement", "sortOrder", "isActive", "createdAt", "updatedAt"
        FROM "AdBanner"
        WHERE "tenantId" = ${tenantId} AND "isActive" = true
        ORDER BY "sortOrder" ASC, "createdAt" DESC
      `;
    }

    return NextResponse.json({
      success: true,
      banners,
    });
  } catch (err: any) {
    console.error("Fetch mobile banners error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
