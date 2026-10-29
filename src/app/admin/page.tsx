import React from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Users,
  Watch,
  Activity,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { TenantsManager } from "@/components/admin/tenants-manager";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

export default async function SuperAdminPage() {
  const tenants = await prisma.tenant.findMany({
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
    },
    orderBy: { createdAt: "desc" },
  });

  const totalSchools = tenants.length;
  const totalStudents = await prisma.user.count({
    where: { userType: { slug: "student" } },
  });
  const totalWearables = await prisma.wearableDevice.count();
  const totalEvaluations = await prisma.taskEvaluationResult.count();

  return (
    <div className="flex-1 flex flex-col p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Ray Fit Platform Super Admin
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global multi-tenant governance, organization lifecycle, and enterprise infrastructure
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/admin/tenants/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New School</span>
          </Link>
        </div>
      </div>

      {/* Global KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
            Active School Tenants
          </span>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {totalSchools}
          </div>
          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">Isolated database domains</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
            Total Students Monitored
          </span>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {totalStudents}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all school cohorts</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
            Connected Wearables
          </span>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {totalWearables}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Active smart bands</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-none">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
            Evaluations Computed
          </span>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            {totalEvaluations}
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Met / Not Met / No Data checks</p>
        </div>
      </div>

      {/* Managed Organizations with View, Edit, Delete modals and Order Indexing */}
      <TenantsManager initialTenants={tenants} />
    </div>
  );
}
