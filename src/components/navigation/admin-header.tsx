"use client";

import React from "react";
import Link from "next/link";
import { Plus, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { useNav } from "@/components/navigation/nav-context";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AdminHeader({
  title = "Platform Super Admin",
  subtitle = "Global multi-tenant governance, organization lifecycle, and enterprise infrastructure",
}: AdminHeaderProps) {
  const { toggleMobile } = useNav();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md transition-colors print:hidden">
      <div className="flex items-center min-w-0 mr-3">
        {/* Mobile Hamburger Drawer Button */}
        <button
          type="button"
          onClick={toggleMobile}
          className="lg:hidden p-2 -ml-1 mr-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title="Open navigation menu"
        >
          <Menu className="w-5 h-5 text-orange-500" />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* System Health Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>System Healthy</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Provision New School Button */}
        <Link
          href="/admin/tenants/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New School</span>
        </Link>
      </div>
    </header>
  );
}
