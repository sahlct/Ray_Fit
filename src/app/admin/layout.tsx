import React from "react";
import { AdminSidebar } from "@/components/navigation/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <AdminSidebar />
      <div className="flex-1 ml-64 min-w-0 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
