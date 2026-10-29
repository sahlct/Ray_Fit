"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Palette,
  UserCheck,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewTenantWizardPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    primaryColor: "#0f766e",
    secondaryColor: "#f59e0b",
    adminFullName: "",
    adminEmail: "",
    adminPassword: "SchoolAdmin@2026",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdTenant, setCreatedTenant] = useState<any>(null);

  const handleNameChange = (name: string) => {
    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    setForm((prev) => ({
      ...prev,
      name,
      slug: autoSlug,
      adminFullName: name ? `${name} Admin` : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to provision tenant.");
        return;
      }

      setCreatedTenant(data.tenant);
    } catch {
      setErrorMessage("Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Provision New School Tenant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Transactional setup: provisions database tenant, standard RBAC roles, default user types, and company admin
          </p>
        </div>

        <Link
          href="/admin"
          className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          ← Return to All Tenants
        </Link>
      </div>

      {createdTenant ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 p-8 text-center space-y-6 shadow-sm dark:shadow-none">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {createdTenant.name} Successfully Provisioned!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
              Default roles (School Admin, Coach, Teacher, Physio, Student, Parent) and custom field schemas have been created in the database.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left max-w-md mx-auto font-mono text-xs space-y-2">
            <div>
              <span className="text-slate-500">School Portal URL:</span>{" "}
              <strong className="text-teal-600 dark:text-teal-400">/{createdTenant.slug}/login</strong>
            </div>
            <div>
              <span className="text-slate-500">Admin Email:</span>{" "}
              <strong className="text-slate-900 dark:text-white">{form.adminEmail}</strong>
            </div>
            <div>
              <span className="text-slate-500">Default Password:</span>{" "}
              <strong className="text-slate-900 dark:text-white">{form.adminPassword}</strong>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link
              href={`/${createdTenant.slug}/dashboard`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg transition-all"
            >
              <span>Launch New School Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setCreatedTenant(null);
                setForm({
                  name: "",
                  slug: "",
                  contactEmail: "",
                  contactPhone: "",
                  address: "",
                  primaryColor: "#0f766e",
                  secondaryColor: "#f59e0b",
                  adminFullName: "",
                  adminEmail: "",
                  adminPassword: "SchoolAdmin@2026",
                });
              }}
            >
              Provision Another School
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: School Identity */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>1. School Identity & Unique Slug</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Institution / School Name *
              </label>
              <Input
                required
                placeholder="e.g. St. Jude International Academy"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Validated URL Slug *
                </label>
                <div className="relative">
                  <Input
                    required
                    placeholder="st-jude-academy"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Accessible at: /{form.slug || "slug"}/login
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Contact Email *
                </label>
                <Input
                  type="email"
                  required
                  placeholder="contact@stjude.edu"
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, contactEmail: e.target.value }))
                  }
                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone
                </label>
                <Input
                  placeholder="+1-555-0100"
                  value={form.contactPhone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, contactPhone: e.target.value }))
                  }
                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Address
                </label>
                <Input
                  placeholder="e.g. 500 Campus Drive, CA"
                  value={form.address}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Branding */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>2. Visual Branding & Theme Tokens</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, primaryColor: e.target.value }))
                    }
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <Input
                    value={form.primaryColor}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, primaryColor: e.target.value }))
                    }
                    className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Secondary Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.secondaryColor}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, secondaryColor: e.target.value }))
                    }
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <Input
                    value={form.secondaryColor}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, secondaryColor: e.target.value }))
                    }
                    className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Initial Admin Account */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>3. Primary Company Super Admin Account</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admin Full Name *
              </label>
              <Input
                required
                placeholder="e.g. Principal Elena Rostova"
                value={form.adminFullName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, adminFullName: e.target.value }))
                }
                className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Login Email *
                </label>
                <Input
                  type="email"
                  required
                  placeholder="admin@stjude.edu"
                  value={form.adminEmail}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, adminEmail: e.target.value }))
                  }
                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.adminPassword}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, adminPassword: e.target.value }))
                    }
                    className="pr-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 h-11"
            >
              {isSubmitting ? "Provisioning..." : "Execute Transactional Provisioning"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
