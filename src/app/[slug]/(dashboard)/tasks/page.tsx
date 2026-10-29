"use client";

import React, { useState, useEffect, use } from "react";
import {
  Activity,
  Plus,
  Target,
  Layers,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  AlertOctagon,
  Trash2,
  BellRing,
} from "lucide-react";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/sonner";
import { formatDate } from "@/lib/utils";

interface BenchmarkItem {
  id: string;
  versionNumber: number;
  operator: string;
  minValue: number | null;
  maxValue: number | null;
  targetValue: number | null;
  clinicalNotes: string | null;
  criticalZones?: { id: string; type: "BELOW" | "ABOVE"; value: number; label?: string }[] | null;
  effectiveFrom: string;
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  metricType: string;
  unit: string;
  frequency: string;
  benchmarks: BenchmarkItem[];
  assignments: {
    id: string;
    startDate: string;
    endDate: string;
    batch: { name: string; class: { name: string } } | null;
  }[];
}

export default function HealthTasksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string; className: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    metricType: "STEPS",
    unit: "steps",
    operator: "GREATER_THAN_OR_EQUAL",
    minValue: "8000",
    maxValue: "",
    targetValue: "8000",
    clinicalNotes: "",
    criticalZones: [] as {
      id: string;
      type: "BELOW" | "ABOVE";
      value: string;
      label: string;
    }[],
  });

  const handleAddCriticalZone = () => {
    setTaskForm((prev) => ({
      ...prev,
      criticalZones: [
        ...prev.criticalZones,
        {
          id: Math.random().toString(36).substring(2, 9),
          type: "ABOVE",
          value: "",
          label: "",
        },
      ],
    }));
  };

  const handleRemoveCriticalZone = (id: string) => {
    setTaskForm((prev) => ({
      ...prev,
      criticalZones: prev.criticalZones.filter((z) => z.id !== id),
    }));
  };

  const handleUpdateCriticalZone = (
    id: string,
    field: "type" | "value" | "label",
    value: string
  ) => {
    setTaskForm((prev) => ({
      ...prev,
      criticalZones: prev.criticalZones.map((z) =>
        z.id === id ? { ...z, [field]: value } : z
      ),
    }));
  };

  const [assignForm, setAssignForm] = useState({
    batchId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "09:30",
  });

  const calculateDuration = (start: string, end: string) => {
    try {
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return "";
      let diff = eh * 60 + em - (sh * 60 + sm);
      if (diff <= 0) diff += 24 * 60;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      if (hours === 0) return `${mins} mins`;
      if (mins === 0) return `${hours} hr${hours > 1 ? "s" : ""} (${diff} mins)`;
      return `${hours} hr${hours > 1 ? "s" : ""} ${mins} min${mins > 1 ? "s" : ""} (${diff} mins)`;
    } catch (_) {
      return "";
    }
  };

  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([
        fetch(`/api/${slug}/tasks`),
        fetch(`/api/${slug}/classes`),
      ]);
      const tData = await tRes.json();
      const cData = await cRes.json();

      if (tData.tasks) setTasks(tData.tasks);
      if (cData.classes) {
        const flatBatches: any[] = [];
        cData.classes.forEach((c: any) => {
          c.batches.forEach((b: any) => {
            flatBatches.push({ id: b.id, name: b.name, className: c.name });
          });
        });
        setBatches(flatBatches);
        if (flatBatches.length > 0 && !assignForm.batchId) {
          setAssignForm((prev) => ({ ...prev, batchId: flatBatches[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  const handleMetricChange = (type: string) => {
    let defaultUnit = "steps";
    let defaultOp = "GREATER_THAN_OR_EQUAL";
    let defaultMin = "8000";
    let defaultMax = "";
    let defaultCritical: { id: string; type: "BELOW" | "ABOVE"; value: string; label: string }[] = [];

    if (type === "HEART_RATE") {
      defaultUnit = "bpm";
      defaultOp = "LESS_THAN_OR_EQUAL";
      defaultMin = "";
      defaultMax = "75";
      defaultCritical = [
        { id: "c1", type: "BELOW", value: "40", label: "Critical Low (Bradycardia)" },
        { id: "c2", type: "ABOVE", value: "120", label: "Critical High (Tachycardia)" },
      ];
    } else if (type === "BLOOD_PRESSURE_SYSTOLIC") {
      defaultUnit = "mmHg";
      defaultOp = "BETWEEN_INCLUSIVE";
      defaultMin = "90";
      defaultMax = "120";
      defaultCritical = [
        { id: "c1", type: "BELOW", value: "85", label: "Hypotension Alert" },
        { id: "c2", type: "ABOVE", value: "140", label: "Hypertension Alert" },
      ];
    } else if (type === "SLEEP_DURATION_MINUTES") {
      defaultUnit = "minutes";
      defaultOp = "GREATER_THAN_OR_EQUAL";
      defaultMin = "480";
    } else if (type === "SPO2_PERCENTAGE") {
      defaultUnit = "%";
      defaultOp = "GREATER_THAN_OR_EQUAL";
      defaultMin = "95";
      defaultCritical = [
        { id: "c1", type: "BELOW", value: "90", label: "Hypoxia Critical Alert" },
      ];
    }

    setTaskForm((prev) => ({
      ...prev,
      metricType: type,
      unit: defaultUnit,
      operator: defaultOp,
      minValue: defaultMin,
      maxValue: defaultMax,
      criticalZones: defaultCritical,
    }));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    try {
      const isRange =
        taskForm.operator === "BETWEEN_INCLUSIVE" ||
        taskForm.operator === "BETWEEN_EXCLUSIVE";
      const singleVal = taskForm.minValue || taskForm.targetValue || taskForm.maxValue;

      const payload = {
        action: "CREATE_TASK",
        title: taskForm.title,
        description: taskForm.description,
        metricType: taskForm.metricType,
        unit: taskForm.unit,
        operator: taskForm.operator,
        minValue: isRange
          ? taskForm.minValue
          : taskForm.operator === "GREATER_THAN_OR_EQUAL" || taskForm.operator === "EXACT_MATCH"
          ? singleVal
          : null,
        maxValue: isRange
          ? taskForm.maxValue
          : taskForm.operator === "LESS_THAN_OR_EQUAL"
          ? singleVal
          : null,
        targetValue: singleVal,
        clinicalNotes: taskForm.clinicalNotes,
        criticalZones: taskForm.criticalZones,
      };

      const res = await fetch(`/api/${slug}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Health Task & Benchmark Version initialized!");
      setIsTaskModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err.message);
      toast.error(err.message || "Failed to create task.");
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    try {
      const [sh, sm] = assignForm.startTime.split(":").map(Number);
      const [eh, em] = assignForm.endTime.split(":").map(Number);
      let durationMins = eh * 60 + em - (sh * 60 + sm);
      if (durationMins <= 0) durationMins += 24 * 60;

      const res = await fetch(`/api/${slug}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_TASK",
          taskId: selectedTaskId,
          ...assignForm,
          durationMinutes: durationMins,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Task assigned and timetable schedule generated!");
      setIsAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err.message);
      toast.error(err.message || "Failed to assign task.");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title="Health Monitoring Tasks & Benchmarks"
        subtitle="Configure physical activity and physiological benchmark thresholds with version tracking"
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Action */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Health Metric Catalog
            </h2>
            <p className="text-xs text-slate-500">
              Tasks evaluated daily by the automated benchmark worker
            </p>
          </div>
          <Button
            onClick={() => setIsTaskModalOpen(true)}
            className="gap-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Health Task</span>
          </Button>
        </div>

        {/* Task Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="lg:col-span-2 glass-card rounded-2xl p-12 text-center text-xs text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800">
              Loading health tasks catalog...
            </div>
          ) : tasks.length > 0 ? (
            tasks.map((task) => {
              const latestBm = task.benchmarks[0];

              return (
                <div
                  key={task.id}
                  className="glass-card rounded-2xl p-6 border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                            {task.title}
                          </h3>
                          <Badge variant="default" className="text-[10px] uppercase font-bold">
                            {task.metricType}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {task.description || "Continuous daily telemetry tracking"}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-semibold block">
                          v{latestBm?.versionNumber || 1}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {task.frequency}
                        </span>
                      </div>
                    </div>

                    {/* Active Benchmark Box */}
                    {latestBm && (
                      <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 mb-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            <span>Benchmark Rule:</span>
                          </span>
                          <span className="font-mono text-teal-700 dark:text-teal-300 font-bold">
                            {latestBm.operator.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                          Target:{" "}
                          {latestBm.minValue && latestBm.maxValue
                            ? `${latestBm.minValue} to ${latestBm.maxValue} ${task.unit}`
                            : `${latestBm.minValue || latestBm.maxValue || latestBm.targetValue} ${task.unit}`}
                        </div>
                        {latestBm.clinicalNotes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1.5">
                            &quot;{latestBm.clinicalNotes}&quot;
                          </p>
                        )}

                        {/* Critical Alert Safety Zones */}
                        {latestBm.criticalZones && Array.isArray(latestBm.criticalZones) && latestBm.criticalZones.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-teal-200/60 dark:border-teal-500/20">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-1.5">
                              <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                              <span>Critical Safety Alert Zones:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {latestBm.criticalZones.map((cz: any, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                                >
                                  <span>{cz.type === "BELOW" ? "<" : ">"} {cz.value} {task.unit}</span>
                                  {cz.label && (
                                    <span className="font-sans font-normal opacity-80">({cz.label})</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Active Assignments */}
                    <div className="mb-4">
                      <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1.5">
                        Assigned Cohorts ({task.assignments.length}):
                      </span>
                      {task.assignments.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {task.assignments.map((as) => (
                            <span
                              key={as.id}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                            >
                              {as.batch?.name || "Cohort"}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Not currently assigned to any batch
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Unit: <strong className="text-slate-700 dark:text-slate-200">{task.unit}</strong>
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setIsAssignModalOpen(true);
                      }}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
                    >
                      Assign to Batch
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="lg:col-span-2 glass-card rounded-2xl p-12 text-center text-xs text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800">
              No tasks created yet.
            </div>
          )}
        </div>
      </main>

      {/* Modal: Create Task */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Create Health Task & Benchmark"
        description="Select a supported physiological metric and configure the benchmark evaluation rule"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
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
              Task Title *
            </label>
            <Input
              required
              placeholder="e.g. Daily Step Target, Resting Pulse Check"
              value={taskForm.title}
              onChange={(e) =>
                setTaskForm((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Metric Type *
              </label>
              <select
                value={taskForm.metricType}
                onChange={(e) => handleMetricChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                <option value="STEPS">Steps (Daily ambulatory count)</option>
                <option value="HEART_RATE">Heart Rate (Pulse bpm)</option>
                <option value="BLOOD_PRESSURE_SYSTOLIC">Blood Pressure (Systolic mmHg)</option>
                <option value="SLEEP_DURATION_MINUTES">Sleep Duration (Minutes)</option>
                <option value="SPO2_PERCENTAGE">Blood Oxygen (SpO2 %)</option>
                <option value="CALORIES_BURNED">Calories Burned (kcal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Measurement Unit *
              </label>
              <Input
                required
                value={taskForm.unit}
                onChange={(e) =>
                  setTaskForm((prev) => ({ ...prev, unit: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Benchmark Operator & Thresholds */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase text-teal-800 dark:text-teal-400">
              Benchmark Rule Configuration
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Comparison Operator *
              </label>
              <select
                value={taskForm.operator}
                onChange={(e) =>
                  setTaskForm((prev) => ({ ...prev, operator: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                <option value="GREATER_THAN_OR_EQUAL">&gt;= (Greater than or equal to threshold)</option>
                <option value="LESS_THAN_OR_EQUAL">&lt;= (Less than or equal to threshold)</option>
                <option value="BETWEEN_INCLUSIVE">BETWEEN (Inclusive range [min, max])</option>
                <option value="EXACT_MATCH">EXACT MATCH (= Target)</option>
              </select>
            </div>

            {/* Dynamic Value Entry Based on Operator Selection */}
            {taskForm.operator === "BETWEEN_INCLUSIVE" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Min Value (Lower Bound) *
                  </label>
                  <Input
                    type="number"
                    required
                    placeholder="e.g. 90"
                    value={taskForm.minValue}
                    onChange={(e) =>
                      setTaskForm((prev) => ({ ...prev, minValue: e.target.value }))
                    }
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Range lower threshold ({taskForm.unit})
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Max Value (Upper Bound) *
                  </label>
                  <Input
                    type="number"
                    required
                    placeholder="e.g. 120"
                    value={taskForm.maxValue}
                    onChange={(e) =>
                      setTaskForm((prev) => ({ ...prev, maxValue: e.target.value }))
                    }
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Range upper threshold ({taskForm.unit})
                  </span>
                </div>
              </div>
            ) : taskForm.operator === "EXACT_MATCH" ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Value (= Exact Match) *
                </label>
                <Input
                  type="number"
                  required
                  placeholder="e.g. 8000"
                  value={taskForm.minValue}
                  onChange={(e) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      minValue: e.target.value,
                      targetValue: e.target.value,
                    }))
                  }
                />
                <span className="text-[10px] text-teal-400 font-medium mt-1 block">
                  Single value mode: Recorded telemetry must match this exact target ({taskForm.unit}).
                </span>
              </div>
            ) : taskForm.operator === "GREATER_THAN_OR_EQUAL" ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Threshold Value (&gt;=) *
                </label>
                <Input
                  type="number"
                  required
                  placeholder="e.g. 8000"
                  value={taskForm.minValue}
                  onChange={(e) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      minValue: e.target.value,
                      targetValue: e.target.value,
                    }))
                  }
                />
                <span className="text-[10px] text-teal-400 font-medium mt-1 block">
                  Single value mode: Recorded telemetry must reach or exceed this threshold ({taskForm.unit}).
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Maximum Threshold Value (&lt;=) *
                </label>
                <Input
                  type="number"
                  required
                  placeholder="e.g. 75"
                  value={taskForm.maxValue || taskForm.minValue}
                  onChange={(e) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      maxValue: e.target.value,
                      minValue: e.target.value,
                      targetValue: e.target.value,
                    }))
                  }
                />
                <span className="text-[10px] text-teal-400 font-medium mt-1 block">
                  Single value mode: Recorded telemetry must remain at or below this ceiling ({taskForm.unit}).
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Clinical / Coaching Guidelines
              </label>
              <Input
                placeholder="e.g. Endorsed by youth health board"
                value={taskForm.clinicalNotes}
                onChange={(e) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    clinicalNotes: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Optional Critical Alert Safety Zones (strictly ABOVE or BELOW) */}
          <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase text-rose-800 dark:text-rose-300">
                    Optional Critical Safety Alert Zones
                  </h4>
                  <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80">
                    Triggers smartband vibration & incident logging when student telemetry reaches extremes
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddCriticalZone}
                className="h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/30 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Critical Zone
              </Button>
            </div>

            {taskForm.criticalZones && taskForm.criticalZones.length > 0 ? (
              <div className="space-y-2 mt-2">
                {taskForm.criticalZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 flex flex-col md:flex-row items-stretch md:items-center gap-2"
                  >
                    {/* Operator selector: Strictly ABOVE or BELOW */}
                    <div className="w-full md:w-44 flex-shrink-0">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Alert Condition
                      </label>
                      <select
                        value={zone.type}
                        onChange={(e) =>
                          handleUpdateCriticalZone(zone.id, "type", e.target.value as "BELOW" | "ABOVE")
                        }
                        className="w-full h-8 px-2 text-xs font-bold rounded border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200"
                      >
                        <option value="BELOW">CRITICAL BELOW (&lt;)</option>
                        <option value="ABOVE">CRITICAL ABOVE (&gt;)</option>
                      </select>
                    </div>

                    {/* Numeric Value Input */}
                    <div className="w-full md:w-36 flex-shrink-0">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Threshold ({taskForm.unit}) *
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          placeholder="Threshold"
                          value={zone.value}
                          onChange={(e) =>
                            handleUpdateCriticalZone(zone.id, "value", e.target.value)
                          }
                          className="h-8 text-xs font-semibold"
                          required
                        />
                      </div>
                    </div>

                    {/* Description / Label */}
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Safety Label (Optional)
                      </label>
                      <Input
                        placeholder="e.g. Critical High Pulse Alert"
                        value={zone.label}
                        onChange={(e) =>
                          handleUpdateCriticalZone(zone.id, "label", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    {/* Delete action */}
                    <div className="self-end md:self-center pt-2 md:pt-4">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveCriticalZone(zone.id)}
                        className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                        title="Remove critical zone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2.5 border border-dashed border-rose-200 dark:border-rose-900/40 rounded-lg text-xs text-rose-600/80 dark:text-rose-400/80">
                No critical safety alert zones configured for this task.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
            >
              Save Task & Benchmark
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Task to Batch */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Health Task to Cohort Batch"
        description="Creates scheduled evaluation timetable entries across effective dates"
      >
        <form onSubmit={handleAssignTask} className="space-y-4">
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
              Target Batch *
            </label>
            <select
              required
              value={assignForm.batchId}
              onChange={(e) =>
                setAssignForm((prev) => ({ ...prev, batchId: e.target.value }))
              }
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 text-sm font-medium"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.className} → {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Date *
              </label>
              <Input
                type="date"
                required
                value={assignForm.startDate}
                onChange={(e) =>
                  setAssignForm((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Date *
              </label>
              <Input
                type="date"
                required
                value={assignForm.endDate}
                onChange={(e) =>
                  setAssignForm((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Time *
              </label>
              <Input
                type="time"
                required
                value={assignForm.startTime}
                onChange={(e) =>
                  setAssignForm((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Time *
              </label>
              <Input
                type="time"
                required
                value={assignForm.endTime}
                onChange={(e) =>
                  setAssignForm((prev) => ({
                    ...prev,
                    endTime: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Session Duration (Auto Calculated)
            </label>
            <Input
              type="text"
              readOnly
              disabled
              value={calculateDuration(assignForm.startTime, assignForm.endTime)}
              placeholder="e.g. 1 hr 30 mins (90 mins)"
              className="bg-slate-50 dark:bg-slate-900/60 font-semibold text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900/50 cursor-not-allowed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
            >
              Generate Timetable
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
