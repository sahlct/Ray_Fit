"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  Target,
  GraduationCap,
  Users,
  Filter,
  RotateCcw,
  Search,
  Trash2,
  Loader2,
  CheckSquare,
  Square,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Batch {
  id: string;
  name: string;
  classId: string;
}

interface ClassItem {
  id: string;
  name: string;
  batches: Batch[];
}

interface TimetableEntry {
  id: string;
  scheduledDate: string | Date;
  windowStartTime: string | null;
  windowEndTime: string | null;
  durationMinutes?: number | null;
  status: string;
  assignment: {
    id: string;
    classId: string | null;
    batchId: string | null;
    task: {
      id: string;
      title: string;
      metricType: string;
      unit: string;
    };
    batch: {
      id: string;
      name: string;
      classId: string;
      class?: {
        id: string;
        name: string;
      } | null;
    } | null;
  };
  benchmarkVersion: {
    id: string;
    versionNumber: number;
    operator: string;
    minValue: any;
    maxValue: any;
    targetValue: any;
    criticalZones?: { id: string; type: "BELOW" | "ABOVE"; value: number; label?: string }[] | null;
  };
  totalCriticalAlerts?: number;
  _count: {
    evaluations: number;
  };
}

interface Props {
  slug: string;
  initialTimetables: TimetableEntry[];
  classes: ClassItem[];
}

export function TimetableScheduleViewer({ slug, initialTimetables, classes }: Props) {
  const [timetables, setTimetables] = useState<TimetableEntry[]>(initialTimetables);
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  useEffect(() => {
    setTimetables(initialTimetables);
  }, [initialTimetables]);

  // Extract batches available based on selected class
  const availableBatches = useMemo(() => {
    if (selectedClassId === "ALL") {
      const all: { id: string; name: string; className: string }[] = [];
      classes.forEach((c) => {
        c.batches.forEach((b) => {
          all.push({ id: b.id, name: b.name, className: c.name });
        });
      });
      return all;
    }
    const cls = classes.find((c) => c.id === selectedClassId);
    if (!cls) return [];
    return cls.batches.map((b) => ({
      id: b.id,
      name: b.name,
      className: cls.name,
    }));
  }, [classes, selectedClassId]);

  // When class filter changes, reset batch if current batch doesn't belong to the new class
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    if (classId === "ALL") {
      setSelectedBatchId("ALL");
    } else {
      const targetClass = classes.find((c) => c.id === classId);
      const batchExists = targetClass?.batches.some((b) => b.id === selectedBatchId);
      if (!batchExists) {
        setSelectedBatchId("ALL");
      }
    }
  };

  // Filtered timetable entries
  const filteredTimetables = useMemo(() => {
    return timetables.filter((tt) => {
      const batch = tt.assignment.batch;
      const classId = batch?.classId || tt.assignment.classId;
      const batchId = tt.assignment.batchId;

      // 1. Filter by Class
      if (selectedClassId !== "ALL" && classId !== selectedClassId) {
        return false;
      }

      // 2. Filter by Batch
      if (selectedBatchId !== "ALL" && batchId !== selectedBatchId) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = tt.assignment.task.title.toLowerCase().includes(q);
        const matchMetric = tt.assignment.task.metricType.toLowerCase().includes(q);
        const matchBatch = batch?.name.toLowerCase().includes(q);
        const matchClass = batch?.class?.name?.toLowerCase().includes(q);
        if (!matchTitle && !matchMetric && !matchBatch && !matchClass) {
          return false;
        }
      }

      return true;
    });
  }, [timetables, selectedClassId, selectedBatchId, searchQuery]);

  const hasActiveFilters =
    selectedClassId !== "ALL" || selectedBatchId !== "ALL" || searchQuery.trim() !== "";

  const handleResetFilters = () => {
    setSelectedClassId("ALL");
    setSelectedBatchId("ALL");
    setSearchQuery("");
  };

  const selectedClassName =
    selectedClassId !== "ALL"
      ? classes.find((c) => c.id === selectedClassId)?.name
      : null;

  // Selection Logic
  const allFilteredSelected =
    filteredTimetables.length > 0 &&
    filteredTimetables.every((tt) => selectedIds.has(tt.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      // Unselect all currently filtered
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredTimetables.forEach((tt) => next.delete(tt.id));
        return next;
      });
    } else {
      // Select all currently filtered
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredTimetables.forEach((tt) => next.add(tt.id));
        return next;
      });
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Delete Single Timetable
  const handleDeleteSingle = async (tt: TimetableEntry) => {
    const formattedDate = formatDate(tt.scheduledDate);
    const title = tt.assignment.task.title;

    if (
      !confirm(
        `Are you sure you want to delete the scheduled task "${title}" on ${formattedDate}?`
      )
    ) {
      return;
    }

    setDeletingIds((prev) => new Set(prev).add(tt.id));

    try {
      const res = await fetch(`/api/${slug}/timetables/${tt.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete timetable entry");
      }

      toast.success(`Deleted schedule for "${title}" on ${formattedDate}.`);
      setTimetables((prev) => prev.filter((item) => item.id !== tt.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(tt.id);
        return next;
      });
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete timetable entry.");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(tt.id);
        return next;
      });
    }
  };

  // Bulk Delete Selected Timetables
  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${count} selected scheduled timetable ${
          count === 1 ? "entry" : "entries"
        }? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsBulkDeleting(true);

    try {
      const res = await fetch(`/api/${slug}/timetables`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timetableIds: Array.from(selectedIds) }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete selected timetable entries");
      }

      toast.success(data.message || `Successfully deleted ${count} timetable entries.`);
      setTimetables((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error("Bulk delete error:", err);
      toast.error(err.message || "Failed to delete timetable entries.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Entry Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Task Schedule Calendar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily measurement windows, active rules, and evaluation progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Badge
              variant="outline"
              className="text-xs font-semibold py-1 px-2.5 text-teal-600 dark:text-teal-400 border-teal-500/30"
            >
              Showing {filteredTimetables.length} of {timetables.length}
            </Badge>
          )}
          <Badge variant="default" className="text-xs font-semibold py-1 px-3">
            {timetables.length} Timetable Entries Active
          </Badge>
        </div>
      </div>

      {/* Class & Batch Filter Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Filters:</span>
        </div>

        {/* 1. Class Filter Dropdown */}
        <div className="flex items-center gap-2 min-w-[200px] flex-1 sm:flex-initial">
          <div className="relative w-full">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Classes ({classes.length})</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Dependent Batch Filter Dropdown */}
        <div className="flex items-center gap-2 min-w-[200px] flex-1 sm:flex-initial">
          <div className="relative w-full">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">
                {selectedClassId === "ALL"
                  ? "All Batches"
                  : `All Batches in ${selectedClassName || "Class"}`}
              </option>
              {availableBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {selectedClassId === "ALL" ? `(${b.className})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Search Field */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search task or batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-200">
            <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
              {selectedIds.size}
            </span>
            <span>
              {selectedIds.size} scheduled {selectedIds.size === 1 ? "entry" : "entries"} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1"
            >
              Cancel Selection
            </button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="h-8 gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-300 dark:border-rose-900/50 shadow-sm"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedIds.size})</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Timetable Entries Table */}
      <div className="glass-card rounded-2xl border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAllFiltered}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer h-4 w-4"
                    title="Select all visible entries"
                  />
                </th>
                <th className="py-3.5 px-4 w-12">#</th>
                <th className="py-3.5 px-6">Scheduled Date</th>
                <th className="py-3.5 px-6">Task & Metric</th>
                <th className="py-3.5 px-6">Target Batch</th>
                <th className="py-3.5 px-6">Active Benchmark Rule</th>
                <th className="py-3.5 px-6">Time Window</th>
                <th className="py-3.5 px-6">Evaluations Done</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-6 text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTimetables.length > 0 ? (
                filteredTimetables.map((tt, idx) => {
                  const task = tt.assignment.task;
                  const bm = tt.benchmarkVersion;
                  const batch = tt.assignment.batch;

                  const start = tt.windowStartTime || "08:00";
                  const end = tt.windowEndTime || "09:30";
                  const duration = tt.durationMinutes;

                  const isSelected = selectedIds.has(tt.id);
                  const isDeleting = deletingIds.has(tt.id);

                  return (
                    <tr
                      key={tt.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-teal-50/60 dark:bg-teal-950/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(tt.id)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer h-4 w-4"
                        />
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-400 font-mono">
                        #{idx + 1}
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {formatDate(tt.scheduledDate)}
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {task.title}
                        </div>
                        <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400">
                          {task.metricType} ({task.unit})
                        </span>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300">
                        <strong className="block text-slate-900 dark:text-white">
                          {batch?.name || "Batch"}
                        </strong>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {batch?.class?.name || "Unassigned Class"}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-xs">
                        <div className="flex items-center gap-1 font-semibold text-teal-700 dark:text-teal-300">
                          <Target className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>
                            {bm.operator.replace(/_/g, " ")} (
                            {bm.minValue && bm.maxValue
                              ? `${bm.minValue} - ${bm.maxValue}`
                              : String(
                                  bm.minValue || bm.maxValue || bm.targetValue || ""
                                )}{" "}
                            {task.unit})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          Benchmark Version #{bm.versionNumber}
                        </span>
                        {bm.criticalZones && Array.isArray(bm.criticalZones) && bm.criticalZones.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            {bm.criticalZones.map((cz: any, ci: number) => (
                              <span
                                key={ci}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
                                title={cz.label || "Critical Alert Threshold"}
                              >
                                <span>{cz.type === "BELOW" ? "<" : ">"} {cz.value} {task.unit}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>
                            {start} - {end}
                          </span>
                        </div>
                        {duration && (
                          <span className="inline-block mt-0.5 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                            {duration >= 60
                              ? `${Math.floor(duration / 60)}h ${
                                  duration % 60 > 0 ? `${duration % 60}m` : ""
                                } (${duration} mins)`
                              : `${duration} mins`}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <div>{tt._count.evaluations} students recorded</div>
                        {(tt.totalCriticalAlerts ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            {tt.totalCriticalAlerts} Critical Alert{tt.totalCriticalAlerts! > 1 ? "s" : ""}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            tt.status === "ACTIVE"
                              ? "bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30"
                              : tt.status === "COMPLETED"
                              ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {tt.status}
                        </span>
                      </td>

                      {/* Action Column: Delete Option */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDeleteSingle(tt)}
                          disabled={isDeleting}
                          title="Delete this scheduled timetable entry"
                          className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-semibold">No timetable entries found</p>
                    {hasActiveFilters ? (
                      <p className="text-xs text-slate-400 mt-1">
                        Try adjusting or clearing your Class and Batch filters.
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">
                        No health task timetable schedules created yet.
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
