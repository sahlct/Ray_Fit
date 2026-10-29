import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Users,
  ArrowLeft,
  Mail,
  Phone,
  Watch,
  GraduationCap,
  Activity,
  HeartPulse,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Layers,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { formatDate, formatTime } from "@/lib/utils";

export default async function UserDetailsPage(props: {
  params: Promise<{ slug: string; userId: string }>;
}) {
  const { slug, userId } = await props.params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) notFound();

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId: tenant.id },
    include: {
      role: true,
      userType: {
        include: {
          customFields: {
            orderBy: { displayOrder: "asc" },
          },
        },
      },
      enrollments: {
        where: { isActive: true },
        include: {
          batch: {
            include: {
              class: true,
            },
          },
        },
      },
      assignedDevices: true,
      healthRecords: {
        take: 10,
        orderBy: { recordedAt: "desc" },
      },
      evaluations: {
        take: 10,
        orderBy: { evaluationDate: "desc" },
        include: {
          benchmarkVersion: {
            include: { task: true },
          },
        },
      },
    },
  });

  if (!user) notFound();

  const profileData = (user.profileData as Record<string, any>) || {};

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title={`${user.fullName} — Member Profile`}
        subtitle={`Classification: ${user.userType?.name || "Member"} • Role: ${user.role?.name || "Standard"}`}
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link
              href={`/${slug}/users`}
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Users Directory</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold">{user.fullName}</span>
          </div>

          <Link
            href={`/${slug}/users`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Users List</span>
          </Link>
        </div>

        {/* Profile Identity Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-300 font-black text-2xl flex items-center justify-center shadow-md">
                {user.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {user.fullName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                    {user.userType?.name || "Member"}
                  </span>
                  {user.isActive ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Institutional Role: <strong className="text-slate-800 dark:text-slate-200">{user.role?.name || "Standard Member"}</strong> • Registered: {formatDate(user.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-900 dark:text-white">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-900 dark:text-white">{user.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Academic & Wearables */}
          <div className="space-y-6">
            {/* Academic Enrollment */}
            <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Class & Batch Enrollment</span>
              </h3>

              {user.enrollments.length > 0 ? (
                <div className="space-y-3">
                  {user.enrollments.map((en) => (
                    <div
                      key={en.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {en.batch.class.name} • {en.batch.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Academic Period: {en.batch.class.academicPeriod} • Schedule: {en.batch.schedule || "Flexible"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400 block">
                          Roll: {en.rollNumber || "N/A"}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          Enrolled {formatDate(en.enrolledAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Not currently enrolled in any academic class or batch.
                </p>
              )}
            </div>

            {/* Smart Band & Wearable Telemetry */}
            <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Watch className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Connected Wearable Band</span>
              </h3>

              {user.assignedDevices.length > 0 ? (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {user.assignedDevices[0].vendorName || "Ray Fit Smart Band"}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                      Synced
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                    Device UUID: {user.assignedDevices[0].deviceUuid}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Firmware: v2.4.1 • Live Bluetooth & Gateway Sync Active
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  No wearable smart band currently paired to this member.
                </p>
              )}
            </div>
          </div>

          {/* Column 2: Extensible Custom Profile Schema Fields */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Dynamic Profile Attributes ({user.userType?.name})</span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Extensible Schema
                </span>
              </div>

              {user.userType?.customFields && user.userType.customFields.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {user.userType.customFields.map((cf) => {
                    const val = profileData[cf.fieldKey];
                    return (
                      <div
                        key={cf.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60"
                      >
                        <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                          {cf.label}
                        </span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {val ? String(val) : <span className="text-slate-400 dark:text-slate-500 italic">Not recorded</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : Object.keys(profileData).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(profileData).map(([k, val]) => (
                    <div
                      key={k}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60"
                    >
                      <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                        {k.replace(/_/g, " ")}
                      </span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {val ? String(val) : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  No custom attributes configured for this user.
                </p>
              )}
            </div>

            {/* Health Evaluation History */}
            <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>Recent Health Benchmark Evaluations</span>
              </h3>

              {user.evaluations.length > 0 ? (
                <div className="space-y-2">
                  {user.evaluations.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {ev.benchmarkVersion.task.title}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          {ev.thresholdSummary}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ev.status === "MET"
                              ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                              : ev.status === "NOT_MET"
                              ? "bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {ev.status}
                        </span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {formatDate(ev.evaluationDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  No automated health benchmark evaluations recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
