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
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { useNav } from "@/components/navigation/nav-context";

export function AdminSidebar() {
  const pathname = usePathname();
  const { isMobileOpen, closeMobile } = useNav();

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
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-white flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl print:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 bg-slate-900 shrink-0">
                <img
                  src="/brand/png/raysfit-icon-76.png"
                  alt="Rays Fit"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-wide">
                  RAYS FIT
                </h1>
                <p className="text-xs bg-gradient-to-r from-[#FF6B2C] to-[#FF2D78] bg-clip-text text-transparent font-bold">
                  Platform Super Admin
                </p>
              </div>
            </div>
            {/* Close button on mobile/tablet */}
            <button
              onClick={closeMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
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
                  onClick={closeMobile}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    isActive
                      ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8042] text-white shadow-md shadow-orange-500/20 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-transform group-hover:scale-110",
                      isActive
                        ? "text-white"
                        : "text-slate-500 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-slate-200"
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
              <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold">
                sahl.prosevo@gmail.com
              </p>
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
    </>
  );
}
