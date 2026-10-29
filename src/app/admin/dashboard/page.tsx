import React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Watch,
  Activity,
  CreditCard,
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "@/components/navigation/admin-header";
import { formatDate, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  const [tenants, totalStudents, totalWearables, totalEvaluations, recentAuditLogs, subscriptionPayments] =
    await Promise.all([
      (prisma.tenant.findMany as any)({
        include: {
          _count: {
            select: {
              users: true,
              classes: true,
              wearableDevices: true,
              tasks: true,
            },
          },
          users: {
            where: { role: { name: "School Admin" } },
            take: 1,
          },
          subscriptionPayments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({
        where: { userType: { slug: "student" } },
      }),
      prisma.wearableDevice.count(),
      prisma.taskEvaluationResult.count(),
      prisma.auditLog.findMany({
        include: {
          tenant: true,
          user: true,
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      ((prisma as any).tenantSubscriptionPayment?.findMany ? (prisma as any).tenantSubscriptionPayment.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }) : Promise.resolve([])),
    ]);

  const totalSchools = (tenants as any[]).length;
  const activeSchools = (tenants as any[]).filter((t) => t.status === "ACTIVE").length;
  const trialSchools = (tenants as any[]).filter((t) => t.status === "TRIAL").length;

  // Plan distribution
  const enterpriseCount = (tenants as any[]).filter((t) => (t.subscriptionPlan || "").toLowerCase().includes("enterprise")).length;
  const growthCount = (tenants as any[]).filter((t) => (t.subscriptionPlan || "").toLowerCase().includes("growth")).length;
  const starterCount = totalSchools - enterpriseCount - growthCount;

  // Calculate estimated platform MRR
  const mrrTotal = (subscriptionPayments as any[]).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0) || (enterpriseCount * 1499 + growthCount * 699 + starterCount * 299);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Platform Master Dashboard"
        subtitle="Global executive metrics, cross-institution analytics, telemetry pipeline, and governance status"
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Executive Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: School Tenants */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Managed Tenants
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-3">
              {totalSchools}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {activeSchools} Active
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">{trialSchools} Trial</span>
            </div>
          </div>

          {/* Card 2: Monitored Students */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Monitored Students
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-3">
              {totalStudents}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Across all enrolled cohorts & batches
            </p>
          </div>

          {/* Card 3: Connected Smart Bands */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Wearables
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Watch className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-3">
              {totalWearables}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
              Live BLE telemetry ingestion active
            </p>
          </div>

          {/* Card 4: Platform MRR */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Platform MRR
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-3">
              ${mrrTotal.toLocaleString()}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
              Monthly subscription run-rate
            </p>
          </div>
        </div>

        {/* 2-Column Section: Subscription Tier Distribution & System Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subscription Tier Breakdown */}
          <div className="lg:col-span-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm dark:shadow-none space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Subscription Plans
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tenant tier allocations
                </p>
              </div>
              <Link
                href="/admin/subscriptions"
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
              >
                Manage →
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Enterprise Tier ($1,499/mo)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{enterpriseCount} schools</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${totalSchools ? (enterpriseCount / totalSchools) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Growth Tier ($699/mo)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{growthCount} schools</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full"
                    style={{ width: `${totalSchools ? (growthCount / totalSchools) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Starter Tier ($299/mo)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{starterCount} schools</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${totalSchools ? (starterCount / totalSchools) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 mt-4 text-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Quick Subscription Actions
              </span>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href="/admin/subscriptions"
                  className="flex-1 text-center py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors"
                >
                  Record Payment
                </Link>
                <Link
                  href="/admin/tenants/new"
                  className="flex-1 text-center py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                >
                  Add School
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Organizations Grid */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm dark:shadow-none space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Managed Organizations Roster
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recent institutions with direct portal access
                </p>
              </div>
              <Link
                href="/admin"
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
              >
                View Full Directory ({totalSchools}) →
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {tenants.slice(0, 5).map((t: any) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0"
                      style={{ backgroundColor: t.primaryColor || "#0f766e" }}
                    >
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        /{t.slug} • {t._count?.users || 0} members • {t._count?.wearableDevices || 0} bands
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {t.status}
                    </span>
                    <Link
                      href={`/${t.slug}/dashboard`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Launch School Portal"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Audit Feed */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm dark:shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Recent Platform Security &amp; Mutation Events
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time audit log of institutional administrative operations
                </p>
              </div>
            </div>
            <Link
              href="/admin/audit"
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
            >
              Full Audit Trail →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-teal-600 dark:text-teal-400 font-bold shrink-0">
                    {log.action}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 truncate">
                    {log.tenant ? `[${log.tenant.name}]` : "[Platform]"} {JSON.stringify(log.details)}
                  </span>
                </div>
                <div className="text-slate-400 shrink-0 text-[11px]">
                  {formatDate(log.createdAt)} {formatTime(log.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
