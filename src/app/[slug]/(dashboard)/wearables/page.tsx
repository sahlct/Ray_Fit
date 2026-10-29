"use client";

import React, { useState, useEffect, use } from "react";
import {
  Watch,
  Plus,
  Zap,
  Battery,
  BatteryCharging,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Unlink,
  Link as LinkIcon,
  Activity,
  Radio,
  Sparkles,
} from "lucide-react";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/sonner";
import { formatDate, formatTime } from "@/lib/utils";

interface DeviceItem {
  id: string;
  deviceUuid: string;
  vendorName: string;
  modelNumber: string | null;
  batteryLevel: number | null;
  status: string;
  lastSyncAt: string | null;
  student: { id: string; fullName: string; email: string } | null;
  measurements: {
    id: string;
    metricType: string;
    numericVal: number;
    unit: string;
    recordedAt: string;
  }[];
}

export default function WearablesFleetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [unpairedStudents, setUnpairedStudents] = useState<{ id: string; fullName: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Register Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    deviceUuid: "",
    vendorName: "RayBand Pro",
    modelNumber: "RB-2026-X",
  });

  // Pair Modal
  const [isPairOpen, setIsPairOpen] = useState(false);
  const [pairDeviceId, setPairDeviceId] = useState("");
  const [pairStudentId, setPairStudentId] = useState("");

  // Ingestion Simulator State
  const [simDeviceUuid, setSimDeviceUuid] = useState("");
  const [simMetric, setSimMetric] = useState("STEPS");
  const [simValue, setSimValue] = useState("9500");
  const [simUnit, setSimUnit] = useState("steps");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simFeedback, setSimFeedback] = useState("");

  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [wRes, uRes] = await Promise.all([
        fetch(`/api/${slug}/wearables`),
        fetch(`/api/${slug}/users`),
      ]);
      const wData = await wRes.json();
      const uData = await uRes.json();

      if (wData.devices) {
        setDevices(wData.devices);
        if (wData.devices.length > 0 && !simDeviceUuid) {
          setSimDeviceUuid(wData.devices[0].deviceUuid);
        }
      }

      if (uData.users) {
        setUnpairedStudents(
          uData.users.filter(
            (u: any) =>
              u.userType?.slug === "student" &&
              (!u.assignedDevices || u.assignedDevices.length === 0)
          )
        );
      }
    } catch (err) {
      console.error("Failed to load wearables:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  // Handle Register Device
  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    try {
      const res = await fetch(`/api/${slug}/wearables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REGISTER_DEVICE", ...regForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalSuccess("Device registered in fleet!");
      setTimeout(() => {
        setIsRegisterOpen(false);
        setModalSuccess("");
        loadData();
      }, 1000);
    } catch (err: any) {
      setModalError(err.message);
    }
  };

  // Handle Pair Device
  const handlePairDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    try {
      const res = await fetch(`/api/${slug}/wearables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PAIR_DEVICE",
          deviceId: pairDeviceId,
          studentId: pairStudentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalSuccess("Wearable band paired to student!");
      setTimeout(() => {
        setIsPairOpen(false);
        setModalSuccess("");
        loadData();
      }, 1000);
    } catch (err: any) {
      setModalError(err.message);
    }
  };

  const [unpairCandidate, setUnpairCandidate] = useState<{ id: string; name: string } | null>(null);
  const [isUnpairing, setIsUnpairing] = useState(false);

  // Handle Unpair Device
  const confirmUnpair = async () => {
    if (!unpairCandidate) return;
    setIsUnpairing(true);
    try {
      const res = await fetch(`/api/${slug}/wearables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UNPAIR_DEVICE", deviceId: unpairCandidate.id }),
      });
      if (!res.ok) {
        toast.error("Failed to unpair device.");
        return;
      }
      toast.success(`Unpaired smart band from ${unpairCandidate.name}.`);
      setUnpairCandidate(null);
      loadData();
    } catch {
      toast.error("Network error while unpairing device.");
    } finally {
      setIsUnpairing(false);
    }
  };

  // Live Telemetry Simulator Handler
  const handleSimulateSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimFeedback("");
    try {
      const res = await fetch(`/api/${slug}/wearables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SIMULATE_TELEMETRY",
          deviceUuid: simDeviceUuid,
          metricType: simMetric,
          value: simValue,
          unit: simUnit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSimFeedback(
        `✓ Sync received: ${Number(simValue).toLocaleString()} ${simUnit} ingested for ${simDeviceUuid}. Benchmark evaluation recalculated!`
      );
      loadData();
    } catch (err: any) {
      setSimFeedback(`Error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const setRandomValue = (metric: string) => {
    if (metric === "STEPS") {
      setSimValue(String(Math.floor(Math.random() * 5000) + 7000));
      setSimUnit("steps");
    } else if (metric === "HEART_RATE") {
      setSimValue(String(Math.floor(Math.random() * 25) + 60));
      setSimUnit("bpm");
    } else if (metric === "BLOOD_PRESSURE_SYSTOLIC") {
      setSimValue(String(Math.floor(Math.random() * 30) + 95));
      setSimUnit("mmHg");
    }
    setSimMetric(metric);
  };

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title="Wearables Fleet & Telemetry Ingestion"
        subtitle="Manage hardware smart band inventory, student device mappings, and sync status"
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Registered Wearable Devices
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              BLE and Webhook synchronization endpoints
            </p>
          </div>
          <Button
            onClick={() => setIsRegisterOpen(true)}
            className="gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Band</span>
          </Button>
        </div>

        {/* Live Simulator Panel */}
        <div className="glass-card rounded-2xl p-6 border-teal-500/30 bg-gradient-to-r from-teal-500/10 via-slate-50 dark:via-slate-900/70 to-cyan-500/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-500/20">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Live Wearable Telemetry Ingestion Simulator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Simulate hardware synchronization events to test the deterministic evaluation engine
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
              Vendor Ingestion Layer Active
            </span>
          </div>

          <form onSubmit={handleSimulateSync} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Select Active Device
              </label>
              <select
                value={simDeviceUuid}
                onChange={(e) => setSimDeviceUuid(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.deviceUuid}>
                    {d.deviceUuid} ({d.student?.fullName || "Unpaired"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Metric
              </label>
              <select
                value={simMetric}
                onChange={(e) => setRandomValue(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500"
              >
                <option value="STEPS">Steps</option>
                <option value="HEART_RATE">Heart Rate (Pulse)</option>
                <option value="BLOOD_PRESSURE_SYSTOLIC">Blood Pressure (Systolic)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Recorded Value
              </label>
              <Input
                type="number"
                required
                value={simValue}
                onChange={(e) => setSimValue(e.target.value)}
                className="text-xs h-10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Unit
              </label>
              <Input
                required
                value={simUnit}
                onChange={(e) => setSimUnit(e.target.value)}
                className="text-xs h-10"
              />
            </div>

            <Button
              type="submit"
              disabled={isSimulating}
              className="h-10 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs gap-2 shadow-md cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>{isSimulating ? "Ingesting..." : "Simulate Sync"}</span>
            </Button>
          </form>

          {simFeedback && (
            <div className="mt-3 p-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-xs text-teal-700 dark:text-teal-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span>{simFeedback}</span>
            </div>
          )}
        </div>

        {/* Fleet Table */}
        <div className="glass-card rounded-2xl border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 w-14">#</th>
                  <th className="py-3.5 px-6">Device UUID</th>
                  <th className="py-3.5 px-6">Hardware & Model</th>
                  <th className="py-3.5 px-6">Assigned Student</th>
                  <th className="py-3.5 px-6">Battery</th>
                  <th className="py-3.5 px-6">Last Synchronized</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                      Loading wearable fleet...
                    </td>
                  </tr>
                ) : devices.length > 0 ? (
                  devices.map((device, idx) => (
                    <tr
                      key={device.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                        #{idx + 1}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {device.deviceUuid}
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {device.vendorName}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Model: {device.modelNumber || "Standard"}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {device.student ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold text-xs border border-teal-200 dark:border-teal-500/30">
                            <LinkIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            <span>{device.student.fullName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Unpaired
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs font-semibold">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                          <Battery className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                          <span>{device.batteryLevel ?? 100}%</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-400">
                        {device.lastSyncAt ? (
                          <span>
                            {formatDate(device.lastSyncAt)} {formatTime(device.lastSyncAt)}
                          </span>
                        ) : (
                          <span className="italic text-slate-500">Never</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {device.student ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUnpairCandidate({ id: device.id, name: device.student?.fullName || device.deviceUuid })}
                            className="text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/15"
                          >
                            <Unlink className="w-3.5 h-3.5 mr-1" />
                            Unpair
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setPairDeviceId(device.id);
                              setIsPairOpen(true);
                            }}
                            className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold"
                          >
                            <LinkIcon className="w-3.5 h-3.5 mr-1" />
                            Pair Student
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      No wearable devices registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal: Register Device */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Wearable Device"
        description="Add a hardware smart band to the school telemetry fleet"
      >
        <form onSubmit={handleRegisterDevice} className="space-y-4">
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
              Device Serial / Hardware UUID *
            </label>
            <Input
              required
              placeholder="e.g. RF-BAND-XX404"
              value={regForm.deviceUuid}
              onChange={(e) =>
                setRegForm((prev) => ({ ...prev, deviceUuid: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vendor / Brand *
              </label>
              <select
                value={regForm.vendorName}
                onChange={(e) =>
                  setRegForm((prev) => ({ ...prev, vendorName: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                <option value="RayBand Pro">RayBand Pro</option>
                <option value="Fitbit Charge">Fitbit Charge</option>
                <option value="Garmin Vivosmart">Garmin Vivosmart</option>
                <option value="Generic BLE Smartband">Generic BLE Smartband</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Model Number
              </label>
              <Input
                placeholder="e.g. RB-2026-X"
                value={regForm.modelNumber}
                onChange={(e) =>
                  setRegForm((prev) => ({ ...prev, modelNumber: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRegisterOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
            >
              Register Device
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Pair Student */}
      <Modal
        isOpen={isPairOpen}
        onClose={() => setIsPairOpen(false)}
        title="Pair Wearable Device with Student"
        description="Links telemetry ingestion directly to student health evaluation records"
      >
        <form onSubmit={handlePairDevice} className="space-y-4">
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
              value={pairStudentId}
              onChange={(e) => setPairStudentId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 text-sm font-medium"
            >
              <option value="">Select unassigned student...</option>
              {unpairedStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPairOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
            >
              Confirm Pairing
            </Button>
          </div>
        </form>
      </Modal>

      {/* Unpair Confirmation Modal */}
      <Modal
        isOpen={Boolean(unpairCandidate)}
        onClose={() => setUnpairCandidate(null)}
        title="Unpair Smart Wearable"
        description="Disconnect wearable device from student profile"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-white">
                Unpair device from {unpairCandidate?.name}?
              </p>
              <p className="mt-1">
                The smart band will be returned to the unassigned hardware fleet and future synchronization telemetry will stop attributing to this student.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUnpairCandidate(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUnpair}
              disabled={isUnpairing}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              {isUnpairing ? "Unpairing..." : "Confirm & Unpair Device"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
