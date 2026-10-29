import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { TimetableScheduleViewer } from "./timetable-schedule-viewer";

export default async function TimetablesPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      classes: {
        include: {
          batches: {
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
      timetables: {
        include: {
          assignment: {
            include: {
              task: true,
              batch: { include: { class: true } },
            },
          },
          benchmarkVersion: true,
          evaluations: {
            select: {
              id: true,
              studentId: true,
              status: true,
              criticalEventsCount: true,
              criticalEventsLog: true,
            },
          },
          _count: {
            select: { evaluations: true },
          },
        },
        orderBy: { scheduledDate: "desc" },
      },
    },
  });

  if (!tenant) notFound();

  // Safely serialize Prisma Decimals, Dates, and nested objects into plain primitives for Client Components
  const serializedTimetables = tenant.timetables.map((tt) => ({
    id: tt.id,
    scheduledDate: tt.scheduledDate ? tt.scheduledDate.toISOString() : "",
    windowStartTime: tt.windowStartTime,
    windowEndTime: tt.windowEndTime,
    durationMinutes: tt.durationMinutes ?? null,
    status: tt.status,
    assignment: {
      id: tt.assignment.id,
      classId: tt.assignment.classId,
      batchId: tt.assignment.batchId,
      task: {
        id: tt.assignment.task.id,
        title: tt.assignment.task.title,
        metricType: tt.assignment.task.metricType,
        unit: tt.assignment.task.unit,
      },
      batch: tt.assignment.batch
        ? {
            id: tt.assignment.batch.id,
            name: tt.assignment.batch.name,
            classId: tt.assignment.batch.classId,
            class: tt.assignment.batch.class
              ? {
                  id: tt.assignment.batch.class.id,
                  name: tt.assignment.batch.class.name,
                }
              : null,
          }
        : null,
    },
    benchmarkVersion: {
      id: tt.benchmarkVersion.id,
      versionNumber: tt.benchmarkVersion.versionNumber,
      operator: tt.benchmarkVersion.operator,
      minValue:
        tt.benchmarkVersion.minValue != null
          ? Number(tt.benchmarkVersion.minValue)
          : null,
      maxValue:
        tt.benchmarkVersion.maxValue != null
          ? Number(tt.benchmarkVersion.maxValue)
          : null,
      targetValue:
        tt.benchmarkVersion.targetValue != null
          ? Number(tt.benchmarkVersion.targetValue)
          : null,
      criticalZones: (tt.benchmarkVersion.criticalZones as any) || [],
    },
    totalCriticalAlerts: (tt.evaluations || []).reduce(
      (sum, ev) => sum + (ev.criticalEventsCount || 0),
      0
    ),
    _count: {
      evaluations: tt._count.evaluations,
    },
  }));

  const serializedClasses = tenant.classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    batches: cls.batches.map((b) => ({
      id: b.id,
      name: b.name,
      classId: b.classId,
    })),
  }));

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title="Class & Batch Health Timetables"
        subtitle="Scheduled health monitoring windows and immutable historical benchmark versions"
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        <TimetableScheduleViewer
          slug={slug}
          initialTimetables={serializedTimetables}
          classes={serializedClasses}
        />
      </main>
    </div>
  );
}
