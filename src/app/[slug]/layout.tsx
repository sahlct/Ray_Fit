import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TenantRootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  // Skip special reserved path prefixes
  if (slug === "admin" || slug === "api" || slug === "login") {
    return <>{props.children}</>;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) {
    notFound();
  }

  if (tenant.status === "SUSPENDED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6 text-center">
        <div className="max-w-md p-8 rounded-2xl bg-slate-800 border border-rose-500/30">
          <h2 className="text-2xl font-bold text-rose-400 mb-2">School Access Suspended</h2>
          <p className="text-sm text-slate-300 mb-6">
            Access to <strong>{tenant.name}</strong> has been temporarily suspended by the platform administrator.
          </p>
          <a
            href="/"
            className="inline-flex px-4 py-2 rounded-lg bg-teal-600 text-white font-medium text-sm hover:bg-teal-500"
          >
            Return to Portal Home
          </a>
        </div>
      </div>
    );
  }

  return <>{props.children}</>;
}
