import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const evaluations = await prisma.taskEvaluationResult.findMany({
      where: { tenantId: tenant.id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            enrollments: {
              include: {
                batch: {
                  include: {
                    class: true,
                  },
                },
              },
            },
            assignedDevices: {
              select: {
                deviceUuid: true,
                vendorName: true,
                status: true,
                batteryLevel: true,
              },
            },
          },
        },
        timetableEntry: {
          include: {
            assignment: {
              include: {
                task: true,
                batch: true,
                class: true,
              },
            },
          },
        },
        benchmarkVersion: true,
      },
      orderBy: { evaluationDate: "desc" },
      take: 100,
    });

    return NextResponse.json({ evaluations });
  } catch (err: any) {
    console.error("Reports API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch reports." },
      { status: 500 }
    );
  }
}
