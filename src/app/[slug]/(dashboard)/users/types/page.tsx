"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Settings2,
  Users,
  GraduationCap,
  Activity,
  HeartPulse,
  Stethoscope,
  BookOpen,
  Award,
  Layers,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/sonner";

interface UserTypeItem {
  id: string;
  name: string;
  slug: string;
  iconName: string | null;
  isSystem: boolean;
  createdAt: string;
  _count: {
    users: number;
    customFields: number;
  };
}

export default function UserTypesManagementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [userTypes, setUserTypes] = useState<UserTypeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<UserTypeItem | null>(null);
  const [deletingType, setDeletingType] = useState<UserTypeItem | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formIcon, setFormIcon] = useState("User");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTypes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/${slug}/user-types`);
      const data = await res.json();
      if (data.userTypes) {
        setUserTypes(data.userTypes);
      }
    } catch {
      toast.error("Failed to load user types.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [slug]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/${slug}/user-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          slug: formSlug || formName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          iconName: formIcon,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create user type.");
        return;
      }

      toast.success(`User type "${data.userType.name}" created successfully!`);
      setIsCreateModalOpen(false);
      setFormName("");
      setFormSlug("");
      fetchTypes();
    } catch {
      toast.error("Network error while creating user type.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/${slug}/user-types`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingType.id,
          name: formName,
          iconName: formIcon,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update user type.");
        return;
      }

      toast.success(`User type "${data.userType.name}" updated!`);
      setEditingType(null);
      fetchTypes();
    } catch {
      toast.error("Network error while updating user type.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingType) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/${slug}/user-types?id=${deletingType.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete user type.");
        return;
      }

      toast.success(data.message || `User type "${deletingType.name}" deleted.`);
      setDeletingType(null);
      fetchTypes();
    } catch {
      toast.error("Network error while deleting user type.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (iconName: string | null) => {
    switch (iconName) {
      case "GraduationCap":
        return <GraduationCap className="w-4 h-4 text-teal-400" />;
      case "Activity":
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case "HeartPulse":
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case "Stethoscope":
        return <Stethoscope className="w-4 h-4 text-cyan-400" />;
      case "BookOpen":
        return <BookOpen className="w-4 h-4 text-amber-400" />;
      case "Award":
        return <Award className="w-4 h-4 text-indigo-400" />;
      default:
        return <Users className="w-4 h-4 text-teal-400" />;
    }
  };

  const systemCount = userTypes.filter((u) => u.isSystem).length;
  const customCount = userTypes.filter((u) => !u.isSystem).length;
  const totalFields = userTypes.reduce((acc, u) => acc + (u._count?.customFields || 0), 0);

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title="User Types & Classifications"
        subtitle="Manage dynamic member types (Students, Staff, Clinicians, Trainers) and their custom schemas"
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Institutional User Classifications
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Each user type can have its own customized registration schema and profile attributes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${slug}/users/fields`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Configure Custom Fields</span>
            </Link>

            <Button
              onClick={() => {
                setFormName("");
                setFormSlug("");
                setFormIcon("User");
                setIsCreateModalOpen(true);
              }}
              className="gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create User Type</span>
            </Button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Total User Types
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {userTypes.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active classifications</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Core System Types
            </span>
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
              {systemCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Platform defaults</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Custom Organization Types
            </span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {customCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Custom created</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Total Dynamic Fields
            </span>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
              {totalFields}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all schemas</p>
          </div>
        </div>

        {/* User Types Table */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                All User Classifications ({userTypes.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage roles, symbols, and schema definitions
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 w-16">#</th>
                  <th className="py-3.5 px-6">Classification Name</th>
                  <th className="py-3.5 px-6">System Slug</th>
                  <th className="py-3.5 px-6">Members Enrolled</th>
                  <th className="py-3.5 px-6">Custom Fields</th>
                  <th className="py-3.5 px-6">Classification Type</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                      Loading user types...
                    </td>
                  </tr>
                ) : userTypes.length > 0 ? (
                  userTypes.map((ut, idx) => (
                    <tr
                      key={ut.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* # Indexing */}
                      <td className="py-4 px-6 text-xs text-slate-400 dark:text-slate-500 font-mono">
                        #{idx + 1}
                      </td>

                      {/* Name & Icon */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            {getIcon(ut.iconName)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {ut.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-4 px-6 text-xs font-mono text-teal-700 dark:text-teal-400">
                        /{ut.slug}
                      </td>

                      {/* Members Enrolled */}
                      <td className="py-4 px-6 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {ut._count?.users || 0} Members
                      </td>

                      {/* Custom Fields */}
                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-mono text-teal-700 dark:text-teal-300 font-bold mr-1">
                          {ut._count?.customFields || 0}
                        </span>
                        field(s)
                      </td>

                      {/* System vs Custom */}
                      <td className="py-4 px-6">
                        {ut.isSystem ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Core System
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            Custom Org Type
                          </span>
                        )}
                      </td>

                      {/* Actions: View Fields, Edit, Delete */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/${slug}/users/fields`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Schema Fields"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingType(ut);
                              setFormName(ut.name);
                              setFormIcon(ut.iconName || "User");
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Type"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {!ut.isSystem ? (
                            <button
                              type="button"
                              onClick={() => setDeletingType(ut)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-colors"
                              title="Delete Type"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span
                              className="p-1.5 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                              title="Core system type cannot be deleted"
                            >
                              <Trash2 className="w-4 h-4 opacity-30" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                      No user classifications found. Click &quot;Create User Type&quot; to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User Type"
        description="Add a new member classification for this organization"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              User Type Name *
            </label>
            <Input
              required
              placeholder="e.g. Sports Doctor, Nutritionist, Volunteer"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                if (!formSlug) {
                  setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                System Identifier Slug
              </label>
              <Input
                placeholder="e.g. sports-doctor"
                value={formSlug}
                onChange={(e) =>
                  setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Assigned Icon
              </label>
              <select
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
              >
                <option value="User">User Profile</option>
                <option value="HeartPulse">Heart Pulse (Clinical)</option>
                <option value="Stethoscope">Stethoscope (Doctor)</option>
                <option value="Activity">Activity (Fitness)</option>
                <option value="Award">Award (Coach/Trainer)</option>
                <option value="GraduationCap">Graduation Cap (Student)</option>
                <option value="BookOpen">Book Open (Teacher)</option>
                <option value="Users">Users (Parent/Community)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
            >
              {isSubmitting ? "Creating..." : "Create User Type"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={Boolean(editingType)}
        onClose={() => setEditingType(null)}
        title={`Edit User Type "${editingType?.name}"`}
        description="Update display name and iconography"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              User Type Name *
            </label>
            <Input
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Assigned Icon
            </label>
            <select
              value={formIcon}
              onChange={(e) => setFormIcon(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
            >
              <option value="User">User Profile</option>
              <option value="HeartPulse">Heart Pulse (Clinical)</option>
              <option value="Stethoscope">Stethoscope (Doctor)</option>
              <option value="Activity">Activity (Fitness)</option>
              <option value="Award">Award (Coach/Trainer)</option>
              <option value="GraduationCap">Graduation Cap (Student)</option>
              <option value="BookOpen">Book Open (Teacher)</option>
              <option value="Users">Users (Parent/Community)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingType(null)}
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
        isOpen={Boolean(deletingType)}
        onClose={() => setDeletingType(null)}
        title="Confirm User Type Deletion"
        description="This will permanently delete this classification and its custom fields"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                Delete &quot;{deletingType?.name}&quot;?
              </p>
              <p className="mt-1 text-slate-700 dark:text-slate-300">
                This will remove the classification and all ({deletingType?._count?.customFields || 0}) dynamic schema fields configured for it.
              </p>
              {deletingType && deletingType._count?.users > 0 && (
                <p className="mt-2 text-rose-600 dark:text-rose-400 font-bold">
                  Warning: {deletingType._count.users} active member(s) are assigned to this type. You must reassign those members before deleting.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingType(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isSubmitting || (deletingType ? deletingType._count?.users > 0 : false)}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              {isSubmitting ? "Deleting..." : "Confirm & Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
