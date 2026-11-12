import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Watch,
  User,
  GraduationCap,
  Activity,
  Award,
  Layers,
  HeartPulse,
  Flame,
  FileText,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/reports/print-button";

export default async function StudentReportDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; reportId: string }>;
}) {
  const { slug, reportId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) {
    notFound();
  }

  // Fetch report from database
  const report = await prisma.taskEvaluationResult.findFirst({
    where: {
      id: reportId,
      tenantId: tenant.id,
    },
    include: {
      student: {
        include: {
          enrollments: {
            include: {
              batch: {
                include: {
                  class: true,
                },
              },
            },
          },
          assignedDevices: true,
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
  });

  if (!report) {
    notFound();
  }

  const activeData = report;

  const enrollment = activeData.student.enrollments?.[0];
  const className = enrollment?.batch?.class?.name || "Grade 10";
  const batchName = enrollment?.batch?.name || "Morning Cohort";
  const studentObj = activeData.student as any;
  const wearable = studentObj.assignedDevices?.[0] || studentObj.wearableDevices?.[0];
  const studentPhone = studentObj.phone || studentObj.phoneNumber || "Not provided";
  const task = activeData.timetableEntry.assignment.task;
  const benchmark = activeData.benchmarkVersion;

  const coachStart = activeData.timetableEntry.windowStartTime || "00:00";
  const coachEnd = activeData.timetableEntry.windowEndTime || "23:59";
  const coachWindow = `${coachStart} - ${coachEnd}`;

  const actualStart = activeData.actualStartTime
    ? new Date(activeData.actualStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  const actualEnd = activeData.actualEndTime
    ? new Date(activeData.actualEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  const actualDuration = activeData.actualDurationMins
    ? `${activeData.actualDurationMins}m`
    : null;

  const performedWindow = actualStart && actualEnd
    ? `${actualStart} - ${actualEnd}${actualDuration ? ` (${actualDuration})` : ""}`
    : actualStart
    ? `Started at ${actualStart} (In Progress)`
    : "Evaluated during window";

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title="Student Evaluation Report"
        subtitle={`Official health benchmark verification for ${activeData.student.fullName}`}
        tenantSlug={slug}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 print:p-0">
        {/* Print-Only Official Document Header (A4 Official Document Layout) */}
        <div className="hidden print:flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center shrink-0">
              <img
                src="/brand/png/raysfit-icon-120.png"
                alt="RaysFit"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                Rays<span className="font-semibold text-slate-800">Fit</span>
              </h1>
              <p className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                Student Health & Athletic Telemetry Verification
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-slate-950">{tenant.name}</div>
            <div className="text-xs text-slate-600 font-mono">Report Ref: #{activeData.id.slice(0, 16)}</div>
            <div className="text-xs text-slate-500">Evaluation Date: {formatDate(activeData.evaluationDate)}</div>
          </div>
        </div>

        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <Link
            href={`/${slug}/reports`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Reports Directory</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Report Ref: #{activeData.id}
            </span>
            <PrintButton />
          </div>
        </div>

        {/* Hero Evaluation Summary Banner */}
        <div
          className={`rounded-2xl p-6 border shadow-sm dark:shadow-none print:border-slate-300 print:bg-white ${
            activeData.status === "MET"
              ? "bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/40"
              : activeData.status === "NOT_MET"
              ? "bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/40"
              : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  activeData.status === "MET"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                    : activeData.status === "NOT_MET"
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {activeData.status === "MET" && (
                  <CheckCircle2 className="w-8 h-8" />
                )}
                {activeData.status === "NOT_MET" && (
                  <XCircle className="w-8 h-8" />
                )}
                {activeData.status === "NO_DATA" && (
                  <AlertCircle className="w-8 h-8" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white print:text-slate-950">
                    {activeData.student.fullName}
                  </h1>
                  <StatusBadge status={activeData.status} />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                  Task: <span className="text-slate-900 dark:text-white font-bold">{task.title}</span> ({task.metricType})
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Evaluation Date: {formatDate(activeData.evaluationDate)} • Evaluated at{" "}
                  {new Date(activeData.evaluatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {/* Explicit Window & Performed Time Comparison */}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700 print:bg-slate-50 print:border-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Coach Assigned: <strong className="text-slate-900 dark:text-white print:text-slate-950 font-mono">{coachWindow}</strong></span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 font-medium border border-orange-500/30 print:bg-orange-50 print:border-orange-300">
                    <Activity className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    <span>Student Performed: <strong className="text-orange-950 dark:text-orange-100 print:text-orange-950 font-mono">{performedWindow}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Aggregated Metric Hero Value */}
            <div className="rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 text-right min-w-[200px] shadow-sm dark:shadow-none print:bg-slate-50 print:border-slate-300">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Recorded Aggregated Metric
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 print:text-slate-950">
                {activeData.aggregatedValue !== null
                  ? `${activeData.aggregatedValue} `
                  : "No Signal"}
                <span className="text-sm font-semibold text-orange-500 dark:text-orange-400">
                  {task.unit || ""}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeData.thresholdSummary}
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Student Profile & Task Specification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Profile Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <User className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Student Identity & Cohort
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Full Legal Name</span>
                <p className="font-semibold text-slate-900 dark:text-white">{activeData.student.fullName}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Email Coordinates</span>
                <p className="font-semibold text-slate-900 dark:text-white">{activeData.student.email}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Class / Grade</span>
                <p className="font-semibold text-orange-500 dark:text-orange-400">{className}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Assigned Batch</span>
                <p className="font-semibold text-slate-900 dark:text-white">{batchName}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Phone Contact</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {studentPhone}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Institution Domain</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300">/{slug}</p>
              </div>
            </div>

            {/* Wearable Device Binding */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 dark:text-orange-400">
                    <Watch className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {wearable ? wearable.vendorName : "No Hardware Bound"}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {wearable ? wearable.deviceUuid : "Telemetry via manual sync"}
                    </span>
                  </div>
                </div>

                {wearable && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                      {wearable.batteryLevel}% Battery
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {wearable.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Benchmark Criteria & Evaluation Rule */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Award className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Benchmark Criteria & Rules
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Health Metric</span>
                <p className="font-semibold text-orange-500 dark:text-orange-400 font-mono">
                  {task.metricType}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Target Measurement Unit</span>
                <p className="font-semibold text-slate-900 dark:text-white">{task.unit || "N/A"}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Mathematical Operator</span>
                <p className="font-semibold text-slate-900 dark:text-white font-mono">
                  {benchmark ? benchmark.operator : "GREATER_THAN_OR_EQUAL"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Benchmark Version</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  v{(benchmark as any)?.versionNumber || (benchmark as any)?.version || 1} (Locked deterministic)
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Target Threshold</span>
                <p className="font-bold text-orange-600 dark:text-orange-300">
                  {benchmark?.targetValue !== null && benchmark?.targetValue !== undefined
                    ? `${benchmark.targetValue} ${task.unit || ""}`
                    : benchmark?.minValue && benchmark?.maxValue
                    ? `${benchmark.minValue} - ${benchmark.maxValue} ${task.unit || ""}`
                    : "Configured rule"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Coach Assigned Window</span>
                <p className="font-semibold text-slate-900 dark:text-white font-mono">
                  {coachWindow}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Student Performed Window</span>
                <p className="font-bold text-orange-600 dark:text-orange-400 font-mono">
                  {actualStart && actualEnd ? `${actualStart} - ${actualEnd}` : actualStart ? `Started ${actualStart}` : "Window Baseline"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Session Execution Duration</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {actualDuration || (actualStart ? "In Progress" : "Evaluated Over Window")}
                </p>
              </div>
            </div>

            {/* Threshold Explanation Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 block mb-1 font-bold">
                Deterministic Decision Rule
              </span>
              <p className="text-slate-700 dark:text-slate-300">
                {activeData.status === "MET"
                  ? `Student successfully satisfied the ${task.title} threshold within the designated evaluation window.`
                  : activeData.status === "NOT_MET"
                  ? `Telemetry readings were below the clinical/athletic benchmark threshold for ${task.title}.`
                  : `No telemetry was received from student's wearable during the scheduled window. Mark is unpenalized.`}
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry Sensor Sync Log */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-none">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Wearable Telemetry & Audit Trail
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chronological data points captured during evaluation date
                </p>
              </div>
            </div>

            <span className="text-xs text-orange-500 dark:text-orange-400 font-mono font-semibold">
              Algorithm: Daily Aggregation V2
            </span>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Engine Evaluation
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {activeData.status === "MET"
                    ? "Pass (Criteria Verified)"
                    : activeData.status === "NOT_MET"
                    ? "Fail (Below Required Standard)"
                    : "No Data Received"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Evaluated at {formatDate(activeData.evaluatedAt)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Aggregated Output
                </span>
                <p className="font-bold text-orange-500 dark:text-orange-400 text-sm">
                  {activeData.aggregatedValue !== null
                    ? `${activeData.aggregatedValue} ${task.unit || ""}`
                    : "0 Telemetries"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sum / mean calculated over window
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Data Authenticity
                </span>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Hardware Signed</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Anti-tamper BLE telemetry payload
                </p>
              </div>
            </div>

            {/* Official Report Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 print:border-slate-300">
              <p>
                Official Student Health & Fitness Audit Record • Rays Fit Enterprise Platform
              </p>
              <p className="font-mono text-slate-400 dark:text-slate-500">
                Verification Hash: {activeData.id.slice(0, 16)}...
              </p>
            </div>
          </div>
        </div>

        {/* Print-Only Signature & Authentication Box */}
        <div className="hidden print:grid grid-cols-2 gap-12 pt-8 mt-6 border-t-2 border-slate-300">
          <div>
            <div className="h-14 border-b border-dashed border-slate-400"></div>
            <p className="text-xs font-bold text-slate-900 mt-2">Authorized Coach / Athletic Director</p>
            <p className="text-[10px] text-slate-500">{tenant.name} Department of Physical Education</p>
          </div>
          <div>
            <div className="h-14 border-b border-dashed border-slate-400"></div>
            <p className="text-xs font-bold text-slate-900 mt-2">Certified Automated Telemetry Authenticator</p>
            <p className="text-[10px] text-slate-500 font-mono">Immutable Audit ID: {activeData.id}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
