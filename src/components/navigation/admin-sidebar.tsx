"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Building2,
  Users2,
  CreditCard,
  FileText,
  Activity,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

export function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Platform Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Tenant Organizations",
      href: "/admin",
      icon: Building2,
    },
    {
      title: "Create School Tenant",
      href: "/admin/tenants/new",
      icon: ShieldAlert,
    },
    {
      title: "Platform Subscriptions",
      href: "/admin/subscriptions",
      icon: CreditCard,
    },
    {
      title: "Global Audit Trail",
      href: "/admin/audit",
      icon: FileText,
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-white flex flex-col justify-between transition-colors shadow-2xl">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-black shadow-lg">
            <Activity className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
              RAY FIT
            </h1>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
              Platform Super Admin
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-teal-600 text-white shadow-md font-semibold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                  )}
                />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
              Master Administrator
            </p>
            <p className="text-[11px] text-teal-600 dark:text-teal-400">sahl.prosevo@gmail.com</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}
