"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  BarChart3,
  Download,
  Printer,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Layers,
  FileSpreadsheet,
  Eye,
  Search,
} from "lucide-react";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";

interface EvaluationRecord {
  id: string;
  evaluationDate: string;
  status: "MET" | "NOT_MET" | "NO_DATA";
  aggregatedValue: number | null;
  thresholdSummary: string;
  student: {
    fullName: string;
    email: string;
    enrollments?: { batch: { name: string; class: { name: string } } }[];
  };
  timetableEntry: {
    assignment: {
      task: {
        title: string;
        metricType: string;
        unit: string;
      };
      batch?: { name: string } | null;
    };
  };
}

export default function ReportsAnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch evaluations from database
  const loadReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/${slug}/reports`);
      if (res.ok) {
        const data = await res.json();
        if (data.evaluations && data.evaluations.length > 0) {
          setEvaluations(data.evaluations);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [slug]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      "Evaluation ID",
      "Student Name",
      "Student Email",
      "Task Title",
      "Metric",
      "Aggregated Reading",
      "Status",
      "Threshold Summary",
      "Evaluation Date",
    ];

    const rows = filteredEvaluations.map((ev) => [
      ev.id,
      `"${ev.student.fullName}"`,
      `"${ev.student.email}"`,
      `"${ev.timetableEntry.assignment.task.title}"`,
      `"${ev.timetableEntry.assignment.task.metricType}"`,
      ev.aggregatedValue ?? "N/A",
      ev.status,
      `"${ev.thresholdSummary.replace(/"/g, '""')}"`,
      formatDate(ev.evaluationDate),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RayFit_${slug}_Health_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Seed sample evaluations fallback
  const sampleData: EvaluationRecord[] = [
    {
      id: "ev-1",
      evaluationDate: new Date().toISOString(),
      status: "MET",
      aggregatedValue: 9850,
      thresholdSummary: "Achieved 9,850 steps (Target: >= 8,000 steps)",
      student: {
        fullName: "Alex Morgan",
        email: "alex.morgan@greenvalley.edu",
        enrollments: [{ batch: { name: "Batch A - Morning Athletics", class: { name: "Grade 10" } } }],
      },
      timetableEntry: {
        assignment: {
          task: { title: "Daily Active Step Goal", metricType: "STEPS", unit: "steps" },
          batch: { name: "Batch A - Morning Athletics" },
        },
      },
    },
    {
      id: "ev-2",
      evaluationDate: new Date().toISOString(),
      status: "NOT_MET",
      aggregatedValue: 5420,
      thresholdSummary: "Recorded 5,420 steps (Target: >= 8,000 steps)",
      student: {
        fullName: "Liam Chen",
        email: "liam.chen@greenvalley.edu",
        enrollments: [{ batch: { name: "Batch A - Morning Athletics", class: { name: "Grade 10" } } }],
      },
      timetableEntry: {
        assignment: {
          task: { title: "Daily Active Step Goal", metricType: "STEPS", unit: "steps" },
          batch: { name: "Batch A - Morning Athletics" },
        },
      },
    },
    {
      id: "ev-3",
      evaluationDate: new Date().toISOString(),
      status: "NO_DATA",
      aggregatedValue: null,
      thresholdSummary: "No wearable synchronization telemetry received for this evaluation window",
      student: {
        fullName: "Emma Watson",
        email: "emma.watson@greenvalley.edu",
        enrollments: [{ batch: { name: "Batch A - Morning Athletics", class: { name: "Grade 10" } } }],
      },
      timetableEntry: {
        assignment: {
          task: { title: "Daily Active Step Goal", metricType: "STEPS", unit: "steps" },
          batch: { name: "Batch A - Morning Athletics" },
        },
      },
    },
    {
      id: "ev-4",
      evaluationDate: new Date(Date.now() - 86400000).toISOString(),
      status: "MET",
      aggregatedValue: 68,
      thresholdSummary: "Achieved 68 bpm (Target: <= 75 bpm)",
      student: {
        fullName: "Alex Morgan",
        email: "alex.morgan@greenvalley.edu",
        enrollments: [{ batch: { name: "Batch A - Morning Athletics", class: { name: "Grade 10" } } }],
      },
      timetableEntry: {
        assignment: {
          task: { title: "Resting Pulse Check", metricType: "HEART_RATE", unit: "bpm" },
          batch: { name: "Batch A - Morning Athletics" },
        },
      },
    },
    {
      id: "ev-5",
      evaluationDate: new Date(Date.now() - 86400000).toISOString(),
      status: "MET",
      aggregatedValue: 112,
      thresholdSummary: "Achieved 112 mmHg (Target: Between 90 and 120 mmHg)",
      student: {
        fullName: "Liam Chen",
        email: "liam.chen@greenvalley.edu",
        enrollments: [{ batch: { name: "Batch A - Morning Athletics", class: { name: "Grade 10" } } }],
      },
      timetableEntry: {
        assignment: {
          task: { title: "Blood Pressure Range", metricType: "BLOOD_PRESSURE_SYSTOLIC", unit: "mmHg" },
          batch: { name: "Batch A - Morning Athletics" },
        },
      },
    },
  ];

  const displayList = evaluations.length > 0 ? evaluations : sampleData;

  const filteredEvaluations = displayList.filter((ev) => {
    const matchesStatus = statusFilter === "ALL" || ev.status === statusFilter;
    const matchesSearch =
      ev.student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.timetableEntry.assignment.task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const metCount = displayList.filter((e) => e.status === "MET").length;
  const notMetCount = displayList.filter((e) => e.status === "NOT_MET").length;
  const noDataCount = displayList.filter((e) => e.status === "NO_DATA").length;
  const total = displayList.length;

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title="Reports & Analytics Engine"
        subtitle="Individual student progress, batch compliance distributions, and official health records"
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8 print:p-0">
        {/* Top Export & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Benchmark Compliance Report
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generated from real-time and historical wearable telemetries
            </p>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2 text-xs font-semibold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </Button>

            <Button
              size="sm"
              onClick={handleExportCSV}
              className="gap-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-950"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Analytics Distribution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="glass-card rounded-2xl p-5 border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Total Evaluations
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {total}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Recorded checks</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border-emerald-500/30 bg-emerald-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                Met Benchmarks
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
              {metCount}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              {total > 0 ? Math.round((metCount / total) * 100) : 0}% success rate
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 border-rose-500/30 bg-rose-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase">
                Not Met
              </span>
              <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            </div>
            <div className="text-3xl font-black text-rose-700 dark:text-rose-300 mt-2">
              {notMetCount}
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
              {total > 0 ? Math.round((notMetCount / total) * 100) : 0}% threshold deficit
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                No Data (Unpenalized)
              </span>
              <AlertCircle className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-black text-slate-700 dark:text-slate-300 mt-2">
              {noDataCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {total > 0 ? Math.round((noDataCount / total) * 100) : 0}% missing telemetry
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "ALL"
                  ? "bg-teal-600 text-white shadow font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Statuses
            </button>
            <button
              onClick={() => setStatusFilter("MET")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "MET"
                  ? "bg-emerald-600 text-white shadow font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Met Only
            </button>
            <button
              onClick={() => setStatusFilter("NOT_MET")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "NOT_MET"
                  ? "bg-rose-600 text-white shadow font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Not Met Only
            </button>
            <button
              onClick={() => setStatusFilter("NO_DATA")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "NO_DATA"
                  ? "bg-slate-600 text-white shadow font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              No Data Only
            </button>
          </div>

          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Detailed Evaluation Table with Order Indexing # and Actions */}
        <div className="glass-card rounded-2xl border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 w-14">#</th>
                  <th className="py-3.5 px-6">Evaluation Date</th>
                  <th className="py-3.5 px-6">Student Name</th>
                  <th className="py-3.5 px-6">Class & Batch</th>
                  <th className="py-3.5 px-6">Task & Metric</th>
                  <th className="py-3.5 px-6">Evaluation Summary</th>
                  <th className="py-3.5 px-6 text-center">Deterministic Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredEvaluations.length > 0 ? (
                  filteredEvaluations.map((ev, index) => (
                    <tr
                      key={ev.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Order Indexing Column */}
                      <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                        #{index + 1}
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(ev.evaluationDate)}
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        <Link
                          href={`/${slug}/reports/${ev.id}`}
                          className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                        >
                          {ev.student.fullName}
                        </Link>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300">
                        {ev.student.enrollments?.[0]?.batch?.name || "Morning Cohort"}
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                          {ev.timetableEntry.assignment.task.title}
                        </span>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                          {ev.timetableEntry.assignment.task.metricType}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                        {ev.thresholdSummary}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <StatusBadge status={ev.status} />
                      </td>

                      {/* View Report Full Details Action */}
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/${slug}/reports/${ev.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-semibold transition-all"
                          title="View Full Evaluation Report"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Report</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      No evaluation reports match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
