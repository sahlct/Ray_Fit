"use client";

import React, { useState, useEffect, use } from "react";
import {
  ShieldCheck,
  Plus,
  Lock,
  Users,
  CheckCircle2,
  AlertCircle,
  Key,
} from "lucide-react";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

interface RoleItem {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  _count: { users: number };
  permissions: {
    permission: { id: string; module: string; action: string; description: string | null };
  }[];
}

interface PermissionItem {
  id: string;
  module: string;
  action: string;
  description: string | null;
}

export default function RolesPermissionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());
  const [modalFeedback, setModalFeedback] = useState("");

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/${slug}/roles`);
      if (res.status === 403) {
        window.location.href = `/${slug}/dashboard`;
        return;
      }
      const data = await res.json();
      if (data.roles) setRoles(data.roles);
      if (data.availablePermissions) setAllPermissions(data.availablePermissions);
    } catch (err) {
      console.error("Failed to load roles:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, [slug]);

  const openEditPermissions = (role: RoleItem) => {
    setSelectedRole(role);
    const existing = new Set<string>();
    role.permissions.forEach((rp) => existing.add(rp.permission.id));
    setSelectedPermIds(existing);
    setModalFeedback("");
    setIsEditModalOpen(true);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      const res = await fetch(`/api/${slug}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PERMISSIONS",
          roleId: selectedRole.id,
          permissionIds: Array.from(selectedPermIds),
        }),
      });
      if (res.ok) {
        setModalFeedback("Permissions updated successfully!");
        setTimeout(() => {
          setIsEditModalOpen(false);
          loadRoles();
        }, 800);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/${slug}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ROLE",
          name: newRoleName,
          description: newRoleDesc,
          permissionIds: [],
        }),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewRoleName("");
        setNewRoleDesc("");
        loadRoles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group permissions by module
  const permissionsByModule = allPermissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, PermissionItem[]>);

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title="Dynamic Roles & Permissions"
        subtitle="Configure module and action-based capability authorization (VIEW, CREATE, EDIT, DELETE, ASSIGN, EXPORT)"
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Role Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assigned users automatically inherit granular capabilities
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Role</span>
          </Button>
        </div>

        {/* Roles List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-3 glass-card rounded-2xl p-12 text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
              Loading roles and capabilities...
            </div>
          ) : (
            roles.map((role) => (
              <div
                key={role.id}
                className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {role.name}
                      </h3>
                    </div>
                    {role.isSystem && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        System
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 min-h-[32px]">
                    {role.description || "Custom organization role"}
                  </p>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-4">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{role._count.users} Assigned Members</span>
                  </div>

                  <div className="mb-4">
                    <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-2">
                      Granted Capabilities ({role.permissions.length}):
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                      {role.permissions.slice(0, 10).map((rp) => (
                        <span
                          key={rp.permission.id}
                          className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-500/10 text-[10px] font-mono font-semibold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30"
                        >
                          {rp.permission.module}:{rp.permission.action}
                        </span>
                      ))}
                      {role.permissions.length > 10 && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 self-center">
                          +{role.permissions.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditPermissions(role)}
                  className="w-full text-xs font-semibold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                >
                  <Key className="w-3.5 h-3.5 mr-1.5" />
                  Configure Permissions
                </Button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Edit Permissions Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Configure Permissions for ${selectedRole?.name}`}
        description="Select granular actions allowed across application modules"
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {modalFeedback && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{modalFeedback}</span>
            </div>
          )}

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
              <div
                key={moduleName}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-3">
                  Module: {moduleName}
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {perms.map((p) => {
                    const isChecked = selectedPermIds.has(p.id);

                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? "bg-teal-50 dark:bg-teal-500/20 border-teal-500 font-semibold text-teal-900 dark:text-white"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(p.id)}
                          className="w-3.5 h-3.5 text-teal-500 rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:ring-teal-500"
                        />
                        <span>{p.action}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              className="bg-teal-600 hover:bg-teal-500 text-white font-semibold"
            >
              Save Permission Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Role Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Custom Role"
        description="e.g. Assistant Coach, Nurse, Nutritionist"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Role Name *
            </label>
            <Input
              required
              placeholder="e.g. Assistant Coach"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <Input
              placeholder="Responsibilities and access scope..."
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-500 text-white font-semibold"
            >
              Create Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
