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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

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
  primaryColor = "#0f766e",
  userFullName = "Staff Member",
  userRoleName = "School Admin",
  userTypeSlug,
  permissions = [],
}: TenantSidebarProps) {
  const pathname = usePathname();

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

  const isParent =
    !isSchoolAdmin &&
    (userRoleName?.toLowerCase() === "parent" || userTypeSlug === "parent");

  // Determine which sections to render based on user role
  const canSeeUsersDirectory = isSchoolAdmin;
  const canSeeClasses = isSchoolAdmin || isCoach || isTeacher;
  const canSeeHealthTasks = isSchoolAdmin || isCoach;
  const canSeeTimetables = true; // All roles can see schedule
  const canSeeWearables = isSchoolAdmin || isCoach || isStudent;
  const canSeeReports = true; // All roles can see reports
  const canSeeBanners = isSchoolAdmin;
  const canSeeRoles = isSchoolAdmin;
  const canSeeAudit = isSchoolAdmin;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex flex-col justify-between shadow-2xl transition-colors">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md font-bold text-lg shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {tenantName}
            </h1>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold truncate">
              Ray Fit Enterprise
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Overview / Student Dashboard */}
          <Link
            href={`/${tenantSlug}/dashboard`}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
              pathname === `/${tenantSlug}/dashboard`
                ? "bg-teal-600 text-white shadow-md shadow-teal-900/30 font-semibold"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <LayoutDashboard
              className={cn(
                "w-4 h-4 transition-transform group-hover:scale-110",
                pathname === `/${tenantSlug}/dashboard`
                  ? "text-white"
                  : "text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-slate-200"
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
                    ? "text-teal-700 dark:text-teal-300 font-semibold bg-slate-100 dark:bg-slate-800/50"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <Users
                    className={cn(
                      "w-4 h-4 transition-transform group-hover:scale-110",
                      isUsersSectionActive
                        ? "text-teal-600 dark:text-teal-400"
                        : "text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-slate-200"
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
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      pathname === `/${tenantSlug}/users`
                        ? "bg-teal-600 text-white font-bold shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Users List</span>
                  </Link>

                  <Link
                    href={`/${tenantSlug}/users/types`}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      pathname.startsWith(`/${tenantSlug}/users/types`)
                        ? "bg-teal-600 text-white font-bold shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>User Types</span>
                  </Link>

                  <Link
                    href={`/${tenantSlug}/users/fields`}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      pathname.startsWith(`/${tenantSlug}/users/fields`)
                        ? "bg-teal-600 text-white font-bold shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Custom Field Builder</span>
                  </Link>

                  <Link
                    href={`/${tenantSlug}/users/registrations`}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      pathname.startsWith(`/${tenantSlug}/users/registrations`)
                        ? "bg-teal-600 text-white font-bold shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="truncate">Public Registrations</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Classes & Batches */}
          {canSeeClasses && (
            <Link
              href={`/${tenantSlug}/classes`}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                pathname.startsWith(`/${tenantSlug}/classes`)
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/30 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <GraduationCap
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  pathname.startsWith(`/${tenantSlug}/classes`)
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-slate-200"
                )}
              />
              <span className="truncate">Classes & Batches</span>
            </Link>
          )}

          {/* Health Tasks & Benchmarks */}
          {canSeeHealthTasks && (
            <Link
              href={`/${tenantSlug}/tasks`}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                pathname.startsWith(`/${tenantSlug}/tasks`)
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/30 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Activity
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  pathname.startsWith(`/${tenantSlug}/tasks`)
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-slate-200"
                )}
              />
              <span className="truncate">Health Tasks & Benchmarks</span>
            </Link>
          )}

          {/* Class Timetables */}
          {canSeeTimetables && (
            <Link
              href={`/${tenantSlug}/timetables`}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                pathname.startsWith(`/${tenantSlug}/timetables`)
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/30 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <CalendarDays
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  pathname.startsWith(`/${tenantSlug}/timetables`)
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-slate-200"
                )}
              />
              <span className="truncate">
                {isStudent ? "Class Timetables" : "Class Timetables"}
              </span>
            </Link>
          )}

          {/* Wearables */}
          {canSeeWearables && (
            <Link
              href={`/${tenantSlug}/wearables`}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                pathname.startsWith(`/${tenantSlug}/wearables`)
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/30 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Watch
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  pathname.startsWith(`/${tenantSlug}/wearables`)
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-slate-200"
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
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                pathname.startsWith(`/${tenantSlug}/banners`)
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/30 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <SlidersHorizontal
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  pathname.startsWith(`/${tenantSlug}/banners`)
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-slate-200"
                )}
              />
              <span className="truncate">Ad Tiles & Slider</span>
            </Link>
          )}

          {/* Reports & Analytics */}
          {canSeeReports && (
            <Link
              href={`/${tenantSlug}/reports`}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                pathname.startsWith(`/${tenantSlug}/reports`)
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/30 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <BarChart3
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  pathname.startsWith(`/${tenantSlug}/reports`)
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-slate-200"
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
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                pathname.startsWith(`/${tenantSlug}/roles`)
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/30 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <ShieldCheck
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  pathname.startsWith(`/${tenantSlug}/roles`)
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-slate-200"
                )}
              />
              <span className="truncate">Roles & Permissions</span>
            </Link>
          )}

          {/* Audit Trail - STRICTLY ADMIN ONLY */}
          {canSeeAudit && (
            <Link
              href={`/${tenantSlug}/audit`}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                pathname.startsWith(`/${tenantSlug}/audit`)
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/30 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <History
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  pathname.startsWith(`/${tenantSlug}/audit`)
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-slate-200"
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
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
              {userFullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {userFullName}
              </p>
              <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold truncate">
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
  );
}
