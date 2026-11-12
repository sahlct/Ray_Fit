"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Tag,
  Settings2,
  GraduationCap,
  Activity,
  CalendarDays,
  Watch,
  BarChart3,
  ShieldCheck,
  History,
  LogOut,
  Building2,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { useNav } from "@/components/navigation/nav-context";

interface TenantSidebarProps {
  tenantSlug: string;
  tenantName: string;
  primaryColor?: string;
  userFullName?: string;
  userRoleName?: string;
  userTypeSlug?: string;
  permissions?: string[];
}

export function TenantSidebar({
  tenantSlug,
  tenantName,
  primaryColor = "#FF6B2C",
  userFullName = "Staff Member",
  userRoleName = "School Admin",
  userTypeSlug,
  permissions = [],
}: TenantSidebarProps) {
  const pathname = usePathname();
  const { isMobileOpen, closeMobile } = useNav();

  const isUsersSectionActive = pathname.startsWith(`/${tenantSlug}/users`);
  const [isUsersOpen, setIsUsersOpen] = useState(true);

  // Role Access Evaluation
  const isSchoolAdmin =
    userRoleName === "School Admin" ||
    permissions.includes("*") ||
    permissions.includes("TENANTS:MANAGE") ||
    permissions.includes("USERS:MANAGE") ||
    permissions.includes("ROLES:MANAGE");

  const isStudent =
    !isSchoolAdmin &&
    (userRoleName?.toLowerCase() === "student" || userTypeSlug === "student");

  const isCoach =
    !isSchoolAdmin &&
    (userRoleName?.toLowerCase() === "coach" || userTypeSlug === "coach");

  const isTeacher =
    !isSchoolAdmin &&
    (userRoleName?.toLowerCase() === "teacher" || userTypeSlug === "teacher");

  // Determine which sections to render based on user role
  const canSeeUsersDirectory = isSchoolAdmin;
  const canSeeClasses = isSchoolAdmin || isCoach || isTeacher;
  const canSeeHealthTasks = isSchoolAdmin || isCoach;
  const canSeeTimetables = true;
  const canSeeWearables = isSchoolAdmin || isCoach || isStudent;
  const canSeeReports = true;
  const canSeeBanners = isSchoolAdmin;
  const canSeeRoles = isSchoolAdmin;
  const canSeeAudit = isSchoolAdmin;

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
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out print:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-900">
                <img
                  src="/brand/png/raysfit-icon-76.png"
                  alt="Rays Fit"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).style.display = "none";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {tenantName}
                </h1>
                <p className="text-xs font-semibold truncate bg-gradient-to-r from-[#FF6B2C] to-[#FF2D78] bg-clip-text text-transparent">
                  Rays Fit Enterprise
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

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {/* Overview / Student Dashboard */}
            <Link
              href={`/${tenantSlug}/dashboard`}
              onClick={closeMobile}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                pathname === `/${tenantSlug}/dashboard`
                  ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8042] text-white shadow-md shadow-orange-500/20 font-bold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <LayoutDashboard
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  pathname === `/${tenantSlug}/dashboard`
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-slate-200"
                )}
              />
              <span className="truncate">
                {isStudent ? "My Dashboard" : "Overview"}
              </span>
            </Link>

            {/* Collapsible Users Menu - STRICTLY ONLY FOR ADMINS */}
            {canSeeUsersDirectory && (
              <div className="space-y-0.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsUsersOpen(!isUsersOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group cursor-pointer",
                    isUsersSectionActive
                      ? "text-orange-600 dark:text-orange-400 font-semibold bg-orange-500/10 dark:bg-orange-500/15"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Users
                      className={cn(
                        "w-4 h-4 transition-transform group-hover:scale-110",
                        isUsersSectionActive
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-slate-500 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-slate-200"
                      )}
                    />
                    <span>Users</span>
                  </div>
                  {isUsersOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {isUsersOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-4">
                    <Link
                      href={`/${tenantSlug}/users`}
                      onClick={closeMobile}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        pathname === `/${tenantSlug}/users`
                          ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8042] text-white font-bold shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Users List</span>
                    </Link>

                    <Link
                      href={`/${tenantSlug}/users/types`}
                      onClick={closeMobile}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        pathname.startsWith(`/${tenantSlug}/users/types`)
                          ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8042] text-white font-bold shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>User Types</span>
                    </Link>

                    <Link
                      href={`/${tenantSlug}/users/fields`}
                      onClick={closeMobile}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        pathname.startsWith(`/${tenantSlug}/users/fields`)
                          ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8042] text-white font-bold shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>Custom Field Builder</span>
                    </Link>

                    <Link
                      href={`/${tenantSlug}/users/registrations`}
                      onClick={closeMobile}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        pathname.startsWith(`/${tenantSlug}/users/registrations`)
                          ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8042] text-white font-bold shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                      <span className="truncate">Public Registrations</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Programs & Batches */}
            {canSeeClasses && (
              <Link
                href={`/${tenantSlug}/classes`}
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  pathname.startsWith(`/${tenantSlug}/classes`)
                    ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8042] text-white shadow-md shadow-orange-500/20 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <GraduationCap
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    pathname.startsWith(`/${tenantSlug}/classes`)
                      ? "text-white"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-slate-200"
                  )}
                />
                <span className="truncate">Programs & Batches</span>
              </Link>
            )}

            {/* Health Tasks & Benchmarks */}
            {canSeeHealthTasks && (
              <Link
                href={`/${tenantSlug}/tasks`}
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  pathname.startsWith(`/${tenantSlug}/tasks`)
                    ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8042] text-white shadow-md shadow-orange-500/20 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Activity
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    pathname.startsWith(`/${tenantSlug}/tasks`)
                      ? "text-white"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-slate-200"
                  )}
                />
                <span className="truncate">Health Tasks & Benchmarks</span>
              </Link>
            )}

            {/* Program Timetables */}
            {canSeeTimetables && (
              <Link
                href={`/${tenantSlug}/timetables`}
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  pathname.startsWith(`/${tenantSlug}/timetables`)
                    ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8042] text-white shadow-md shadow-orange-500/20 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <CalendarDays
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    pathname.startsWith(`/${tenantSlug}/timetables`)
                      ? "text-white"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-slate-200"
                  )}
                />
                <span className="truncate">Program Timetables</span>
              </Link>
            )}

            {/* Wearables */}
            {canSeeWearables && (
              <Link
                href={`/${tenantSlug}/wearables`}
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  pathname.startsWith(`/${tenantSlug}/wearables`)
                    ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8042] text-white shadow-md shadow-orange-500/20 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Watch
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    pathname.startsWith(`/${tenantSlug}/wearables`)
                      ? "text-white"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-slate-200"
                  )}
                />
                <span className="truncate">
                  {isStudent ? "My Smart Band" : "Wearables & Ingestion"}
                </span>
              </Link>
            )}

            {/* Ad Tiles & App Carousel */}
            {canSeeBanners && (
              <Link
                href={`/${tenantSlug}/banners`}
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  pathname.startsWith(`/${tenantSlug}/banners`)
                    ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8042] text-white shadow-md shadow-orange-500/20 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <SlidersHorizontal
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    pathname.startsWith(`/${tenantSlug}/banners`)
                      ? "text-white"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-slate-200"
                  )}
                />
                <span className="truncate">Ad Tiles & Slider</span>
              </Link>
            )}

            {/* Reports & Analytics */}
            {canSeeReports && (
              <Link
                href={`/${tenantSlug}/reports`}
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  pathname.startsWith(`/${tenantSlug}/reports`)
                    ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8042] text-white shadow-md shadow-orange-500/20 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <BarChart3
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    pathname.startsWith(`/${tenantSlug}/reports`)
                      ? "text-white"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-slate-200"
                  )}
                />
                <span className="truncate">
                  {isStudent ? "My Health Reports" : "Reports & Analytics"}
                </span>
              </Link>
            )}

            {/* Roles & Permissions - STRICTLY ADMIN ONLY */}
            {canSeeRoles && (
              <Link
                href={`/${tenantSlug}/roles`}
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  pathname.startsWith(`/${tenantSlug}/roles`)
                    ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8042] text-white shadow-md shadow-orange-500/20 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <ShieldCheck
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    pathname.startsWith(`/${tenantSlug}/roles`)
                      ? "text-white"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-slate-200"
                  )}
                />
                <span className="truncate">Roles & Permissions</span>
              </Link>
            )}

            {/* Audit Trail - STRICTLY ADMIN ONLY */}
            {canSeeAudit && (
              <Link
                href={`/${tenantSlug}/audit`}
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  pathname.startsWith(`/${tenantSlug}/audit`)
                    ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8042] text-white shadow-md shadow-orange-500/20 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <History
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    pathname.startsWith(`/${tenantSlug}/audit`)
                      ? "text-white"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-slate-200"
                  )}
                />
                <span className="truncate">Audit Trail</span>
              </Link>
            )}
          </nav>
        </div>

        {/* User Footer & Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                {userFullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {userFullName}
                </p>
                <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold truncate">
                  {userRoleName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
