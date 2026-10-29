import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const body = await req.json();
    const { timetableId, timetableIds } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    const idsToDelete: string[] = [];
    if (Array.isArray(timetableIds) && timetableIds.length > 0) {
      idsToDelete.push(...timetableIds);
    } else if (timetableId) {
      idsToDelete.push(timetableId);
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { error: "No timetable IDs provided for deletion." },
        { status: 400 }
      );
    }

    // Delete timetables belonging to this tenant
    const deleteResult = await prisma.timetableAssignment.deleteMany({
      where: {
        id: { in: idsToDelete },
        tenantId: tenant.id,
      },
    });

    await logAuditEvent({
      tenantId: tenant.id,
      action: "TIMETABLE_DELETED",
      module: "TIMETABLES",
      details: {
        deletedCount: deleteResult.count,
        deletedIds: idsToDelete,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.count} timetable ${deleteResult.count === 1 ? "entry" : "entries"}.`,
      deletedCount: deleteResult.count,
    });
  } catch (err: any) {
    console.error("Delete timetable error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete timetable entry." },
      { status: 500 }
    );
  }
}

