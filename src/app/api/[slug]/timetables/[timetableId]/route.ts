import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ slug: string; timetableId: string }> }
) {
  try {
    const { slug, timetableId } = await props.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    const timetable = await prisma.timetableAssignment.findFirst({
      where: {
        id: timetableId,
        tenantId: tenant.id,
      },
      include: {
        assignment: {
          include: {
            task: true,
            batch: true,
          },
        },
      },
    });

    if (!timetable) {
      return NextResponse.json(
        { error: "Timetable entry not found." },
        { status: 404 }
      );
    }

    await prisma.timetableAssignment.delete({
      where: { id: timetableId },
    });

    await logAuditEvent({
      tenantId: tenant.id,
      action: "TIMETABLE_DELETED",
      module: "TIMETABLES",
      details: {
        timetableId,
        taskTitle: timetable.assignment.task.title,
        scheduledDate: timetable.scheduledDate,
        batchName: timetable.assignment.batch?.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Timetable entry deleted successfully.",
    });
  } catch (err: any) {
    console.error("Delete single timetable error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete timetable entry." },
      { status: 500 }
    );
  }
}

