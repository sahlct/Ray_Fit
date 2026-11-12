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
  GraduationCap,
  ChevronRight,
  ShieldAlert,
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
    batch: { name: string; class?: { name: string } } | null;
    class: { name: string } | null;
  }[];
}

interface CriticalZoneForm {
  id: string;
  type: "BELOW" | "ABOVE";
  value: string;
  label: string;
}

interface MetricOptionForm {
  id: string;
  metricType: string;
  unit: string;
  operator: string;
  minValue: string;
  maxValue: string;
  targetValue: string;
  clinicalNotes: string;
  criticalZones: CriticalZoneForm[];
}

const ALL_METRIC_TYPES = [
  { value: "STEPS", label: "Steps (Daily ambulatory count)" },
  { value: "HEART_RATE", label: "Heart Rate (Pulse bpm)" },
  { value: "BLOOD_PRESSURE_SYSTOLIC", label: "Blood Pressure (Systolic mmHg)" },
  { value: "SLEEP_DURATION_MINUTES", label: "Sleep Duration (Minutes)" },
  { value: "SPO2_PERCENTAGE", label: "Blood Oxygen (SpO2 %)" },
  { value: "CALORIES_BURNED", label: "Calories Burned (kcal)" },
];

const DEFAULT_METRIC_CONFIGS: Record<string, { unit: string; operator: string; minValue: string; maxValue: string; criticalZones: CriticalZoneForm[] }> = {
  STEPS: {
    unit: "steps",
    operator: "GREATER_THAN_OR_EQUAL",
    minValue: "8000",
    maxValue: "",
    criticalZones: [],
  },
  HEART_RATE: {
    unit: "bpm",
    operator: "LESS_THAN_OR_EQUAL",
    minValue: "",
    maxValue: "75",
    criticalZones: [
      { id: "c1", type: "BELOW", value: "40", label: "Critical Low (Bradycardia)" },
      { id: "c2", type: "ABOVE", value: "120", label: "Critical High (Tachycardia)" },
    ],
  },
  BLOOD_PRESSURE_SYSTOLIC: {
    unit: "mmHg",
    operator: "BETWEEN_INCLUSIVE",
    minValue: "90",
    maxValue: "120",
    criticalZones: [
      { id: "c1", type: "BELOW", value: "85", label: "Hypotension Alert" },
      { id: "c2", type: "ABOVE", value: "140", label: "Hypertension Alert" },
    ],
  },
  SLEEP_DURATION_MINUTES: {
    unit: "minutes",
    operator: "GREATER_THAN_OR_EQUAL",
    minValue: "480",
    maxValue: "",
    criticalZones: [],
  },
  SPO2_PERCENTAGE: {
    unit: "%",
    operator: "GREATER_THAN_OR_EQUAL",
    minValue: "95",
    maxValue: "",
    criticalZones: [
      { id: "c1", type: "BELOW", value: "90", label: "Hypoxia Critical Alert" },
    ],
  },
  CALORIES_BURNED: {
    unit: "kcal",
    operator: "GREATER_THAN_OR_EQUAL",
    minValue: "500",
    maxValue: "",
    criticalZones: [],
  },
};

function createInitialMetric(type: string): MetricOptionForm {
  const conf = DEFAULT_METRIC_CONFIGS[type] || {
    unit: "units",
    operator: "GREATER_THAN_OR_EQUAL",
    minValue: "100",
    maxValue: "",
    criticalZones: [],
  };
  return {
    id: Math.random().toString(36).substring(2, 9),
    metricType: type,
    unit: conf.unit,
    operator: conf.operator,
    minValue: conf.minValue,
    maxValue: conf.maxValue,
    targetValue: conf.minValue || conf.maxValue || "",
    clinicalNotes: "",
    criticalZones: [...conf.criticalZones.map((z) => ({ ...z, id: Math.random().toString(36).substring(2, 9) }))],
  };
}

export default function HealthTasksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [batches, setBatches] = useState<{ id: string; name: string; className: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; academicPeriod: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");

  // Task Creation Form: Multi-metric support
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    metrics: [createInitialMetric("STEPS")] as MetricOptionForm[],
  });

  // Assign Form: Supports both entire Program and Batch
  const [assignForm, setAssignForm] = useState({
    scope: "BATCH" as "BATCH" | "PROGRAM",
    batchId: "",
    classId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "09:30",
  });

  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

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
        setPrograms(cData.classes.map((c: any) => ({
          id: c.id,
          name: c.name,
          academicPeriod: c.academicPeriod,
        })));

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
        if (cData.classes.length > 0 && !assignForm.classId) {
          setAssignForm((prev) => ({ ...prev, classId: cData.classes[0].id }));
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

  // Metric options management
  const handleAddMetricOption = () => {
    // Find first unused metric type
    const usedTypes = new Set(taskForm.metrics.map((m) => m.metricType));
    const nextAvail = ALL_METRIC_TYPES.find((t) => !usedTypes.has(t.value));
    if (!nextAvail) {
      toast.error("All available metric types have already been configured for this task.");
      return;
    }

    setTaskForm((prev) => ({
      ...prev,
      metrics: [...prev.metrics, createInitialMetric(nextAvail.value)],
    }));
  };

  const handleRemoveMetricOption = (metricId: string) => {
    if (taskForm.metrics.length <= 1) {
      toast.error("A task must have at least one benchmark metric.");
      return;
    }
    setTaskForm((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((m) => m.id !== metricId),
    }));
  };

  const handleMetricTypeChange = (metricId: string, newType: string) => {
    // Verify no duplicate metric type
    const otherUsedTypes = new Set(
      taskForm.metrics.filter((m) => m.id !== metricId).map((m) => m.metricType)
    );
    if (otherUsedTypes.has(newType)) {
      toast.error(`The metric type '${newType}' is already added to this task. Duplicate metrics are not allowed.`);
      return;
    }

    const conf = DEFAULT_METRIC_CONFIGS[newType] || {
      unit: "units",
      operator: "GREATER_THAN_OR_EQUAL",
      minValue: "100",
      maxValue: "",
      criticalZones: [],
    };

    setTaskForm((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) => {
        if (m.id !== metricId) return m;
        return {
          ...m,
          metricType: newType,
          unit: conf.unit,
          operator: conf.operator,
          minValue: conf.minValue,
          maxValue: conf.maxValue,
          targetValue: conf.minValue || conf.maxValue || "",
          criticalZones: [...conf.criticalZones.map((z) => ({ ...z, id: Math.random().toString(36).substring(2, 9) }))],
        };
      }),
    }));
  };

  const handleUpdateMetricField = (
    metricId: string,
    field: keyof MetricOptionForm,
    value: any
  ) => {
    setTaskForm((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) =>
        m.id === metricId ? { ...m, [field]: value } : m
      ),
    }));
  };

  const handleAddCriticalZone = (metricId: string) => {
    setTaskForm((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) => {
        if (m.id !== metricId) return m;
        return {
          ...m,
          criticalZones: [
            ...m.criticalZones,
            {
              id: Math.random().toString(36).substring(2, 9),
              type: "ABOVE",
              value: "",
              label: "",
            },
          ],
        };
      }),
    }));
  };

  const handleRemoveCriticalZone = (metricId: string, zoneId: string) => {
    setTaskForm((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) => {
        if (m.id !== metricId) return m;
        return {
          ...m,
          criticalZones: m.criticalZones.filter((z) => z.id !== zoneId),
        };
      }),
    }));
  };

  const handleUpdateCriticalZone = (
    metricId: string,
    zoneId: string,
    field: "type" | "value" | "label",
    value: string
  ) => {
    setTaskForm((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) => {
        if (m.id !== metricId) return m;
        return {
          ...m,
          criticalZones: m.criticalZones.map((z) =>
            z.id === zoneId ? { ...z, [field]: value } : z
          ),
        };
      }),
    }));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!taskForm.title.trim()) {
      setModalError("Please provide a task title.");
      return;
    }

    if (taskForm.metrics.length === 0) {
      setModalError("At least one benchmark metric must be configured for the task.");
      return;
    }

    // Verify duplicate types
    const seen = new Set<string>();
    for (const m of taskForm.metrics) {
      if (seen.has(m.metricType)) {
        setModalError(`Duplicate metric type '${m.metricType}' found. Each metric type can only be added once per task.`);
        return;
      }
      seen.add(m.metricType);
    }

    try {
      const formattedMetrics = taskForm.metrics.map((m) => {
        const isRange =
          m.operator === "BETWEEN_INCLUSIVE" || m.operator === "BETWEEN_EXCLUSIVE";
        const singleVal = m.minValue || m.targetValue || m.maxValue;

        return {
          metricType: m.metricType,
          unit: m.unit,
          operator: m.operator,
          minValue: isRange
            ? m.minValue
            : m.operator === "GREATER_THAN_OR_EQUAL" || m.operator === "EXACT_MATCH"
            ? singleVal
            : null,
          maxValue: isRange
            ? m.maxValue
            : m.operator === "LESS_THAN_OR_EQUAL"
            ? singleVal
            : null,
          targetValue: singleVal,
          clinicalNotes: m.clinicalNotes,
          criticalZones: m.criticalZones,
        };
      });

      const payload = {
        action: "CREATE_TASK",
        title: taskForm.title.trim(),
        description: taskForm.description?.trim() || null,
        metrics: formattedMetrics,
      };

      const res = await fetch(`/api/${slug}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        `Health Task with ${formattedMetrics.length} benchmark metric${formattedMetrics.length > 1 ? "s" : ""} initialized!`
      );
      setIsTaskModalOpen(false);
      setTaskForm({
        title: "",
        description: "",
        metrics: [createInitialMetric("STEPS")],
      });
      loadData();
    } catch (err: any) {
      setModalError(err.message);
      toast.error(err.message || "Failed to create task.");
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (assignForm.scope === "PROGRAM" && !assignForm.classId) {
      setModalError("Please select a target program.");
      return;
    }
    if (assignForm.scope === "BATCH" && !assignForm.batchId) {
      setModalError("Please select a target batch.");
      return;
    }

    try {
      const [sh, sm] = assignForm.startTime.split(":").map(Number);
      const [eh, em] = assignForm.endTime.split(":").map(Number);
      let durationMins = eh * 60 + em - (sh * 60 + sm);
      if (durationMins <= 0) durationMins += 24 * 60;

      const payload = {
        action: "ASSIGN_TASK",
        taskId: selectedTaskId,
        batchId: assignForm.scope === "BATCH" ? assignForm.batchId : null,
        classId: assignForm.scope === "PROGRAM" ? assignForm.classId : null,
        startDate: assignForm.startDate,
        endDate: assignForm.endDate,
        startTime: assignForm.startTime,
        endTime: assignForm.endTime,
        durationMinutes: durationMins,
      };

      const res = await fetch(`/api/${slug}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        assignForm.scope === "PROGRAM"
          ? "Task assigned across entire program timetable schedule!"
          : "Task assigned to cohort batch and timetable schedule generated!"
      );
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
        subtitle="Configure physical activity and physiological benchmark thresholds with multi-metric support"
        tenantSlug={slug}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Action */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Health Metric Catalog
            </h2>
            <p className="text-xs text-slate-500">
              Tasks evaluated daily by the automated benchmark worker across assigned programs and batches
            </p>
          </div>
          <Button
            onClick={() => {
              setModalError("");
              setTaskForm({
                title: "",
                description: "",
                metrics: [createInitialMetric("STEPS")],
              });
              setIsTaskModalOpen(true);
            }}
            className="gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-sm"
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
                  className="glass-card rounded-2xl p-6 border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-orange-500/40 transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                            {task.title}
                          </h3>
                          <Badge variant="default" className="text-[10px] uppercase font-bold bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20">
                            {task.metricType}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {task.description || "Continuous telemetry benchmark tracking"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-mono text-orange-500 dark:text-orange-400 font-semibold block">
                          v{latestBm?.versionNumber || 1}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {task.frequency}
                        </span>
                      </div>
                    </div>

                    {/* Active Benchmark Box */}
                    {latestBm && (
                      <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-800 dark:border-orange-500/30 mb-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-orange-600 dark:text-orange-300 flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                            <span>Benchmark Rule:</span>
                          </span>
                          <span className="font-mono text-orange-600 dark:text-orange-300 font-bold">
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
                          <div className="mt-2.5 pt-2 border-t border-orange-200/60 dark:border-orange-500/20">
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

                    {/* Active Assignments: Programs & Batches */}
                    <div className="mb-4">
                      <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1.5">
                        Assigned Cohorts & Programs ({task.assignments.length}):
                      </span>
                      {task.assignments.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {task.assignments.map((as) => (
                            <span
                              key={as.id}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                            >
                              {as.class ? (
                                <>
                                  <GraduationCap className="w-3.5 h-3.5 text-orange-500" />
                                  <span>Program: {as.class.name}</span>
                                </>
                              ) : (
                                <>
                                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                                  <span>
                                    {as.batch?.class?.name ? `${as.batch.class.name} → ` : ""}
                                    {as.batch?.name || "Cohort"}
                                  </span>
                                </>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Not currently assigned to any program or batch
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
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm"
                    >
                      Assign Task
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="lg:col-span-2 glass-card rounded-2xl p-12 text-center text-xs text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800">
              No tasks created yet. Click &quot;Create Health Task&quot; above to configure your first activity benchmark.
            </div>
          )}
        </div>
      </main>

      {/* Modal 1: Create Health Task (Multi-Metric Support, Width 4XL) */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Create Health Task & Benchmarks"
        description="Configure task details and add one or more physiological benchmark metrics with dedicated alert zones"
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateTask} className="space-y-5">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}
          {modalSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{modalSuccess}</span>
            </div>
          )}

          {/* Top: Title & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Task Title *
              </label>
              <Input
                required
                placeholder="e.g. Walking, Sprint Conditioning, Morning Vital Check"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description / Purpose (Optional)
              </label>
              <Input
                placeholder="e.g. Daily ambulatory cardio target with heart rate monitoring"
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Metric Options Section Header */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" />
                <span>Configured Benchmark Metrics ({taskForm.metrics.length})</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                A task can measure multiple metrics simultaneously (e.g. Steps + Heart Rate during walking)
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddMetricOption}
              disabled={taskForm.metrics.length >= ALL_METRIC_TYPES.length}
              className="gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Metric Option</span>
            </Button>
          </div>

          {/* Metric Options List */}
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {taskForm.metrics.map((metric, idx) => {
              const otherSelectedTypes = new Set(
                taskForm.metrics.filter((m) => m.id !== metric.id).map((m) => m.metricType)
              );

              return (
                <div
                  key={metric.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 shadow-sm space-y-3.5"
                >
                  {/* Metric Card Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        Metric Option #{idx + 1}: {metric.metricType.replace(/_/g, " ")}
                      </span>
                    </div>

                    {taskForm.metrics.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveMetricOption(metric.id)}
                        className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Metric</span>
                      </Button>
                    )}
                  </div>

                  {/* Metric Type & Unit Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Metric Type *
                      </label>
                      <select
                        value={metric.metricType}
                        onChange={(e) => handleMetricTypeChange(metric.id, e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                      >
                        {ALL_METRIC_TYPES.map((t) => (
                          <option
                            key={t.value}
                            value={t.value}
                            disabled={otherSelectedTypes.has(t.value)}
                          >
                            {t.label} {otherSelectedTypes.has(t.value) ? "(Already Added)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Measurement Unit *
                      </label>
                      <Input
                        required
                        value={metric.unit}
                        onChange={(e) =>
                          handleUpdateMetricField(metric.id, "unit", e.target.value)
                        }
                        className="h-9 text-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Benchmark Operator & Threshold Values */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Comparison Operator *
                      </label>
                      <select
                        value={metric.operator}
                        onChange={(e) =>
                          handleUpdateMetricField(metric.id, "operator", e.target.value)
                        }
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                      >
                        <option value="GREATER_THAN_OR_EQUAL">&gt;= (Greater than or equal to threshold)</option>
                        <option value="LESS_THAN_OR_EQUAL">&lt;= (Less than or equal to threshold)</option>
                        <option value="BETWEEN_INCLUSIVE">BETWEEN (Inclusive range [min, max])</option>
                        <option value="EXACT_MATCH">EXACT MATCH (= Target)</option>
                      </select>
                    </div>

                    {/* Dynamic Inputs Based on Operator */}
                    {metric.operator === "BETWEEN_INCLUSIVE" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Min Value (Lower Bound) *
                          </label>
                          <Input
                            type="number"
                            required
                            placeholder="e.g. 90"
                            value={metric.minValue}
                            onChange={(e) =>
                              handleUpdateMetricField(metric.id, "minValue", e.target.value)
                            }
                            className="h-8 text-xs font-semibold"
                          />
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            Lower bound ({metric.unit})
                          </span>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Max Value (Upper Bound) *
                          </label>
                          <Input
                            type="number"
                            required
                            placeholder="e.g. 120"
                            value={metric.maxValue}
                            onChange={(e) =>
                              handleUpdateMetricField(metric.id, "maxValue", e.target.value)
                            }
                            className="h-8 text-xs font-semibold"
                          />
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            Upper bound ({metric.unit})
                          </span>
                        </div>
                      </div>
                    ) : metric.operator === "EXACT_MATCH" ? (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Target Value (= Exact Match) *
                        </label>
                        <Input
                          type="number"
                          required
                          placeholder="e.g. 8000"
                          value={metric.minValue}
                          onChange={(e) => {
                            handleUpdateMetricField(metric.id, "minValue", e.target.value);
                            handleUpdateMetricField(metric.id, "targetValue", e.target.value);
                          }}
                          className="h-8 text-xs font-semibold"
                        />
                        <span className="text-[10px] text-orange-400 font-medium mt-0.5 block">
                          Single value: Telemetry must equal this exact target ({metric.unit}).
                        </span>
                      </div>
                    ) : metric.operator === "GREATER_THAN_OR_EQUAL" ? (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Minimum Threshold Value (&gt;=) *
                        </label>
                        <Input
                          type="number"
                          required
                          placeholder="e.g. 8000"
                          value={metric.minValue}
                          onChange={(e) => {
                            handleUpdateMetricField(metric.id, "minValue", e.target.value);
                            handleUpdateMetricField(metric.id, "targetValue", e.target.value);
                          }}
                          className="h-8 text-xs font-semibold"
                        />
                        <span className="text-[10px] text-orange-400 font-medium mt-0.5 block">
                          Single value: Telemetry must meet or exceed this target ({metric.unit}).
                        </span>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Maximum Threshold Value (&lt;=) *
                        </label>
                        <Input
                          type="number"
                          required
                          placeholder="e.g. 75"
                          value={metric.maxValue || metric.minValue}
                          onChange={(e) => {
                            handleUpdateMetricField(metric.id, "maxValue", e.target.value);
                            handleUpdateMetricField(metric.id, "minValue", e.target.value);
                            handleUpdateMetricField(metric.id, "targetValue", e.target.value);
                          }}
                          className="h-8 text-xs font-semibold"
                        />
                        <span className="text-[10px] text-orange-400 font-medium mt-0.5 block">
                          Single value: Telemetry must remain at or below this ceiling ({metric.unit}).
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Clinical / Coaching Guidelines
                      </label>
                      <Input
                        placeholder="e.g. Endorsed by youth health board for active aerobic session"
                        value={metric.clinicalNotes}
                        onChange={(e) =>
                          handleUpdateMetricField(metric.id, "clinicalNotes", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Optional Critical Alert Safety Zones */}
                  <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span className="text-[11px] font-bold uppercase text-rose-800 dark:text-rose-300">
                          Critical Safety Alert Zones for {metric.metricType}
                        </span>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddCriticalZone(metric.id)}
                        className="h-6 text-[10px] font-bold border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/40 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Critical Zone
                      </Button>
                    </div>

                    {metric.criticalZones && metric.criticalZones.length > 0 ? (
                      <div className="space-y-2">
                        {metric.criticalZones.map((zone) => (
                          <div
                            key={zone.id}
                            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                          >
                            <div className="w-full sm:w-40 shrink-0">
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                                Condition
                              </label>
                              <select
                                value={zone.type}
                                onChange={(e) =>
                                  handleUpdateCriticalZone(
                                    metric.id,
                                    zone.id,
                                    "type",
                                    e.target.value as "BELOW" | "ABOVE"
                                  )
                                }
                                className="w-full h-7 px-2 text-xs font-bold rounded border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200"
                              >
                                <option value="BELOW">CRITICAL BELOW (&lt;)</option>
                                <option value="ABOVE">CRITICAL ABOVE (&gt;)</option>
                              </select>
                            </div>

                            <div className="w-full sm:w-32 shrink-0">
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                                Threshold ({metric.unit}) *
                              </label>
                              <Input
                                type="number"
                                placeholder="Value"
                                value={zone.value}
                                onChange={(e) =>
                                  handleUpdateCriticalZone(metric.id, zone.id, "value", e.target.value)
                                }
                                className="h-7 text-xs font-semibold"
                                required
                              />
                            </div>

                            <div className="flex-1">
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                                Label
                              </label>
                              <Input
                                placeholder="e.g. Dangerously High Alert"
                                value={zone.label}
                                onChange={(e) =>
                                  handleUpdateCriticalZone(metric.id, zone.id, "label", e.target.value)
                                }
                                className="h-7 text-xs"
                              />
                            </div>

                            <div className="self-end sm:self-center pt-2 sm:pt-4">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveCriticalZone(metric.id, zone.id)}
                                className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 border border-dashed border-rose-200 dark:border-rose-900/40 rounded text-[11px] text-rose-600/80 dark:text-rose-400/80">
                        No critical safety alert zones configured for this metric.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold"
            >
              Save Health Task & Benchmarks
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Assign Task to Program or Batch */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Health Task to Program or Batch"
        description="Creates scheduled evaluation timetable entries across effective dates"
      >
        <form onSubmit={handleAssignTask} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}
          {modalSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{modalSuccess}</span>
            </div>
          )}

          {/* Scope Selector: Whole Program vs Specific Batch */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Assignment Scope *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAssignForm((prev) => ({ ...prev, scope: "PROGRAM" }))}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  assignForm.scope === "PROGRAM"
                    ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200 font-bold"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                }`}
              >
                <GraduationCap className={`w-4 h-4 mt-0.5 shrink-0 ${assignForm.scope === "PROGRAM" ? "text-orange-600" : "text-slate-400"}`} />
                <div>
                  <span className="text-xs font-extrabold block">Entire Program</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    Assigns task to all batches within the selected program
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAssignForm((prev) => ({ ...prev, scope: "BATCH" }))}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  assignForm.scope === "BATCH"
                    ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200 font-bold"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Layers className={`w-4 h-4 mt-0.5 shrink-0 ${assignForm.scope === "BATCH" ? "text-orange-600" : "text-slate-400"}`} />
                <div>
                  <span className="text-xs font-extrabold block">Specific Batch</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    Assigns task to one dedicated cohort batch
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Target Selector */}
          {assignForm.scope === "PROGRAM" ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Target Program *
              </label>
              <select
                required
                value={assignForm.classId}
                onChange={(e) =>
                  setAssignForm((prev) => ({ ...prev, classId: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.academicPeriod})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Target Cohort Batch *
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
          )}

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
              className="bg-slate-50 dark:bg-slate-900/60 font-semibold text-orange-600 dark:text-orange-300 border-orange-200 dark:border-orange-800 dark:border-orange-800/50 cursor-not-allowed"
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
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold"
            >
              Generate Timetable
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
