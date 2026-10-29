import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TenantLoginForm } from "./tenant-login-form";

export default async function TenantLoginPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) {
    notFound();
  }

  return (
    <TenantLoginForm
      tenantSlug={tenant.slug}
      tenantName={tenant.name}
      primaryColor={tenant.primaryColor}
    />
  );
}
