import React from "react";
import { History, ShieldAlert, Building2, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GlobalAuditPage() {
  const auditLogs = await prisma.auditLog.findMany({
    include: {
      tenant: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex-1 flex flex-col p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Global Platform Audit Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            System-wide log of tenant creation, role updates, and platform administrative actions
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Tenant Organization</th>
                <th className="py-3.5 px-6">Actor / User</th>
                <th className="py-3.5 px-6">Action</th>
                <th className="py-3.5 px-6">Module</th>
                <th className="py-3.5 px-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(log.createdAt)} {formatTime(log.createdAt)}
                    </td>

                    <td className="py-4 px-6 font-sans">
                      {log.tenant ? (
                        <div>
                          <strong className="text-slate-900 dark:text-white block font-semibold">
                            {log.tenant.name}
                          </strong>
                          <span className="text-[11px] text-teal-600 dark:text-teal-400">
                            /{log.tenant.slug}
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          Platform Wide
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 font-sans">
                      <span className="text-slate-900 dark:text-white font-semibold block">
                        {log.user?.fullName || "System Engine"}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {log.user?.email || "Service"}
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

                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400 max-w-sm truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    No global audit events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
