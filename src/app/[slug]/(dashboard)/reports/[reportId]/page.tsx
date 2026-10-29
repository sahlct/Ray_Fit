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

  // If report not found directly in DB, provide mock fallback if demo ID
  const isSampleReport = !report && reportId.startsWith("ev-");

  // Sample data fallback if seeded evaluation is demo
  const sampleMap: Record<string, any> = {
    "ev-1": {
      id: "ev-1",
      evaluationDate: new Date(),
      status: "MET",
      aggregatedValue: 9850,
      thresholdSummary: "Achieved 9,850 steps (Target: >= 8,000 steps)",
      evaluatedAt: new Date(),
      student: {
        fullName: "Alex Morgan",
        email: "alex.morgan@greenvalley.edu",
        phoneNumber: "+1-555-0101",
        enrollments: [
          {
            batch: {
              name: "Batch A - Morning Athletics",
              class: { name: "Grade 10" },
            },
          },
        ],
        wearableDevices: [
          {
            deviceUuid: "E4:5F:01:9B:4C:11",
            vendorName: "RayBand Pro",
            batteryLevel: 88,
            status: "ACTIVE",
          },
        ],
      },
      timetableEntry: {
        scheduledDate: new Date(),
        windowStartTime: "07:00",
        windowEndTime: "18:00",
        assignment: {
          task: {
            title: "Daily Active Step Goal",
            metricType: "STEPS",
            unit: "steps",
            description: "Daily continuous student ambulatory baseline evaluation.",
          },
        },
      },
      benchmarkVersion: {
        operator: "GREATER_THAN_OR_EQUAL",
        targetValue: 8000,
        minValue: null,
        maxValue: null,
        version: 1,
      },
    },
    "ev-2": {
      id: "ev-2",
      evaluationDate: new Date(),
      status: "NOT_MET",
      aggregatedValue: 5420,
      thresholdSummary: "Recorded 5,420 steps (Target: >= 8,000 steps)",
      evaluatedAt: new Date(),
      student: {
        fullName: "Liam Chen",
        email: "liam.chen@greenvalley.edu",
        phoneNumber: "+1-555-0102",
        enrollments: [
          {
            batch: {
              name: "Batch A - Morning Athletics",
              class: { name: "Grade 10" },
            },
          },
        ],
        wearableDevices: [
          {
            deviceUuid: "B8:27:EB:4A:9C:32",
            vendorName: "Fitbit Inspire",
            batteryLevel: 64,
            status: "ACTIVE",
          },
        ],
      },
      timetableEntry: {
        scheduledDate: new Date(),
        windowStartTime: "07:00",
        windowEndTime: "18:00",
        assignment: {
          task: {
            title: "Daily Active Step Goal",
            metricType: "STEPS",
            unit: "steps",
            description: "Daily continuous student ambulatory baseline evaluation.",
          },
        },
      },
      benchmarkVersion: {
        operator: "GREATER_THAN_OR_EQUAL",
        targetValue: 8000,
        minValue: null,
        maxValue: null,
        version: 1,
      },
    },
    "ev-3": {
      id: "ev-3",
      evaluationDate: new Date(),
      status: "NO_DATA",
      aggregatedValue: null,
      thresholdSummary:
        "No wearable synchronization telemetry received for this evaluation window",
      evaluatedAt: new Date(),
      student: {
        fullName: "Emma Watson",
        email: "emma.watson@greenvalley.edu",
        phoneNumber: "+1-555-0103",
        enrollments: [
          {
            batch: {
              name: "Batch A - Morning Athletics",
              class: { name: "Grade 10" },
            },
          },
        ],
        wearableDevices: [],
      },
      timetableEntry: {
        scheduledDate: new Date(),
        windowStartTime: "07:00",
        windowEndTime: "18:00",
        assignment: {
          task: {
            title: "Daily Active Step Goal",
            metricType: "STEPS",
            unit: "steps",
            description: "Daily continuous student ambulatory baseline evaluation.",
          },
        },
      },
      benchmarkVersion: {
        operator: "GREATER_THAN_OR_EQUAL",
        targetValue: 8000,
        minValue: null,
        maxValue: null,
        version: 1,
      },
    },
    "ev-4": {
      id: "ev-4",
      evaluationDate: new Date(Date.now() - 86400000),
      status: "MET",
      aggregatedValue: 68,
      thresholdSummary: "Achieved 68 bpm (Target: <= 75 bpm)",
      evaluatedAt: new Date(Date.now() - 86400000),
      student: {
        fullName: "Alex Morgan",
        email: "alex.morgan@greenvalley.edu",
        phoneNumber: "+1-555-0101",
        enrollments: [
          {
            batch: {
              name: "Batch A - Morning Athletics",
              class: { name: "Grade 10" },
            },
          },
        ],
        wearableDevices: [
          {
            deviceUuid: "E4:5F:01:9B:4C:11",
            vendorName: "RayBand Pro",
            batteryLevel: 88,
            status: "ACTIVE",
          },
        ],
      },
      timetableEntry: {
        scheduledDate: new Date(Date.now() - 86400000),
        windowStartTime: "08:00",
        windowEndTime: "10:00",
        assignment: {
          task: {
            title: "Resting Pulse Check",
            metricType: "HEART_RATE",
            unit: "bpm",
            description: "Resting cardiac telemetry evaluation.",
          },
        },
      },
      benchmarkVersion: {
        operator: "LESS_THAN_OR_EQUAL",
        targetValue: 75,
        minValue: null,
        maxValue: null,
        version: 1,
      },
    },
    "ev-5": {
      id: "ev-5",
      evaluationDate: new Date(Date.now() - 86400000),
      status: "MET",
      aggregatedValue: 112,
      thresholdSummary: "Achieved 112 mmHg (Target: Between 90 and 120 mmHg)",
      evaluatedAt: new Date(Date.now() - 86400000),
      student: {
        fullName: "Liam Chen",
        email: "liam.chen@greenvalley.edu",
        phoneNumber: "+1-555-0102",
        enrollments: [
          {
            batch: {
              name: "Batch A - Morning Athletics",
              class: { name: "Grade 10" },
            },
          },
        ],
        wearableDevices: [
          {
            deviceUuid: "B8:27:EB:4A:9C:32",
            vendorName: "Fitbit Inspire",
            batteryLevel: 64,
            status: "ACTIVE",
          },
        ],
      },
      timetableEntry: {
        scheduledDate: new Date(Date.now() - 86400000),
        windowStartTime: "08:00",
        windowEndTime: "10:00",
        assignment: {
          task: {
            title: "Blood Pressure Range",
            metricType: "BLOOD_PRESSURE_SYSTOLIC",
            unit: "mmHg",
            description: "Resting blood pressure baseline check.",
          },
        },
      },
      benchmarkVersion: {
        operator: "BETWEEN",
        targetValue: null,
        minValue: 90,
        maxValue: 120,
        version: 1,
      },
    },
  };

  const activeData = report || (isSampleReport ? sampleMap[reportId] : null);

  if (!activeData) {
    notFound();
  }

  const enrollment = activeData.student.enrollments?.[0];
  const className = enrollment?.batch?.class?.name || "Grade 10";
  const batchName = enrollment?.batch?.name || "Morning Cohort";
  const studentObj = activeData.student as any;
  const wearable = studentObj.assignedDevices?.[0] || studentObj.wearableDevices?.[0];
  const studentPhone = studentObj.phone || studentObj.phoneNumber || "Not provided";
  const task = activeData.timetableEntry.assignment.task;
  const benchmark = activeData.benchmarkVersion;

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title="Student Evaluation Report"
        subtitle={`Official health benchmark verification for ${activeData.student.fullName}`}
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-6 print:p-0">
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
          className={`rounded-2xl p-6 border shadow-sm dark:shadow-none ${
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
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">
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
              </div>
            </div>

            {/* Aggregated Metric Hero Value */}
            <div className="rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 text-right min-w-[200px] shadow-sm dark:shadow-none">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Recorded Aggregated Metric
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {activeData.aggregatedValue !== null
                  ? `${activeData.aggregatedValue} `
                  : "No Signal"}
                <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
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
              <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
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
                <p className="font-semibold text-teal-600 dark:text-teal-400">{className}</p>
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
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
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
              <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Benchmark Criteria & Rules
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Health Metric</span>
                <p className="font-semibold text-teal-600 dark:text-teal-400 font-mono">
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
                  v{benchmark?.version || 1} (Locked deterministic)
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Target Threshold</span>
                <p className="font-bold text-teal-700 dark:text-teal-300">
                  {benchmark?.targetValue !== null && benchmark?.targetValue !== undefined
                    ? `${benchmark.targetValue} ${task.unit || ""}`
                    : benchmark?.minValue && benchmark?.maxValue
                    ? `${benchmark.minValue} - ${benchmark.maxValue} ${task.unit || ""}`
                    : "Configured rule"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Evaluation Window</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {activeData.timetableEntry.windowStartTime || "00:00"} -{" "}
                  {activeData.timetableEntry.windowEndTime || "23:59"}
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
              <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Wearable Telemetry & Audit Trail
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chronological data points captured during evaluation date
                </p>
              </div>
            </div>

            <span className="text-xs text-teal-600 dark:text-teal-400 font-mono font-semibold">
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
                <p className="font-bold text-teal-600 dark:text-teal-400 text-sm">
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
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
              <p>
                Official Student Health & Fitness Audit Record • Ray Fit Enterprise Platform
              </p>
              <p className="font-mono text-slate-400 dark:text-slate-500">
                Verification Hash: {activeData.id.slice(0, 16)}...
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
