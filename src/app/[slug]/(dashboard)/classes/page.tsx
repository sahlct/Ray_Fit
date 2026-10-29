"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  Users,
  Activity,
  Calendar,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Watch,
  Building,
  ArrowRight,
} from "lucide-react";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

interface EnrollmentItem {
  id: string;
  rollNumber: string | null;
  student: {
    id: string;
    fullName: string;
    email: string;
    assignedDevices: { deviceUuid: string }[];
  };
}

interface BatchItem {
  id: string;
  name: string;
  capacity: number;
  schedule: string | null;
  instructors: { user: { id: string; fullName: string }; role: string | null }[];
  enrollments: EnrollmentItem[];
}

interface ClassItem {
  id: string;
  name: string;
  academicPeriod: string;
  description: string | null;
  batches: BatchItem[];
}

export default function ClassesBatchesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [allStudents, setAllStudents] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [allCoaches, setAllCoaches] = useState<{ id: string; fullName: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const [classForm, setClassForm] = useState({ name: "", academicPeriod: "2026-2027", description: "" });
  const [batchForm, setBatchForm] = useState({ name: "", capacity: 30, schedule: "Mon, Wed, Fri 08:00 - 09:30", instructorId: "" });
  const [enrollForm, setEnrollForm] = useState({ studentId: "", rollNumber: "" });

  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cRes, uRes] = await Promise.all([
        fetch(`/api/${slug}/classes`),
        fetch(`/api/${slug}/users`),
      ]);
      const cData = await cRes.json();
      const uData = await uRes.json();

      if (cData.classes) setClasses(cData.classes);
      if (uData.users) {
        setAllStudents(
          uData.users.filter((u: any) => u.userType?.slug === "student")
        );
        setAllCoaches(
          uData.users.filter((u: any) => u.userType?.slug === "coach")
        );
      }
    } catch (err) {
      console.error("Failed to load classes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  // Create Class Handler
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    try {
      const res = await fetch(`/api/${slug}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "CREATE_CLASS", ...classForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalSuccess("Class created successfully!");
      setTimeout(() => {
        setIsClassModalOpen(false);
        setModalSuccess("");
        setClassForm({ name: "", academicPeriod: "2026-2027", description: "" });
        loadData();
      }, 1000);
    } catch (err: any) {
      setModalError(err.message);
    }
  };

  // Create Batch Handler
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    try {
      const res = await fetch(`/api/${slug}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CREATE_BATCH",
          classId: selectedClassId,
          ...batchForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalSuccess("Batch created successfully!");
      setTimeout(() => {
        setIsBatchModalOpen(false);
        setModalSuccess("");
        loadData();
      }, 1000);
    } catch (err: any) {
      setModalError(err.message);
    }
  };

  // Enroll Student Handler
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    try {
      const res = await fetch(`/api/${slug}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ENROLL_STUDENT",
          batchId: selectedBatchId,
          ...enrollForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalSuccess("Student enrolled successfully!");
      setTimeout(() => {
        setIsEnrollModalOpen(false);
        setModalSuccess("");
        loadData();
      }, 1000);
    } catch (err: any) {
      setModalError(err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title="Classes, Batches & Student Enrollment"
        subtitle="Manage academic cohorts, batch capacities, coach assignments, and enrollments"
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Academic Hierarchy
            </h2>
            <p className="text-xs text-slate-500">
              Classes hold Batches; Batches group students and receive Health Tasks
            </p>
          </div>
          <Button
            onClick={() => setIsClassModalOpen(true)}
            className="gap-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Academic Class</span>
          </Button>
        </div>

        {/* Classes List */}
        <div className="space-y-8">
          {isLoading ? (
            <div className="glass-card rounded-2xl p-12 text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
              Loading classes and batch roster...
            </div>
          ) : classes.length > 0 ? (
            classes.map((c) => (
              <div
                key={c.id}
                className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                {/* Class Header */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {c.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Academic Period: {c.academicPeriod} • {c.batches.length} active batches
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${slug}/classes/${c.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <span>View Class Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedClassId(c.id);
                        setIsBatchModalOpen(true);
                      }}
                      className="gap-1.5 text-xs font-semibold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Batch</span>
                    </Button>
                  </div>
                </div>

                {/* Batches Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {c.batches.map((batch) => {
                    const capacityPct = Math.round(
                      (batch.enrollments.length / batch.capacity) * 100
                    );
                    const primaryCoach = batch.instructors[0]?.user;

                    return (
                      <div
                        key={batch.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-5 flex flex-col justify-between shadow-sm dark:shadow-lg"
                      >
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                              {batch.name}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              Active
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-4">
                            <div className="flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              <span>
                                Coach:{" "}
                                <strong className="text-slate-800 dark:text-slate-200">
                                  {primaryCoach?.fullName || "Unassigned"}
                                </strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate">{batch.schedule || "Flexible"}</span>
                            </div>
                          </div>

                          {/* Capacity Meter */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">
                                Enrolled Students
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {batch.enrollments.length} / {batch.capacity} ({capacityPct}%)
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                style={{ width: `${Math.min(100, capacityPct)}%` }}
                                className={`h-full ${
                                  capacityPct >= 90 ? "bg-rose-500" : "bg-teal-500"
                                }`}
                              />
                            </div>
                          </div>

                          {/* Student Pills */}
                          <div className="space-y-1.5 mb-4">
                            <p className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                              Roster Preview:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {batch.enrollments.slice(0, 4).map((en) => (
                                <span
                                  key={en.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                                >
                                  {en.student.assignedDevices.length > 0 && (
                                    <Watch className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                                  )}
                                  <span>{en.student.fullName}</span>
                                </span>
                              ))}
                              {batch.enrollments.length > 4 && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium self-center">
                                  +{batch.enrollments.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <Link
                            href={`/${slug}/classes/${c.id}/batches/${batch.id}`}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors shadow-sm"
                          >
                            <span>View Batch Details & Groups</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBatchId(batch.id);
                              setIsEnrollModalOpen(true);
                            }}
                            className="w-full gap-1.5 text-xs font-semibold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Enroll Student</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
              No classes created yet. Click &quot;New Academic Class&quot; to begin.
            </div>
          )}
        </div>
      </main>

      {/* Modal: Create Class */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title="Create New Academic Class"
        description="e.g. Grade 10, Grade 9 (holds individual athletic batches)"
      >
        <form onSubmit={handleCreateClass} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{modalError}</span>
            </div>
          )}
          {modalSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{modalSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Class Name *
            </label>
            <Input
              required
              placeholder="e.g. Grade 10"
              value={classForm.name}
              onChange={(e) =>
                setClassForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Academic Period / Year *
            </label>
            <Input
              required
              placeholder="e.g. 2026-2027"
              value={classForm.academicPeriod}
              onChange={(e) =>
                setClassForm((prev) => ({ ...prev, academicPeriod: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <Input
              placeholder="Cohort notes..."
              value={classForm.description}
              onChange={(e) =>
                setClassForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsClassModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
            >
              Save Class
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Batch */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Create Cohort Batch"
        description="Add a focused training batch to this class"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{modalError}</span>
            </div>
          )}
          {modalSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{modalSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Batch Name *
            </label>
            <Input
              required
              placeholder="e.g. Batch A - Morning Athletics"
              value={batchForm.name}
              onChange={(e) =>
                setBatchForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Student Capacity *
              </label>
              <Input
                type="number"
                required
                value={batchForm.capacity}
                onChange={(e) =>
                  setBatchForm((prev) => ({
                    ...prev,
                    capacity: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Head Coach
              </label>
              <select
                value={batchForm.instructorId}
                onChange={(e) =>
                  setBatchForm((prev) => ({
                    ...prev,
                    instructorId: e.target.value,
                  }))
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                <option value="">Select Coach...</option>
                {allCoaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Schedule / Time Window
            </label>
            <Input
              placeholder="e.g. Mon, Wed, Fri 08:00 - 09:30"
              value={batchForm.schedule}
              onChange={(e) =>
                setBatchForm((prev) => ({ ...prev, schedule: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBatchModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
            >
              Save Batch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Enroll Student */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Enroll Student in Batch"
        description="Controlled enrollment with duplicate prevention"
      >
        <form onSubmit={handleEnrollStudent} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{modalError}</span>
            </div>
          )}
          {modalSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{modalSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Student *
            </label>
            <select
              required
              value={enrollForm.studentId}
              onChange={(e) =>
                setEnrollForm((prev) => ({ ...prev, studentId: e.target.value }))
              }
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 text-sm font-medium"
            >
              <option value="">Choose Student from Directory...</option>
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Roll / Roster Number (Optional)
            </label>
            <Input
              placeholder="e.g. G10-042"
              value={enrollForm.rollNumber}
              onChange={(e) =>
                setEnrollForm((prev) => ({ ...prev, rollNumber: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEnrollModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
            >
              Enroll Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
