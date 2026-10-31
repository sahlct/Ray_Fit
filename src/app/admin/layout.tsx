import React from "react";
import { AdminSidebar } from "@/components/navigation/admin-sidebar";
import { NavProvider } from "@/components/navigation/nav-context";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavProvider>
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64 ml-0 min-w-0 flex flex-col min-h-screen print:ml-0 print:p-0 print:min-h-0">
          {children}
        </div>
      </div>
    </NavProvider>
  );
}
