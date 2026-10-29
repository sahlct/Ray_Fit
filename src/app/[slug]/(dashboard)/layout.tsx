import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TenantSidebar } from "@/components/navigation/tenant-sidebar";
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
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <TenantSidebar
        tenantSlug={tenant.slug}
        tenantName={tenant.name}
        primaryColor={tenant.primaryColor || "#0f766e"}
        userFullName={session?.fullName || "Staff Member"}
        userRoleName={session?.roleName || "School Admin"}
        userTypeSlug={session?.userTypeSlug || undefined}
        permissions={session?.permissions || []}
      />
      <div className="flex-1 ml-64 min-w-0 flex flex-col min-h-screen">
        {props.children}
      </div>
    </div>
  );
}
