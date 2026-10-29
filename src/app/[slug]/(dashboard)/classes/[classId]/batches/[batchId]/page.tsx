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
  Search,
  Layers,
  HeartPulse,
  Trash2,
  Shield,
  Phone,
  Mail,
  Zap,
  Target,
  Clock,
  Sparkles,
} from "lucide-react";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/sonner";

interface StudentEnrollmentItem {
  id: string;
  rollNumber: string | null;
  enrolledAt: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    profileData: any;
    assignedDevices: { id: string; deviceUuid: string; vendorName: string }[];
    healthRecords: { metricType: string; numericValue: number; unit: string; recordedAt: string }[];
    evaluations: { status: string; task: { name: string; metricType: string } }[];
  };
}

interface BatchDetail {
  id: string;
  name: string;
  capacity: number;
  schedule: string | null;
  isActive: boolean;
  class: {
    id: string;
    name: string;
    academicPeriod: string;
  };
  instructors: {
    user: {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
    };
  }[];
  enrollments: StudentEnrollmentItem[];
  tasks: {
    task: {
      id: string;
      name: string;
      metricType: string;
      benchmarks: { ruleExpression: any }[];
    };
  }[];
}

export default function BatchFullDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string; batchId: string }>;
}) {
  const { slug, classId, batchId } = use(params);

  const [batchData, setBatchData] = useState<BatchDetail | null>(null);
  const [allStudents, setAllStudents] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Group / Squad Filtering & Student Search
  const [activeSquad, setActiveSquad] = useState<string>("all");
  const [searchStudent, setSearchStudent] = useState("");
  // Local state for student squads assignments (e.g. Alpha, Beta, Gamma)
  const [studentSquads, setStudentSquads] = useState<Record<string, string>>({});

  // Modals
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ studentId: "", rollNumber: "" });
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [unenrollCandidate, setUnenrollCandidate] = useState<{ id: string; name: string } | null>(null);
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  const fetchBatchDetails = async () => {
    setIsLoading(true);
    try {
      const [bRes, uRes] = await Promise.all([
        fetch(`/api/${slug}/classes/${classId}/batches/${batchId}`),
        fetch(`/api/${slug}/users`),
      ]);

      const bData = await bRes.json();
      const uData = await uRes.json();

      if (bData.batch) {
        setBatchData(bData.batch);
        // Initialize default squads for students based on index or custom field
        const squads: Record<string, string> = {};
        bData.batch.enrollments.forEach((e: StudentEnrollmentItem, idx: number) => {
          const customSquad = e.student.profileData?.squad;
          if (customSquad) {
            squads[e.id] = customSquad;
          } else {
            // Distribute across squads: Alpha, Beta, Gamma
            const squadNames = ["Squad Alpha (Cardio)", "Squad Beta (Strength)", "Squad Gamma (Agility)"];
            squads[e.id] = squadNames[idx % 3];
          }
        });
        setStudentSquads(squads);
      }

      if (uData.users) {
        setAllStudents(uData.users.filter((u: any) => u.userType?.slug === "student"));
      }
    } catch (err) {
      console.error("Failed to load batch details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchDetails();
  }, [slug, classId, batchId]);

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
          batchId,
          studentId: enrollForm.studentId,
          rollNumber: enrollForm.rollNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Student enrolled into batch successfully!");
      setIsEnrollModalOpen(false);
      setEnrollForm({ studentId: "", rollNumber: "" });
      fetchBatchDetails();
    } catch (err: any) {
      setModalError(err.message);
      toast.error(err.message || "Failed to enroll student.");
    }
  };

  const handleConfirmUnenroll = async () => {
    if (!unenrollCandidate) return;
    setIsUnenrolling(true);

    try {
      const res = await fetch(
        `/api/${slug}/classes/${classId}/batches/${batchId}?enrollmentId=${unenrollCandidate.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Removed ${unenrollCandidate.name} from batch.`);
      setUnenrollCandidate(null);
      fetchBatchDetails();
    } catch (err: any) {
      toast.error(err.message || "Failed to unenroll student.");
    } finally {
      setIsUnenrolling(false);
    }
  };

  const handleSquadChange = (enrollmentId: string, newSquad: string) => {
    setStudentSquads((prev) => ({ ...prev, [enrollmentId]: newSquad }));
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <TenantHeader
          title="Loading Batch Details..."
          subtitle="Fetching student cohort, wearable bands, and tactical training squads"
          tenantSlug={slug}
        />
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full flex items-center justify-center">
          <div className="glass-card rounded-2xl p-12 text-center text-slate-400">
            Loading batch roster and groups...
          </div>
        </main>
      </div>
    );
  }

  if (!batchData) {
    return (
      <div className="flex-1 flex flex-col">
        <TenantHeader
          title="Batch Not Found"
          subtitle="The requested batch could not be found"
          tenantSlug={slug}
        />
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <div className="glass-card rounded-2xl p-8 text-center text-slate-300">
            <p className="mb-4">Batch record not found in this class.</p>
            <Link
              href={`/${slug}/classes/${classId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Class</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const capacityPct = Math.round((batchData.enrollments.length / batchData.capacity) * 100);
  const primaryCoach = batchData.instructors[0]?.user;
  const pairedBandsCount = batchData.enrollments.filter(
    (e) => e.student.assignedDevices && e.student.assignedDevices.length > 0
  ).length;

  // Filter students by squad and search query
  const filteredEnrollments = batchData.enrollments.filter((e) => {
    const assignedSquad = studentSquads[e.id] || "Squad Alpha (Cardio)";
    const matchesSquad = activeSquad === "all" || assignedSquad.startsWith(activeSquad);
    const matchesSearch =
      e.student.fullName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      e.student.email.toLowerCase().includes(searchStudent.toLowerCase()) ||
      (e.rollNumber && e.rollNumber.toLowerCase().includes(searchStudent.toLowerCase()));

    return matchesSquad && matchesSearch;
  });

  // Squad counts
  const squadAlphaCount = batchData.enrollments.filter((e) =>
    (studentSquads[e.id] || "").includes("Alpha")
  ).length;
  const squadBetaCount = batchData.enrollments.filter((e) =>
    (studentSquads[e.id] || "").includes("Beta")
  ).length;
  const squadGammaCount = batchData.enrollments.filter((e) =>
    (studentSquads[e.id] || "").includes("Gamma")
  ).length;

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title={`${batchData.name} — Batch Full Details`}
        subtitle={`${batchData.class.name} (${batchData.class.academicPeriod}) • Tactical Student Groups & Live Health Tracking`}
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Navigation Breadcrumb & Back Link */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link
              href={`/${slug}/classes`}
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              Classes
            </Link>
            <span>/</span>
            <Link
              href={`/${slug}/classes/${classId}`}
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium text-slate-700 dark:text-slate-300"
            >
              {batchData.class.name}
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold">{batchData.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${slug}/classes/${classId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {batchData.class.name}</span>
            </Link>

            <Button
              onClick={() => setIsEnrollModalOpen(true)}
              className="gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Student</span>
            </Button>
          </div>
        </div>

        {/* 4 Key Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Enrollment Capacity
              </span>
              <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {batchData.enrollments.length}{" "}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                / {batchData.capacity} ({capacityPct}%)
              </span>
            </p>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2">
              <div
                style={{ width: `${Math.min(100, capacityPct)}%` }}
                className={`h-full ${capacityPct >= 90 ? "bg-rose-500" : "bg-teal-500"}`}
              />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Primary Coach
              </span>
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {primaryCoach?.fullName || "Unassigned"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
              {primaryCoach?.email || "No coach assigned"}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Smart Bands Paired
              </span>
              <Watch className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {pairedBandsCount}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1.5">
                of {batchData.enrollments.length} synced
              </span>
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Live telemetry streaming</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Training Schedule
              </span>
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {batchData.schedule || "Flexible Time Slot"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Weekly cohort sessions</p>
          </div>
        </div>

        {/* Section 1: Tactical Student Groups / Squads Division */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Tactical Student Groups within {batchData.name}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Subdivide students into specialized training squads for differentiated fitness drills & benchmark tracking
              </p>
            </div>

            {/* Squad Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-wrap">
              <button
                onClick={() => setActiveSquad("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSquad === "all"
                    ? "bg-teal-600 text-white shadow font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All Roster ({batchData.enrollments.length})
              </button>
              <button
                onClick={() => setActiveSquad("Squad Alpha")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSquad === "Squad Alpha"
                    ? "bg-teal-600 text-white shadow font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Squad Alpha — Cardio ({squadAlphaCount})
              </button>
              <button
                onClick={() => setActiveSquad("Squad Beta")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSquad === "Squad Beta"
                    ? "bg-teal-600 text-white shadow font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Squad Beta — Strength ({squadBetaCount})
              </button>
              <button
                onClick={() => setActiveSquad("Squad Gamma")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSquad === "Squad Gamma"
                    ? "bg-teal-600 text-white shadow font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Squad Gamma — Agility ({squadGammaCount})
              </button>
            </div>
          </div>

          {/* Quick squad summary callout cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-teal-700 dark:text-teal-300">Squad Alpha (Cardio)</span>
                <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">{squadAlphaCount} Students</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Aerobic capacity, stamina, target HR zone 130-160 bpm
              </p>
            </div>

            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-indigo-700 dark:text-indigo-300">Squad Beta (Strength)</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{squadBetaCount} Students</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Core resistance, posture, muscular recovery & power
              </p>
            </div>

            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-cyan-700 dark:text-cyan-300">Squad Gamma (Agility)</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{squadGammaCount} Students</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Shuttle run, sprint interval, reaction speed & VO2 max
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Batch Student Roster */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-none">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Batch Student Roster ({filteredEnrollments.length} Students)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete member profiles, squad assignment, smart bands, and health metrics
              </p>
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Search by name, email, roll..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="pl-8 h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 w-14">#</th>
                  <th className="py-3.5 px-6">Student</th>
                  <th className="py-3.5 px-6">Roll Code</th>
                  <th className="py-3.5 px-6">Assigned Squad</th>
                  <th className="py-3.5 px-6">Smart Band</th>
                  <th className="py-3.5 px-6">Guardian / Profile</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEnrollments.length > 0 ? (
                  filteredEnrollments.map((e, idx) => {
                    const currentSquad = studentSquads[e.id] || "Squad Alpha (Cardio)";
                    const pData = e.student.profileData || {};

                    return (
                      <tr
                        key={e.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Indexing Column */}
                        <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                          #{idx + 1}
                        </td>

                        {/* Student Details */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center">
                              {e.student.fullName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">
                                {e.student.fullName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>{e.student.email}</span>
                                {e.student.phone && <span>• {e.student.phone}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Roll Code */}
                        <td className="py-4 px-6 text-xs font-mono text-teal-600 dark:text-teal-400 font-bold">
                          {e.rollNumber || "UNASSIGNED"}
                        </td>

                        {/* Squad Selector */}
                        <td className="py-4 px-6">
                          <select
                            value={currentSquad}
                            onChange={(ev) => handleSquadChange(e.id, ev.target.value)}
                            className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="Squad Alpha (Cardio)">Squad Alpha (Cardio)</option>
                            <option value="Squad Beta (Strength)">Squad Beta (Strength)</option>
                            <option value="Squad Gamma (Agility)">Squad Gamma (Agility)</option>
                          </select>
                        </td>

                        {/* Smart Band */}
                        <td className="py-4 px-6">
                          {e.student.assignedDevices && e.student.assignedDevices.length > 0 ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              <Watch className="w-4 h-4 text-emerald-500" />
                              <span className="font-mono text-[11px]">
                                {e.student.assignedDevices[0].deviceUuid.substring(0, 8)}...
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Unpaired</span>
                          )}
                        </td>

                        {/* Guardian / Profile Info */}
                        <td className="py-4 px-6">
                          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5 max-w-xs">
                            {pData.guardian_name && (
                              <p>
                                <span className="text-slate-500 dark:text-slate-400">Guardian:</span>{" "}
                                <strong className="text-slate-900 dark:text-white">{pData.guardian_name}</strong>
                              </p>
                            )}
                            {pData.emergency_phone && (
                              <p className="text-slate-500 dark:text-slate-400">
                                <span className="text-slate-400 dark:text-slate-500">Emergency:</span>{" "}
                                {pData.emergency_phone}
                              </p>
                            )}
                            {pData.date_of_birth && (
                              <p className="text-slate-500 dark:text-slate-400">
                                <span className="text-slate-400 dark:text-slate-500">DOB:</span> {pData.date_of_birth}
                              </p>
                            )}
                            {!pData.guardian_name && !pData.emergency_phone && !pData.date_of_birth && (
                              <span className="text-slate-400 italic">No extra custom fields</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setUnenrollCandidate({ id: e.id, name: e.student.fullName })}
                            className="h-8 px-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15"
                            title="Remove student from batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      No students found in this squad or search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Connected Health Tasks */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Assigned Health Tasks & Benchmarks
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Standardized physiological metrics monitored for all students in this batch
              </p>
            </div>

            <Link
              href={`/${slug}/tasks`}
              className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-500 font-semibold"
            >
              Configure Tasks & Rules →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batchData.tasks.length > 0 ? (
              batchData.tasks.map((bt) => (
                <div
                  key={bt.task.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 flex flex-col justify-between shadow-sm dark:shadow-none"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{bt.task.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                        {bt.task.metricType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      Target Benchmark:{" "}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {bt.task.benchmarks[0]
                          ? JSON.stringify(bt.task.benchmarks[0].ruleExpression)
                          : "Standard threshold"}
                      </strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active evaluation in progress</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-xs text-slate-400 italic">
                No specific health tasks assigned to this batch yet. Click &quot;Configure Tasks&quot; to link tasks.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Enroll Student Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title={`Enroll Student into ${batchData.name}`}
        description="Select a student to join this batch cohort"
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
              <option value="">Choose student...</option>
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
              placeholder="e.g. ROLL-202"
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

      {/* Unenroll Confirmation Modal */}
      <Modal
        isOpen={Boolean(unenrollCandidate)}
        onClose={() => setUnenrollCandidate(null)}
        title="Remove Student from Batch"
        description="Confirm student withdrawal from this active training cohort"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                Remove &quot;{unenrollCandidate?.name}&quot;?
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                This student will be unenrolled from {batchData.name}. Their historical health records will remain preserved in the institution database.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUnenrollCandidate(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUnenroll}
              disabled={isUnenrolling}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              {isUnenrolling ? "Removing..." : "Confirm & Remove Student"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
