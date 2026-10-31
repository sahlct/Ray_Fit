import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TenantSidebar } from "@/components/navigation/tenant-sidebar";
import { NavProvider } from "@/components/navigation/nav-context";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardRouteGroupLayout(props: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) notFound();

  const session = await getSession();

  return (
    <NavProvider>
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <TenantSidebar
          tenantSlug={tenant.slug}
          tenantName={tenant.name}
          primaryColor={tenant.primaryColor || "#FF6B2C"}
          userFullName={session?.fullName || "Staff Member"}
          userRoleName={session?.roleName || "School Admin"}
          userTypeSlug={session?.userTypeSlug || undefined}
          permissions={session?.permissions || []}
        />
        <div className="flex-1 lg:ml-64 ml-0 min-w-0 flex flex-col min-h-screen print:ml-0 print:p-0 print:min-h-0">
          {props.children}
        </div>
      </div>
    </NavProvider>
  );
}
