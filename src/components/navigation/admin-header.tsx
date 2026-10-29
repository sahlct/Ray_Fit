"use client";

import React from "react";
import Link from "next/link";
import { Plus, Activity, Bell, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AdminHeader({
  title = "Platform Super Admin",
  subtitle = "Global multi-tenant governance, organization lifecycle, and enterprise infrastructure",
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* System Health Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>System Healthy</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Provision New School Button */}
        <Link
          href="/admin/tenants/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New School</span>
        </Link>
      </div>
    </header>
  );
}
