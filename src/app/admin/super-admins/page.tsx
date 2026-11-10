"use client";

import React, { useState, useEffect } from "react";
import {
  Users2,
  UserPlus,
  ShieldCheck,
  Search,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Calendar,
  Lock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/navigation/admin-header";

interface SuperAdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function SuperAdminsPage() {
  const [admins, setAdmins] = useState<SuperAdminUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal State
  const [editingAdmin, setEditingAdmin] = useState<SuperAdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    password: "",
    isActive: true,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/super-admins");
      const json = await res.json();
      if (res.ok && json.success) {
        setAdmins(json.data);
        if (json.currentUserId) setCurrentUserId(json.currentUserId);
      } else {
        toast.error(json.error || "Failed to load super admins.");
      }
    } catch {
      toast.error("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (createForm.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/super-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        toast.success("Platform Super Admin created successfully!");
        setIsCreateOpen(false);
        setCreateForm({ fullName: "", email: "", phone: "", password: "" });
        fetchAdmins();
      } else {
        toast.error(json.error || "Failed to create super admin.");
      }
    } catch {
      toast.error("Error creating super admin.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = (admin: SuperAdminUser) => {
    setEditingAdmin(admin);
    setEditForm({
      fullName: admin.fullName,
      phone: admin.phone || "",
      password: "",
      isActive: admin.isActive,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/super-admins/${editingAdmin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        toast.success("Super admin updated successfully!");
        setEditingAdmin(null);
        fetchAdmins();
      } else {
        toast.error(json.error || "Failed to update super admin.");
      }
    } catch {
      toast.error("Error updating super admin.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/super-admins/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (res.ok && json.success) {
        toast.success("Super admin removed successfully.");
        setDeletingId(null);
        fetchAdmins();
      } else {
        toast.error(json.error || "Failed to delete super admin.");
      }
    } catch {
      toast.error("Error deleting super admin.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.phone && a.phone.includes(search))
  );

  const activeCount = admins.filter((a) => a.isActive).length;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <AdminHeader title="Platform Super Admins" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Page Top Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-orange-400" />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Platform Super Admins
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Universal root administrators with unrestricted governance over all tenant schools and platform infrastructure.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Super Admin</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Total Super Admins
            </div>
            <div className="text-2xl font-black text-white mt-1">{admins.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Root platform governors</div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 backdrop-blur-sm">
            <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              Active Admins
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</div>
            <div className="text-[11px] text-emerald-500/80 mt-1">Authorized for root access</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Inactive / Suspended
            </div>
            <div className="text-2xl font-black text-slate-400 mt-1">{admins.length - activeCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Access revoked</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search super admins by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <button
            onClick={fetchAdmins}
            title="Refresh list"
            className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer self-end sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Super Admins Table */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/40 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-800 uppercase text-[10px] tracking-wider text-slate-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Administrator</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Contact Phone</th>
                  <th className="py-3.5 px-4">Platform Scope</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                        <span>Loading platform administrators...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No super administrators found.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => {
                    const isSelf = admin.id === currentUserId;
                    return (
                      <tr
                        key={admin.id}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-xs shrink-0 shadow-md">
                              {admin.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white flex items-center gap-2">
                                <span className="truncate">{admin.fullName}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate">{admin.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 hidden md:table-cell text-slate-400">
                          {admin.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{admin.phone}</span>
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                            <ShieldCheck className="w-3 h-3 text-indigo-400" />
                            <span>SUPER_ADMIN (Root)</span>
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          {admin.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              <span>Inactive</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 hidden lg:table-cell text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{new Date(admin.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(admin)}
                              title="Edit Administrator"
                              className="p-1.5 rounded-lg border border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              disabled={isSelf}
                              onClick={() => setDeletingId(admin.id)}
                              title={isSelf ? "Cannot delete yourself" : "Delete Super Admin"}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isSelf
                                  ? "border-slate-800 text-slate-700 cursor-not-allowed"
                                  : "border-rose-900/60 hover:border-rose-600 hover:bg-rose-950/40 text-rose-400"
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* CREATE MODAL DIALOG */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">Create Root Super Admin</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address <span className="text-orange-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@raysfit.io"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 012-3456"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password <span className="text-orange-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-400 text-slate-950 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Super Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL DIALOG */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">Edit Platform Super Admin</h3>
              </div>
              <button
                onClick={() => setEditingAdmin(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email (Immutable)
                </label>
                <input
                  type="email"
                  disabled
                  value={editingAdmin.email}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters to reset"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-slate-300">Account Active</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    disabled={editingAdmin.id === currentUserId}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-400 text-slate-950 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-900/60 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Revoke Super Admin Access?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to permanently delete this Platform Super Administrator? This will immediately revoke all platform governance rights.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

