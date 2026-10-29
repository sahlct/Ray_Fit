"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Watch,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  Edit2,
  Trash2,
  ExternalLink,
  GraduationCap,
  Activity,
  Tag,
  Filter,
} from "lucide-react";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/sonner";
import { TablePagination } from "@/components/ui/table-pagination";

interface UserTypeWithFields {
  id: string;
  name: string;
  slug: string;
  iconName: string | null;
  isSystem: boolean;
  customFields: {
    id: string;
    label: string;
    fieldKey: string;
    fieldType: string;
    isRequired: boolean;
    placeholder: string | null;
    options: any;
  }[];
}

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  profileData: any;
  roleId: string | null;
  userTypeId: string | null;
  role: { id: string; name: string } | null;
  userType: UserTypeWithFields | null;
  enrollments: {
    batch: { name: string; class: { name: string } };
  }[];
  assignedDevices: { deviceUuid: string; vendorName: string }[];
}

export default function UsersDirectoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [userTypes, setUserTypes] = useState<UserTypeWithFields[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states (default limit 10)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Create / Edit User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "Password@123",
    roleId: "",
    userTypeId: "",
    profileData: {} as Record<string, any>,
  });

  // Delete Confirmation Modal
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState<UserItem | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("Password@123");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const qParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (searchQuery.trim()) qParams.append("search", searchQuery.trim());
      if (selectedTypeFilter !== "all") qParams.append("type", selectedTypeFilter);

      const [uRes, fRes, rRes] = await Promise.all([
        fetch(`/api/${slug}/users?${qParams.toString()}`),
        fetch(`/api/${slug}/users/fields`),
        fetch(`/api/${slug}/roles`),
      ]);

      if (uRes.status === 403) {
        window.location.href = `/${slug}/dashboard`;
        return;
      }

      const uData = await uRes.json();
      const fData = await fRes.json();
      const rData = await rRes.json();

      if (uData.users) {
        setUsers(uData.users);
        setTotalUsers(uData.pagination?.total ?? uData.users.length);
      }
      if (fData.userTypes) {
        setUserTypes(fData.userTypes);
      }
      if (rData.roles) setRoles(rData.roles);
    } catch {
      toast.error("Failed to load user directory.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [slug, page, limit, searchQuery, selectedTypeFilter]);

  const selectedUserType = userTypes.find((ut) => ut.id === formData.userTypeId);

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let generated = "";
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: generated }));
    setShowPassword(true);
  };

  const handleCustomFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      profileData: {
        ...prev.profileData,
        [key]: value,
      },
    }));
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditUserId(null);
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      password: "Password@123",
      roleId: roles[0]?.id || "",
      userTypeId: userTypes[0]?.id || "",
      profileData: {},
    });
    setShowPassword(false);
    setIsUserModalOpen(true);
  };

  const openEditModal = (user: UserItem) => {
    setIsEditing(true);
    setEditUserId(user.id);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      password: "", // blank unless admin wants to update password
      roleId: user.roleId || "",
      userTypeId: user.userTypeId || userTypes[0]?.id || "",
      profileData: user.profileData || {},
    });
    setShowPassword(false);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    if (!isEditing && (!formData.password || formData.password.length < 6)) {
      toast.error("Password must be at least 6 characters long.");
      setFormSubmitting(false);
      return;
    }

    try {
      if (isEditing && editUserId) {
        // Update user
        const res = await fetch(`/api/${slug}/users`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: editUserId,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            roleId: formData.roleId || null,
            userTypeId: formData.userTypeId || null,
            profileData: formData.profileData,
            newPassword: formData.password || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to update member.");
          return;
        }

        toast.success(`Member "${formData.fullName}" updated successfully!`);
      } else {
        // Create user
        const res = await fetch(`/api/${slug}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to create member.");
          return;
        }

        toast.success(`Member "${formData.fullName}" created with login credentials!`);
      }

      setIsUserModalOpen(false);
      fetchData();
    } catch {
      toast.error("Network error while saving user.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/${slug}/users?id=${deletingUser.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete user.");
        return;
      }

      toast.success(data.message || `User "${deletingUser.fullName}" deleted.`);
      setDeletingUser(null);
      fetchData();
    } catch {
      toast.error("Network error while deleting user.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    setResetSubmitting(true);

    try {
      const res = await fetch(`/api/${slug}/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: resetModalUser.id,
          newPassword: resetPasswordValue,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to reset password.");
        return;
      }

      toast.success(`Password for ${resetModalUser.fullName} updated!`);
      setResetModalUser(null);
      setResetPasswordValue("Password@123");
    } catch {
      toast.error("Network error while resetting password.");
    } finally {
      setResetSubmitting(false);
    }
  };

  // Filter users by dropdown selection and search query
  const filteredUsers = users.filter((u) => {
    const matchesType =
      selectedTypeFilter === "all" ||
      u.userType?.slug === selectedTypeFilter ||
      (!u.userType && selectedTypeFilter === "all");

    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));

    return matchesType && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title="Institutional Users Directory"
        subtitle="Manage student, athletic coaching, academic, and clinical accounts with credential control and dynamic schema inspection"
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Controls: User Type Select Field, Limit Selector, Search & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* User Type Select Filter */}
            <div className="flex items-center gap-2">
              <select
                value={selectedTypeFilter}
                onChange={(e) => {
                  setSelectedTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer"
              >
                <option value="all">All Classifications ({totalUsers})</option>
                {userTypes.map((ut) => (
                  <option key={ut.id} value={ut.slug}>
                    {ut.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Limit Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Show:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            <Link
              href={`/${slug}/users/types`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Manage Types</span>
            </Link>

            <Link
              href={`/${slug}/users/registrations`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-teal-500/30 bg-teal-500/10 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Public Registrations</span>
            </Link>
          </div>

          {/* Search & Add Member */}
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Search name, email, phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs"
              />
            </div>

            <Button
              onClick={openCreateModal}
              className="gap-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </Button>
          </div>
        </div>

        {/* User Roster Table with Separated Name, Email, Phone Columns & Order Indexing */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 w-16">#</th>
                  <th className="py-3.5 px-6">Full Name</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Phone Number</th>
                  <th className="py-3.5 px-6">Classification & Role</th>
                  <th className="py-3.5 px-6">Class / Batch</th>
                  <th className="py-3.5 px-6">Smart Band</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                      Loading user directory...
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user, idx) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Order / Index Column with Pagination offset */}
                      <td className="py-4 px-6 text-xs text-slate-400 dark:text-slate-500 font-mono">
                        #{(page - 1) * limit + idx + 1}
                      </td>

                      {/* 1. Name Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/20 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {user.fullName.substring(0, 2)}
                          </div>
                          <Link
                            href={`/${slug}/users/${user.id}`}
                            className="font-bold text-slate-900 dark:text-white text-sm hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                          >
                            {user.fullName}
                          </Link>
                        </div>
                      </td>

                      {/* 2. Email Address Column */}
                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300 font-sans">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      {/* 3. Phone Number Column */}
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-sans">
                        {user.phone ? (
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Classification & Role */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                            {user.userType?.name || "Member"}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {user.role?.name || "Standard Member"}
                          </p>
                        </div>
                      </td>

                      {/* Batch Enrollment */}
                      <td className="py-4 px-6">
                        {user.enrollments && user.enrollments.length > 0 ? (
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {user.enrollments[0].batch.class.name} •{" "}
                            <span className="text-teal-600 dark:text-teal-400 font-bold">
                              {user.enrollments[0].batch.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Smart Band */}
                      <td className="py-4 px-6">
                        {user.assignedDevices && user.assignedDevices.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <Watch className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="font-mono text-[11px]">
                              {user.assignedDevices[0].deviceUuid.substring(0, 8)}...
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">Unpaired</span>
                        )}
                      </td>

                      {/* Actions Column: View, Edit, Delete, Reset Password */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Icon */}
                          <Link
                            href={`/${slug}/users/${user.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Full Profile & Custom Fields"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Edit Icon */}
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Member Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Reset Password Icon */}
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalUser(user);
                              setResetPasswordValue("Password@123");
                              setShowResetPassword(false);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Reset Portal Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Delete Icon */}
                          <button
                            type="button"
                            onClick={() => setDeletingUser(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-colors"
                            title="Delete Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                      No members match the selected classification and search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Pagination */}
          <TablePagination
            currentPage={page}
            totalPages={Math.ceil(totalUsers / limit) || 1}
            totalItems={totalUsers}
            limit={limit}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        </div>
      </main>

      {/* Dynamic Create / Edit User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={isEditing ? `Edit Member: ${formData.fullName}` : "Add New Member with Dynamic Profile Fields"}
        description={
          isEditing
            ? "Update credentials, classification, and dynamic custom profile fields"
            : "Mandatory account credentials + password for portal access + extensible custom fields"
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          {/* Classification & Role Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                User Classification *
              </label>
              <select
                value={formData.userTypeId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    userTypeId: e.target.value,
                    profileData: isEditing ? prev.profileData : {},
                  }))
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
              >
                {userTypes.map((ut) => (
                  <option key={ut.id} value={ut.id}>
                    {ut.name} {!ut.isSystem ? "(Custom)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Assigned RBAC Role
              </label>
              <select
                value={formData.roleId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, roleId: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Auto-assign based on User Type</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Account Credentials */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
              Account Credentials (Portal Access)
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Jordan Smith"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Institutional Email Address *
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="jordan@school.edu"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Phone Number
                  </label>
                  <Input
                    placeholder="+1-555-0199"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Password Field with Eye Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {isEditing ? "Update Password (Optional)" : "Login Password *"}
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-500 font-medium flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Strong Password</span>
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required={!isEditing}
                    placeholder={isEditing ? "Leave blank to keep existing password" : "Enter login password (min 6 chars)"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="pr-10"
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
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {!isEditing && (
                    <>Default set to <code className="text-teal-700 dark:text-teal-300 font-mono font-bold">Password@123</code>. The member can use their email and password to log in.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Custom Fields Section */}
          {selectedUserType && selectedUserType.customFields.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase text-teal-700 dark:text-teal-400 mb-2 flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" />
                <span>Dynamic Profile Fields ({selectedUserType.name})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {selectedUserType.customFields.map((field) => {
                  const val = formData.profileData[field.fieldKey] || "";

                  return (
                    <div key={field.id}>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        {field.label} {field.isRequired && "*"}
                      </label>

                      {field.fieldType === "DROPDOWN" && field.options ? (
                        <select
                          value={val}
                          required={field.isRequired}
                          onChange={(e) =>
                            handleCustomFieldChange(field.fieldKey, e.target.value)
                          }
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">Select option...</option>
                          {field.options.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.fieldType === "DATE" ? (
                        <Input
                          type="date"
                          required={field.isRequired}
                          value={val}
                          onChange={(e) =>
                            handleCustomFieldChange(field.fieldKey, e.target.value)
                          }
                        />
                      ) : field.fieldType === "NUMBER" ? (
                        <Input
                          type="number"
                          required={field.isRequired}
                          placeholder={field.placeholder || "0"}
                          value={val}
                          onChange={(e) =>
                            handleCustomFieldChange(field.fieldKey, e.target.value)
                          }
                        />
                      ) : (
                        <Input
                          type="text"
                          required={field.isRequired}
                          placeholder={field.placeholder || `Enter ${field.label}`}
                          value={val}
                          onChange={(e) =>
                            handleCustomFieldChange(field.fieldKey, e.target.value)
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUserModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formSubmitting}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
            >
              {formSubmitting ? (isEditing ? "Saving..." : "Creating...") : isEditing ? "Update Member" : "Save Member"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dynamic Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        title="Confirm Member Deletion"
        description="This action cannot be undone and will remove the member account"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                Delete &quot;{deletingUser?.fullName}&quot;?
              </p>
              <p className="mt-1 text-slate-700 dark:text-slate-300">
                Account <strong className="text-slate-900 dark:text-white">{deletingUser?.email}</strong> and its associated batch enrollments will be deleted immediately.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingUser(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              {isDeleting ? "Deleting..." : "Confirm & Delete Member"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal with Eye Toggle */}
      <Modal
        isOpen={Boolean(resetModalUser)}
        onClose={() => setResetModalUser(null)}
        title={`Reset Password for ${resetModalUser?.fullName}`}
        description="Set a new portal login password for this institutional member"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Member Email
            </label>
            <Input
              disabled
              value={resetModalUser?.email || ""}
              className="opacity-70 bg-slate-100 dark:bg-slate-950"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                New Password *
              </label>
              <button
                type="button"
                onClick={() => {
                  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
                  let gen = "";
                  for (let i = 0; i < 10; i++) gen += chars.charAt(Math.floor(Math.random() * chars.length));
                  setResetPasswordValue(gen);
                  setShowResetPassword(true);
                }}
                className="text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-500 font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate Strong</span>
              </button>
            </div>
            <div className="relative">
              <Input
                type={showResetPassword ? "text" : "password"}
                required
                placeholder="Enter new password (min 6 chars)"
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowResetPassword(!showResetPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={showResetPassword ? "Hide password" : "Show password"}
              >
                {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Minimum 6 characters. The member can use this new password immediately to log in.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetModalUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={resetSubmitting}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
            >
              {resetSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
