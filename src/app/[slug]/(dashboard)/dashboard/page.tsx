import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Users,
  GraduationCap,
  Watch,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";

export default async function TenantDashboardPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          users: true,
          classes: true,
          wearableDevices: true,
          tasks: true,
        },
      },
      classes: {
        include: {
          batches: {
            include: {
              _count: { select: { enrollments: true } },
            },
          },
        },
      },
      tasks: {
        include: {
          benchmarks: {
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
          assignments: {
            include: { batch: true },
          },
        },
      },
      evaluations: {
        take: 10,
        orderBy: { evaluationDate: "desc" },
        include: {
          student: true,
          timetableEntry: {
            include: {
              assignment: {
                include: { task: true },
              },
            },
          },
          benchmarkVersion: true,
        },
      },
    },
  });

  if (!tenant) notFound();

  // Calculate compliance statistics
  const totalEvaluations = await prisma.taskEvaluationResult.count({
    where: { tenantId: tenant.id },
  });

  const metCount = await prisma.taskEvaluationResult.count({
    where: { tenantId: tenant.id, status: "MET" },
  });

  const notMetCount = await prisma.taskEvaluationResult.count({
    where: { tenantId: tenant.id, status: "NOT_MET" },
  });

  const noDataCount = await prisma.taskEvaluationResult.count({
    where: { tenantId: tenant.id, status: "NO_DATA" },
  });

  const complianceRate =
    totalEvaluations > 0 ? Math.round((metCount / totalEvaluations) * 100) : 0;

  // Student count
  const studentCount = await prisma.user.count({
    where: {
      tenantId: tenant.id,
      userType: { slug: "student" },
    },
  });

  const totalBatches = tenant.classes.reduce(
    (sum, c) => sum + c.batches.length,
    0
  );

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title={`${tenant.name} Overview`}
        subtitle="Live Health Monitoring & Benchmark Compliance Center"
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Enrolled Students */}
          <div className="glass-card rounded-2xl p-6 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Enrolled Students
              </span>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {studentCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              Across <span className="font-semibold text-slate-700 dark:text-slate-200">{totalBatches} batches</span>
            </p>
          </div>

          {/* Connected Wearables */}
          <div className="glass-card rounded-2xl p-6 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Wearable Bands
              </span>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                <Watch className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {tenant._count.wearableDevices}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Live Telemetry Active
            </p>
          </div>

          {/* Active Health Tasks */}
          <div className="glass-card rounded-2xl p-6 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Health Tasks
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {tenant._count.tasks}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configured with benchmarks
            </p>
          </div>

          {/* Benchmark Compliance */}
          <div className="glass-card rounded-2xl p-6 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Benchmark Met Rate
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {complianceRate}%
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Overall goal achievement
            </p>
          </div>
        </div>

        {/* Deterministic Evaluation Status Breakdown Bar */}
        <div className="glass-card rounded-2xl p-6 border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Benchmark Evaluation Status Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluation results recorded by the Ray Fit automated benchmark worker
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Met: {metCount} ({totalEvaluations > 0 ? Math.round((metCount / totalEvaluations) * 100) : 0}%)
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <XCircle className="w-4 h-4" />
                Not Met: {notMetCount} ({totalEvaluations > 0 ? Math.round((notMetCount / totalEvaluations) * 100) : 0}%)
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <AlertCircle className="w-4 h-4" />
                No Data: {noDataCount} ({totalEvaluations > 0 ? Math.round((noDataCount / totalEvaluations) * 100) : 0}%)
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 flex overflow-hidden">
            {totalEvaluations > 0 ? (
              <>
                <div
                  style={{ width: `${(metCount / totalEvaluations) * 100}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Met: ${metCount}`}
                />
                <div
                  style={{ width: `${(notMetCount / totalEvaluations) * 100}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title={`Not Met: ${notMetCount}`}
                />
                <div
                  style={{ width: `${(noDataCount / totalEvaluations) * 100}%` }}
                  className="bg-slate-400 dark:bg-slate-500 transition-all duration-500"
                  title={`No Data: ${noDataCount}`}
                />
              </>
            ) : (
              <div className="w-full bg-slate-200 dark:bg-slate-800" />
            )}
          </div>
        </div>

        {/* Two Column Section: Active Tasks & Recent Evaluations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 cols): Recent Student Evaluations */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Latest Student Health Evaluations
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daily benchmark compliance checks across cohorts
                </p>
              </div>
              <Link
                href={`/${slug}/reports`}
                className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View Full Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Student</th>
                    <th className="pb-3">Task / Metric</th>
                    <th className="pb-3">Evaluation Result</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {tenant.evaluations.length > 0 ? (
                    tenant.evaluations.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">
                          {ev.student.fullName}
                        </td>
                        <td className="py-3 text-xs text-slate-700 dark:text-slate-300">
                          {ev.timetableEntry.assignment.task.title}
                        </td>
                        <td className="py-3 text-xs text-slate-500 dark:text-slate-400">
                          {ev.thresholdSummary}
                        </td>
                        <td className="py-3">
                          <StatusBadge status={ev.status} />
                        </td>
                        <td className="py-3 text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(ev.evaluationDate)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                        No health evaluations logged yet. Click &quot;Run Daily Check&quot; to evaluate!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column (1 col): Active Tasks & Quick Simulation */}
          <div className="space-y-6">
            {/* Active Health Tasks */}
            <div className="glass-card rounded-2xl p-6 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Active Health Tasks
                </h3>
                <Link
                  href={`/${slug}/tasks`}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 font-semibold transition-colors"
                >
                  Configure
                </Link>
              </div>

              <div className="space-y-3">
                {tenant.tasks.map((task) => {
                  const bm = task.benchmarks[0];
                  return (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {task.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                          {task.metricType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        Benchmark: {bm ? `${bm.operator.replace(/_/g, " ")} (${bm.minValue || bm.maxValue || bm.targetValue} ${task.unit})` : "Standard"}
                      </p>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Daily evaluation window (06:00 - 20:00)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Action: Wearables & Telemetry */}
            <div className="glass-card rounded-2xl p-6 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-teal-500/10 via-slate-50 dark:via-slate-900/60 to-cyan-500/10">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                Wearable Ingestion Simulator
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Simulate smart band telemetry sync to test benchmark evaluations in real time.
              </p>
              <Link
                href={`/${slug}/wearables`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors shadow-md"
              >
                <Watch className="w-4 h-4" />
                <span>Launch Wearable Simulator</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
