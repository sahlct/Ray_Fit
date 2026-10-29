import React from "react";
import { notFound, redirect } from "next/navigation";
import { History, ShieldAlert, User, Clock, Terminal } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { formatDate, formatTime } from "@/lib/utils";
import { getSession } from "@/lib/auth";

export default async function TenantAuditPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  const session = await getSession();
  const isSchoolAdmin =
    session?.platformRole === "SUPER_ADMIN" ||
    session?.roleName === "School Admin" ||
    session?.permissions?.includes("*") ||
    session?.permissions?.includes("AUDIT:VIEW");

  if (!isSchoolAdmin) {
    redirect(`/${slug}/dashboard`);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      auditLogs: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!tenant) notFound();

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title="Institutional Audit Trail"
        subtitle="Immutable security logs of administrative mutations, task assignments, and benchmark updates"
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Audit Event Log
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing recent security and administrative actions within this tenant
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 w-14">#</th>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Actor / User</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">Module</th>
                  <th className="py-3.5 px-6">Details / Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-xs">
                {tenant.auditLogs.length > 0 ? (
                  tenant.auditLogs.map((log, idx) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
                    >
                      <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                        #{idx + 1}
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(log.createdAt)} {formatTime(log.createdAt)}
                      </td>

                      <td className="py-4 px-6 font-sans">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {log.user?.fullName || "System Engine"}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {log.user?.email || "Internal Service"}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-bold text-teal-600 dark:text-teal-400">
                        {log.action}
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 font-sans">
                          {log.module}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300 max-w-md truncate">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      No audit events logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
