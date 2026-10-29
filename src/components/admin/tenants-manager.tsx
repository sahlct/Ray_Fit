"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ExternalLink,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  Watch,
  Activity,
  Layers,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/sonner";
import { formatDate } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone: string | null;
  address: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  status: string;
  subscriptionPlan: string | null;
  createdAt: string | Date;
  _count: {
    users: number;
    classes: number;
    wearableDevices: number;
    tasks: number;
  };
  users: {
    id: string;
    fullName: string;
    email: string;
  }[];
}

export function TenantsManager({
  initialTenants,
}: {
  initialTenants: TenantItem[];
}) {
  const [tenants, setTenants] = useState<TenantItem[]>(initialTenants);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals
  const [viewingTenant, setViewingTenant] = useState<TenantItem | null>(null);
  const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<TenantItem | null>(null);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    primaryColor: "#0f766e",
    secondaryColor: "#f59e0b",
    status: "ACTIVE",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/admin/tenants");
      const data = await res.json();
      if (data.tenants) {
        setTenants(data.tenants);
      }
    } catch {
      toast.error("Failed to refresh tenants.");
    }
  };

  const openEdit = (tenant: TenantItem) => {
    setEditingTenant(tenant);
    setEditForm({
      name: tenant.name,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone || "",
      address: tenant.address || "",
      primaryColor: tenant.primaryColor || "#0f766e",
      secondaryColor: tenant.secondaryColor || "#f59e0b",
      status: tenant.status,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/tenants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTenant.id,
          ...editForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update tenant.");
        return;
      }

      toast.success(`Organization "${editForm.name}" updated!`);
      setEditingTenant(null);
      fetchTenants();
    } catch {
      toast.error("Network error while updating tenant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTenant) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/tenants?id=${deletingTenant.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete organization.");
        return;
      }

      toast.success(data.message || `Organization "${deletingTenant.name}" deleted.`);
      setDeletingTenant(null);
      fetchTenants();
    } catch {
      toast.error("Network error while deleting organization.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedTenants = filteredTenants.slice((page - 1) * limit, page * limit);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden shadow-sm dark:shadow-none">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Managed School Organizations ({filteredTenants.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Complete tenant list with custom slug routing, admin accounts, and governance actions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Limit selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Show:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none cursor-pointer"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-6 w-16">#</th>
              <th className="py-3.5 px-6">School Name</th>
              <th className="py-3.5 px-6">Slug & Domain</th>
              <th className="py-3.5 px-6">Company Admin</th>
              <th className="py-3.5 px-6">Cohort Stats</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {paginatedTenants.length > 0 ? (
              paginatedTenants.map((t, idx) => {
                const schoolAdmin = t.users[0];

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Indexing Column with pagination offset */}
                    <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                      #{(page - 1) * limit + idx + 1}
                    </td>

                    {/* School Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0"
                          style={{ backgroundColor: t.primaryColor || "#0f766e" }}
                        >
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => setViewingTenant(t)}
                            className="font-bold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 text-left transition-colors"
                          >
                            {t.name}
                          </button>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {t.contactEmail}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-4 px-6 text-xs font-mono text-teal-600 dark:text-teal-400">
                      /{t.slug}
                    </td>

                    {/* Admin */}
                    <td className="py-4 px-6 text-xs">
                      {schoolAdmin ? (
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {schoolAdmin.fullName}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {schoolAdmin.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    {/* Cohort Stats */}
                    <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span>{t._count.users} Users</span>
                        <span>•</span>
                        <span>{t._count.classes} Classes</span>
                        <span>•</span>
                        <span>{t._count.wearableDevices} Bands</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          t.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : t.status === "SUSPENDED"
                            ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            t.status === "ACTIVE"
                              ? "bg-emerald-500"
                              : t.status === "SUSPENDED"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                          }`}
                        />
                        {t.status}
                      </span>
                    </td>

                    {/* Actions: View, Edit, Delete, Launch */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingTenant(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Organization Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Organization"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingTenant(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-colors"
                          title="Delete Organization"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <Link
                          href={`/${t.slug}/dashboard`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors ml-1"
                        >
                          <span>Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                  No organizations found matching search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dynamic Table Pagination at bottom */}
      <TablePagination
        currentPage={page}
        totalPages={Math.ceil(filteredTenants.length / limit) || 1}
        totalItems={filteredTenants.length}
        limit={limit}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      {/* View Modal */}
      <Modal
        isOpen={Boolean(viewingTenant)}
        onClose={() => setViewingTenant(null)}
        title={viewingTenant?.name || "Organization Profile"}
        description={`Domain: /${viewingTenant?.slug} • Multi-Tenant Enterprise Record`}
        maxWidth="lg"
      >
        {viewingTenant && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">
                  Contact Email
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">{viewingTenant.contactEmail}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">
                  Contact Phone
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">{viewingTenant.contactPhone || "—"}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">
                  Physical Address
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">{viewingTenant.address || "—"}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">
                  Account Status
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">{viewingTenant.status}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 space-y-2">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase">
                Active Tenant Cohort Metrics
              </span>
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-lg font-bold text-slate-900 dark:text-white block">{viewingTenant._count.users}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Users</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-lg font-bold text-slate-900 dark:text-white block">{viewingTenant._count.classes}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Classes</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-lg font-bold text-slate-900 dark:text-white block">{viewingTenant._count.wearableDevices}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Wearables</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-lg font-bold text-slate-900 dark:text-white block">{viewingTenant._count.tasks}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Health Tasks</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <Link
                href={`/${viewingTenant.slug}/login`}
                target="_blank"
                className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 font-medium flex items-center gap-1"
              >
                <span>Open Login Portal (/{viewingTenant.slug}/login)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Button
                variant="outline"
                onClick={() => setViewingTenant(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={Boolean(editingTenant)}
        onClose={() => setEditingTenant(null)}
        title={`Edit Organization: ${editingTenant?.name}`}
        description="Update corporate profile, contact coordinates, and provisioning status"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Organization Name *
            </label>
            <Input
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Contact Email *
              </label>
              <Input
                type="email"
                required
                value={editForm.contactEmail}
                onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Contact Phone
              </label>
              <Input
                value={editForm.contactPhone}
                onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Physical Address
            </label>
            <Input
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Account Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="TRIAL">TRIAL</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editForm.primaryColor}
                  onChange={(e) => setEditForm({ ...editForm, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <Input
                  value={editForm.primaryColor}
                  onChange={(e) => setEditForm({ ...editForm, primaryColor: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingTenant(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingTenant)}
        onClose={() => setDeletingTenant(null)}
        title="Confirm Organization Deletion"
        description="Permanently delete this tenant and all its associated data"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                Delete &quot;{deletingTenant?.name}&quot;?
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                This will permanently delete the organization domain <strong className="text-slate-900 dark:text-white">/{deletingTenant?.slug}</strong>, including all {deletingTenant?._count.users} members, classes, schedules, and smart band health records.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingTenant(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              {isSubmitting ? "Deleting..." : "Confirm & Delete Organization"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
