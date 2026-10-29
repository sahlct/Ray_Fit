"use client";

import React, { useState, useEffect, use } from "react";
import {
  Settings2,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  UserCheck,
  ShieldAlert,
  Users,
  Activity,
  HeartPulse,
  Stethoscope,
  GraduationCap,
  BookOpen,
  Award,
  Layers,
} from "lucide-react";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/sonner";

interface CustomFieldItem {
  id: string;
  label: string;
  fieldKey: string;
  fieldType: string;
  isRequired: boolean;
  placeholder: string | null;
  options: any;
  displayOrder: number;
}

interface UserTypeConfig {
  id: string;
  name: string;
  slug: string;
  iconName: string | null;
  isSystem: boolean;
  customFields: CustomFieldItem[];
  _count?: { users: number; customFields: number };
}

export default function CustomFieldBuilderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [userTypes, setUserTypes] = useState<UserTypeConfig[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Field Modal State
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [fieldData, setFieldData] = useState({
    label: "",
    fieldKey: "",
    fieldType: "TEXT",
    isRequired: false,
    placeholder: "",
    optionsInput: "",
  });

  // User Type Modals State
  const [isNewTypeModalOpen, setIsNewTypeModalOpen] = useState(false);
  const [isManageTypesModalOpen, setIsManageTypesModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeSlug, setNewTypeSlug] = useState("");
  const [newTypeIcon, setNewTypeIcon] = useState("User");
  const [typeModalError, setTypeModalError] = useState("");
  const [typeModalSuccess, setTypeModalSuccess] = useState("");
  const [deleteFieldCandidate, setDeleteFieldCandidate] = useState<{ id: string; label: string } | null>(null);
  const [deleteTypeCandidate, setDeleteTypeCandidate] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFieldConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/${slug}/users/fields`);
      if (res.status === 403) {
        window.location.href = `/${slug}/dashboard`;
        return;
      }
      const data = await res.json();
      if (data.userTypes) {
        setUserTypes(data.userTypes);
        if (!selectedTypeId && data.userTypes.length > 0) {
          setSelectedTypeId(data.userTypes[0].id);
        } else if (selectedTypeId && !data.userTypes.some((u: any) => u.id === selectedTypeId) && data.userTypes.length > 0) {
          setSelectedTypeId(data.userTypes[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load custom fields:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFieldConfig();
  }, [slug]);

  const activeUserType = userTypes.find((ut) => ut.id === selectedTypeId);

  const handleLabelChange = (label: string) => {
    const autoKey = label.toLowerCase().replace(/[^a-z0-9]/g, "_");
    setFieldData((prev) => ({
      ...prev,
      label,
      fieldKey: autoKey,
    }));
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      let parsedOptions = null;
      if (
        (fieldData.fieldType === "DROPDOWN" ||
          fieldData.fieldType === "MULTI_SELECT") &&
        fieldData.optionsInput
      ) {
        parsedOptions = fieldData.optionsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const res = await fetch(`/api/${slug}/users/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userTypeId: selectedTypeId,
          label: fieldData.label,
          fieldKey: fieldData.fieldKey,
          fieldType: fieldData.fieldType,
          isRequired: fieldData.isRequired,
          placeholder: fieldData.placeholder,
          options: parsedOptions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to add custom field.");
        return;
      }

      setFormSuccess("Custom field registered successfully!");
      setTimeout(() => {
        setIsFieldModalOpen(false);
        setFormSuccess("");
        setFieldData({
          label: "",
          fieldKey: "",
          fieldType: "TEXT",
          isRequired: false,
          placeholder: "",
          optionsInput: "",
        });
        fetchFieldConfig();
      }, 900);
    } catch {
      setFormError("Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteField = async () => {
    if (!deleteFieldCandidate) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/${slug}/users/fields?id=${deleteFieldCandidate.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete field.");
        return;
      }
      toast.success(`Custom field "${deleteFieldCandidate.label}" deleted.`);
      setDeleteFieldCandidate(null);
      fetchFieldConfig();
    } catch {
      toast.error("Network error deleting field.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateUserType = async (e: React.FormEvent) => {
    e.preventDefault();
    setTypeModalError("");
    setTypeModalSuccess("");

    try {
      const res = await fetch(`/api/${slug}/user-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTypeName,
          slug: newTypeSlug || newTypeName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          iconName: newTypeIcon,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTypeModalError(data.error || "Failed to create user type.");
        toast.error(data.error || "Failed to create user type.");
        return;
      }

      toast.success(`User type "${data.userType.name}" created!`);
      setIsNewTypeModalOpen(false);
      setNewTypeName("");
      setNewTypeSlug("");
      fetchFieldConfig();
      setSelectedTypeId(data.userType.id);
    } catch {
      setTypeModalError("Network error while creating user type.");
      toast.error("Network error while creating user type.");
    }
  };

  const confirmDeleteUserType = async () => {
    if (!deleteTypeCandidate) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/${slug}/user-types?id=${deleteTypeCandidate.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete user type.");
        return;
      }
      toast.success(`User type "${deleteTypeCandidate.name}" deleted.`);
      setDeleteTypeCandidate(null);
      fetchFieldConfig();
    } catch {
      toast.error("Network error while deleting user type.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title="Dynamic Custom Field & User Type Builder"
        subtitle="Manage user types (Students, Staff, Clinicians) and configure extensible JSONB profile schemas"
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Info Banner */}
        {/* <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 shrink-0 text-teal-400" />
            <div>
              <span className="font-bold text-white">Extensible Dynamic Schema Architecture:</span>{" "}
              Add unlimited custom user types and profile fields. Data is saved in structured JSONB with zero database migration downtime.
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-teal-700 text-white">
            EAV-JSONB Hybrid
          </span>
        </div> */}

        {/* User Type Selector & Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-wrap">
              {userTypes.map((ut) => (
                <button
                  key={ut.id}
                  onClick={() => setSelectedTypeId(ut.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${selectedTypeId === ut.id
                    ? "bg-teal-600 text-white shadow-sm font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  <span>{ut.name}</span>
                  {!ut.isSystem && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Custom Type" />
                  )}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsManageTypesModalOpen(true)}
              className="gap-1.5 text-xs font-semibold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Manage Types</span>
            </Button>
          </div>

          <Button
            onClick={() => setIsFieldModalOpen(true)}
            className="gap-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Field to {activeUserType?.name || "Type"}</span>
          </Button>
        </div>

        {/* Existing Custom Fields Table */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Active Schema Fields for {activeUserType?.name}</span>
                  {activeUserType?.isSystem ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      Core System Type
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      Custom Organization Type
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  These dynamic fields render when creating or editing {activeUserType?.name} members
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">
                {activeUserType?.customFields.length || 0} Fields Configured
              </Badge>
              {activeUserType && !activeUserType.isSystem && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteTypeCandidate({ id: activeUserType.id, name: activeUserType.name })}
                  className="gap-1.5 text-xs font-semibold border-rose-500/40 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-700 dark:hover:text-rose-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete This Type</span>
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Order</th>
                  <th className="py-3.5 px-6">Field Label</th>
                  <th className="py-3.5 px-6">Database Key</th>
                  <th className="py-3.5 px-6">Data Type</th>
                  <th className="py-3.5 px-6">Validation / Options</th>
                  <th className="py-3.5 px-6">Requirement</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                      Loading schema fields...
                    </td>
                  </tr>
                ) : activeUserType && activeUserType.customFields.length > 0 ? (
                  activeUserType.customFields.map((f, idx) => (
                    <tr
                      key={f.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-6 text-xs text-slate-400 dark:text-slate-500 font-mono">
                        #{f.displayOrder || idx + 1}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {f.label}
                      </td>
                      <td className="py-4 px-6 text-xs font-mono text-teal-700 dark:text-teal-400">
                        {f.fieldKey}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {f.fieldType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                        {f.options && Array.isArray(f.options) ? (
                          <span className="text-[11px] text-slate-700 dark:text-slate-300">
                            Options: {f.options.join(", ")}
                          </span>
                        ) : f.placeholder ? (
                          <span className="italic text-slate-500 dark:text-slate-400">Hint: &quot;{f.placeholder}&quot;</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {f.isRequired ? (
                          <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/30">
                            Required
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">Optional</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteFieldCandidate({ id: f.id, label: f.label })}
                          className="h-8 px-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15"
                          title="Delete Field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                      No custom fields added yet for this user type. Click &quot;Add Field&quot; to configure one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Field Modal */}
      <Modal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        title={`Add Custom Field to ${activeUserType?.name}`}
        description="Define a new profile attribute with type validation"
      >
        <form onSubmit={handleAddField} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}
          {formSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Field Label *
            </label>
            <Input
              required
              placeholder="e.g. Blood Group, Emergency Contact, Allergies"
              value={fieldData.label}
              onChange={(e) => handleLabelChange(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Database Unique Key *
              </label>
              <Input
                required
                placeholder="e.g. blood_group"
                value={fieldData.fieldKey}
                onChange={(e) =>
                  setFieldData((prev) => ({ ...prev, fieldKey: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Field Data Type *
              </label>
              <select
                value={fieldData.fieldType}
                onChange={(e) =>
                  setFieldData((prev) => ({ ...prev, fieldType: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
              >
                <option value="TEXT">Text String</option>
                <option value="NUMBER">Numeric Value</option>
                <option value="DATE">Calendar Date</option>
                <option value="DROPDOWN">Dropdown Menu</option>
                <option value="MULTI_SELECT">Multi-Select List</option>
                <option value="CHECKBOX">Boolean Checkbox</option>
                <option value="EMAIL">Email Address</option>
                <option value="PHONE">Phone Number</option>
                <option value="TEXTAREA">Multi-line Textarea</option>
              </select>
            </div>
          </div>

          {(fieldData.fieldType === "DROPDOWN" ||
            fieldData.fieldType === "MULTI_SELECT") && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Dropdown Options (Comma separated)
                </label>
                <Input
                  placeholder="e.g. A+, B+, AB+, O+, A-, B-, AB-, O-"
                  value={fieldData.optionsInput}
                  onChange={(e) =>
                    setFieldData((prev) => ({
                      ...prev,
                      optionsInput: e.target.value,
                    }))
                  }
                />
              </div>
            )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Input Placeholder Hint (Optional)
            </label>
            <Input
              placeholder="e.g. Enter blood group or medical notes..."
              value={fieldData.placeholder}
              onChange={(e) =>
                setFieldData((prev) => ({ ...prev, placeholder: e.target.value }))
              }
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isRequired"
              checked={fieldData.isRequired}
              onChange={(e) =>
                setFieldData((prev) => ({ ...prev, isRequired: e.target.checked }))
              }
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
            />
            <label htmlFor="isRequired" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Mandatory Field (Required on user creation)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFieldModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
            >
              {isSubmitting ? "Adding..." : "Add Custom Field"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create New User Type Modal */}
      <Modal
        isOpen={isNewTypeModalOpen}
        onClose={() => setIsNewTypeModalOpen(false)}
        title="Create New User Type"
        description="Add a new member classification (e.g. Doctor, Physical Trainer, Nutritionist, Volunteer)"
      >
        <form onSubmit={handleCreateUserType} className="space-y-4">
          {typeModalError && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{typeModalError}</span>
            </div>
          )}
          {typeModalSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{typeModalSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              User Type Name *
            </label>
            <Input
              required
              placeholder="e.g. Sports Doctor, Nutritionist, Trainer"
              value={newTypeName}
              onChange={(e) => {
                setNewTypeName(e.target.value);
                if (!newTypeSlug) {
                  setNewTypeSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
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
                value={newTypeSlug}
                onChange={(e) => setNewTypeSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Assigned Icon
              </label>
              <select
                value={newTypeIcon}
                onChange={(e) => setNewTypeIcon(e.target.value)}
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

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Once created, you can immediately define custom fields for this user type and register members under it.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewTypeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
            >
              Create User Type
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage User Types Modal */}
      <Modal
        isOpen={isManageTypesModalOpen}
        onClose={() => setIsManageTypesModalOpen(false)}
        title="Manage All User Types"
        description="Inspect registered user types, active members, and custom schema count"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {userTypes.map((ut) => (
              <div key={ut.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{ut.name}</span>
                    <span className="text-[10px] font-mono text-teal-700 dark:text-teal-400">/{ut.slug}</span>
                    {ut.isSystem ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                        System Core
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        Custom Type
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {ut.customFields.length} custom field(s) defined
                  </p>
                </div>

                <div>
                  {ut.isSystem ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">Protected</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDeleteTypeCandidate({ id: ut.id, name: ut.name });
                      }}
                      className="gap-1.5 text-xs text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              onClick={() => {
                setIsManageTypesModalOpen(false);
                setIsNewTypeModalOpen(true);
              }}
              className="gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Another User Type</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsManageTypesModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Field Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteFieldCandidate)}
        onClose={() => setDeleteFieldCandidate(null)}
        title="Delete Custom Profile Field"
        description="Permanently remove this custom attribute from the user type schema"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                Delete field &quot;{deleteFieldCandidate?.label}&quot;?
              </p>
              <p className="mt-1 text-slate-700 dark:text-slate-300">
                This field will be permanently removed from this user type schema. Any previously stored values inside user profile JSON payloads will remain archived.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteFieldCandidate(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteField}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              {isDeleting ? "Deleting..." : "Confirm & Delete Field"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete User Type Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTypeCandidate)}
        onClose={() => setDeleteTypeCandidate(null)}
        title="Delete User Classification Type"
        description="Permanently remove this member classification type from this tenant"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                Delete User Type &quot;{deleteTypeCandidate?.name}&quot;?
              </p>
              <p className="mt-1 text-slate-700 dark:text-slate-300">
                This will delete the user type classification and all its attached custom schema fields. Only user types with 0 active members can be safely removed.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTypeCandidate(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteUserType}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              {isDeleting ? "Deleting..." : "Confirm & Delete Type"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
