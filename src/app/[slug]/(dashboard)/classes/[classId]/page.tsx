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
  ArrowLeft,
  ArrowRight,
  Search,
  Layers,
  HeartPulse,
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
    phone: string | null;
    profileData: any;
    assignedDevices: { deviceUuid: string }[];
    healthRecords: { metricType: string; numericValue: number; unit: string }[];
    evaluations: { status: string; task: { name: string } }[];
  };
}

interface BatchItem {
  id: string;
  name: string;
  capacity: number;
  schedule: string | null;
  instructors: { user: { id: string; fullName: string; email: string }; role: string | null }[];
  enrollments: EnrollmentItem[];
  tasks: { task: { id: string; name: string; metricType: string } }[];
}

interface ClassDetail {
  id: string;
  name: string;
  academicPeriod: string;
  description: string | null;
  isActive: boolean;
  batches: BatchItem[];
  tasks: { task: { id: string; name: string } }[];
}

export default function ClassFullDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>;
}) {
  const { slug, classId } = use(params);

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [allStudents, setAllStudents] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [allCoaches, setAllCoaches] = useState<{ id: string; fullName: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("all");
  const [searchStudent, setSearchStudent] = useState("");

  // Modals
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [targetBatchId, setTargetBatchId] = useState("");

  const [batchForm, setBatchForm] = useState({
    name: "",
    capacity: 30,
    schedule: "Mon, Wed, Fri 08:00 - 09:30",
    instructorId: "",
  });

  const [enrollForm, setEnrollForm] = useState({
    studentId: "",
    rollNumber: "",
  });

  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const fetchClassDetails = async () => {
    setIsLoading(true);
    try {
      const [cRes, uRes] = await Promise.all([
        fetch(`/api/${slug}/classes/${classId}`),
        fetch(`/api/${slug}/users`),
      ]);

      const cData = await cRes.json();
      const uData = await uRes.json();

      if (cData.class) setClassData(cData.class);
      if (uData.users) {
        setAllStudents(uData.users.filter((u: any) => u.userType?.slug === "student"));
        setAllCoaches(uData.users.filter((u: any) => u.userType?.slug === "coach"));
      }
    } catch (err) {
      console.error("Failed to load class details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassDetails();
  }, [slug, classId]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    try {
      const res = await fetch(`/api/${slug}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CREATE_BATCH",
          classId,
          ...batchForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalSuccess("Batch created successfully in this class!");
      setTimeout(() => {
        setIsBatchModalOpen(false);
        setModalSuccess("");
        setBatchForm({
          name: "",
          capacity: 30,
          schedule: "Mon, Wed, Fri 08:00 - 09:30",
          instructorId: "",
        });
        fetchClassDetails();
      }, 900);
    } catch (err: any) {
      setModalError(err.message);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    try {
      const res = await fetch(`/api/${slug}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ENROLL_STUDENT",
          batchId: targetBatchId,
          studentId: enrollForm.studentId,
          rollNumber: enrollForm.rollNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalSuccess("Student enrolled successfully!");
      setTimeout(() => {
        setIsEnrollModalOpen(false);
        setModalSuccess("");
        setEnrollForm({ studentId: "", rollNumber: "" });
        fetchClassDetails();
      }, 900);
    } catch (err: any) {
      setModalError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <TenantHeader
          title="Loading Class Details..."
          subtitle="Fetching class roster, connected batches, and student groups"
          tenantSlug={slug}
        />
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full flex items-center justify-center">
          <div className="glass-card rounded-2xl p-12 text-center text-slate-400">
            Loading class structure and roster...
          </div>
        </main>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex-1 flex flex-col">
        <TenantHeader
          title="Class Not Found"
          subtitle="The requested class could not be found"
          tenantSlug={slug}
        />
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <div className="glass-card rounded-2xl p-8 text-center text-slate-300">
            <p className="mb-4">Class record not found in this institution.</p>
            <Link
              href={`/${slug}/classes`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Classes Overview</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const totalEnrolled = classData.batches.reduce(
    (acc, b) => acc + b.enrollments.length,
    0
  );
  const totalCapacity = classData.batches.reduce((acc, b) => acc + b.capacity, 0);
  const overallOccupancy =
    totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  // Flatten all students across batches for the class directory
  const allEnrolledStudents: {
    enrollmentId: string;
    rollNumber: string | null;
    batchId: string;
    batchName: string;
    student: EnrollmentItem["student"];
  }[] = [];

  classData.batches.forEach((b) => {
    b.enrollments.forEach((e) => {
      allEnrolledStudents.push({
        enrollmentId: e.id,
        rollNumber: e.rollNumber,
        batchId: b.id,
        batchName: b.name,
        student: e.student,
      });
    });
  });

  const filteredStudents = allEnrolledStudents.filter((item) => {
    const matchesBatch =
      selectedBatchFilter === "all" || item.batchId === selectedBatchFilter;
    const matchesSearch =
      item.student.fullName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      item.student.email.toLowerCase().includes(searchStudent.toLowerCase()) ||
      (item.rollNumber && item.rollNumber.toLowerCase().includes(searchStudent.toLowerCase()));

    return matchesBatch && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title={`${classData.name} — Full Details`}
        subtitle={`Academic Period: ${classData.academicPeriod} • Comprehensive batch structure and student cohort directory`}
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Navigation Breadcrumb & Back Link */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link
              href={`/${slug}/classes`}
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Classes & Batches</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold">{classData.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsBatchModalOpen(true)}
              className="gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Batch</span>
            </Button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Connected Batches
              </span>
              <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{classData.batches.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active class subdivisions</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Enrolled Students
              </span>
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalEnrolled}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Across all {classData.batches.length} batches
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Capacity Occupancy
              </span>
              <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {overallOccupancy}%
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-2">
                ({totalEnrolled} / {totalCapacity})
              </span>
            </p>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2">
              <div
                style={{ width: `${Math.min(100, overallOccupancy)}%` }}
                className="h-full bg-teal-500 rounded-full"
              />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Health Tasks
              </span>
              <HeartPulse className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {classData.batches.reduce((acc, b) => acc + b.tasks.length, 0)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Assigned benchmark metrics</p>
          </div>
        </div>

        {/* Section 1: Connected Batches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Batches in {classData.name} ({classData.batches.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Independent cohorts with dedicated schedules, coaches, and student groups
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classData.batches.length > 0 ? (
              classData.batches.map((batch) => {
                const capacityPct = Math.round(
                  (batch.enrollments.length / batch.capacity) * 100
                );
                const primaryCoach = batch.instructors[0]?.user;

                return (
                  <div
                    key={batch.id}
                    className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm dark:shadow-xl hover:border-teal-500/40 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                            {batch.name}
                          </h4>
                          <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                            {classData.name} Cohort
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                          Active
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 mb-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>
                            Coach:{" "}
                            <strong className="text-slate-800 dark:text-slate-200">
                              {primaryCoach?.fullName || "Unassigned"}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{batch.schedule || "Flexible Schedule"}</span>
                        </div>
                      </div>

                      {/* Capacity Meter */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            Enrollment Capacity
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

                      {/* Student Preview */}
                      <div className="space-y-1.5 mb-5">
                        <p className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                          Roster Preview ({batch.enrollments.length}):
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
                          {batch.enrollments.length === 0 && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                              No students enrolled yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <Link
                        href={`/${slug}/classes/${classId}/batches/${batch.id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors shadow-sm"
                      >
                        <span>View Batch Full Details & Groups</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTargetBatchId(batch.id);
                          setIsEnrollModalOpen(true);
                        }}
                        className="w-full text-xs font-semibold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                        <span>Enroll Student to {batch.name}</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 glass-card rounded-2xl p-12 text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                No batches created yet in this class. Click &quot;Add New Batch&quot; to configure one.
              </div>
            )}
          </div>
        </div>

        {/* Section 2: All Enrolled Students Table in Class */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Class Student Directory ({filteredStudents.length} Students)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All students currently enrolled across batches within {classData.name}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedBatchFilter}
                onChange={(e) => setSelectedBatchFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Batches</option>
                {classData.batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="Search students..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="pl-8 h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Student Name</th>
                  <th className="py-3.5 px-6">Roll Number</th>
                  <th className="py-3.5 px-6">Assigned Batch</th>
                  <th className="py-3.5 px-6">Institutional Email</th>
                  <th className="py-3.5 px-6">Smart Band</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((item) => (
                    <tr
                      key={item.enrollmentId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-300 font-bold text-xs flex items-center justify-center">
                            {item.student.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{item.student.fullName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs font-mono text-teal-700 dark:text-teal-400">
                        {item.rollNumber || "—"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {item.batchName}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300">
                        {item.student.email}
                      </td>
                      <td className="py-4 px-6">
                        {item.student.assignedDevices &&
                        item.student.assignedDevices.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <Watch className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-mono text-[11px]">
                              {item.student.assignedDevices[0].deviceUuid.substring(0, 8)}...
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">Unpaired</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/${slug}/classes/${classId}/batches/${item.batchId}`}
                          className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold"
                        >
                          View in Batch →
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                      No students match the current filter or search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create Batch Modal */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title={`Add Batch to ${classData.name}`}
        description="Configure a new cohort subdivision with schedule and capacity"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{modalError}</span>
            </div>
          )}
          {modalSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{modalSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Batch Name *
            </label>
            <Input
              required
              placeholder="e.g. Batch A, Morning Athletics, Track & Field"
              value={batchForm.name}
              onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Student Capacity *
              </label>
              <Input
                type="number"
                required
                min={1}
                max={200}
                value={batchForm.capacity}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, capacity: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Primary Coach
              </label>
              <select
                value={batchForm.instructorId}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, instructorId: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Unassigned</option>
                {allCoaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Training Schedule
            </label>
            <Input
              placeholder="e.g. Mon, Wed, Fri 08:00 - 09:30"
              value={batchForm.schedule}
              onChange={(e) =>
                setBatchForm({ ...batchForm, schedule: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBatchModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
            >
              Create Batch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Enroll Student Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Enroll Student into Batch"
        description="Select a registered student and assign roll number"
      >
        <form onSubmit={handleEnrollStudent} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{modalError}</span>
            </div>
          )}
          {modalSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{modalSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Select Student *
            </label>
            <select
              required
              value={enrollForm.studentId}
              onChange={(e) =>
                setEnrollForm({ ...enrollForm, studentId: e.target.value })
              }
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select student...</option>
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Roll Number / Student Code
            </label>
            <Input
              placeholder="e.g. ROLL-101"
              value={enrollForm.rollNumber}
              onChange={(e) =>
                setEnrollForm({ ...enrollForm, rollNumber: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEnrollModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
            >
              Enroll Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
