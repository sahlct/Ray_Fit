"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  RefreshCw,
  Search,
  DollarSign,
  Receipt,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { TableToolbar, TablePagination } from "@/components/ui/table-pagination";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface SubscriptionPayment {
  id: string;
  amount: number;
  planTier: string;
  billingCycle: string;
  paymentMethod: string;
  transactionRef: string;
  validUntil: string;
  status: string;
  createdAt: string;
}

interface TenantSubscription {
  id: string;
  name: string;
  slug: string;
  contactEmail?: string;
  status: string;
  subscriptionPlan: string;
  createdAt: string;
  _count?: {
    users: number;
    wearableDevices: number;
  };
  subscriptionPayments?: SubscriptionPayment[];
}

export default function SuperAdminSubscriptionsPage() {
  const [tenants, setTenants] = useState<TenantSubscription[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");

  // Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantSubscription | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Payment
  const [formData, setFormData] = useState({
    tenantId: "",
    amount: "299",
    planTier: "STARTER",
    billingCycle: "MONTHLY",
    paymentMethod: "STRIPE",
    durationMonths: "1",
    transactionRef: "",
    notes: "",
  });

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (planFilter !== "ALL") params.append("plan", planFilter);

      const res = await fetch(`/api/admin/subscriptions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load subscription data");
      const data = await res.json();
      setTenants(data.tenants || []);
      setRecentPayments(data.recentPayments || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to fetch subscriptions.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, planFilter]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const openPaymentModal = (tenant?: TenantSubscription) => {
    const t = tenant || tenants[0];
    setSelectedTenant(t || null);

    const defaultTier = t?.subscriptionPlan ? t.subscriptionPlan.toUpperCase() : "STARTER";
    let defaultAmount = "299";
    if (defaultTier === "GROWTH") defaultAmount = "699";
    if (defaultTier === "ENTERPRISE") defaultAmount = "1499";

    setFormData({
      tenantId: t ? t.id : "",
      amount: defaultAmount,
      planTier: ["STARTER", "GROWTH", "ENTERPRISE", "CUSTOM"].includes(defaultTier)
        ? defaultTier
        : "STARTER",
      billingCycle: "MONTHLY",
      paymentMethod: "CARD",
      durationMonths: "1",
      transactionRef: `PAY-${Date.now().toString(36).toUpperCase()}`,
      notes: `Subscription payment for ${t ? t.name : "Company"}`,
    });
    setIsPayModalOpen(true);
  };

  const handlePlanTierChange = (tier: string) => {
    let amount = formData.amount;
    if (tier === "STARTER") amount = "299";
    else if (tier === "GROWTH") amount = "699";
    else if (tier === "ENTERPRISE") amount = "1499";
    else if (tier === "CUSTOM") amount = "2499";

    setFormData((prev) => ({
      ...prev,
      planTier: tier,
      amount,
    }));
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenantId) {
      toast.error("Please select a company tenant.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Payment recording failed");

      toast.success(json.message || "Subscription payment recorded successfully!");
      setIsPayModalOpen(false);
      fetchSubscriptions();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              Multi-Tenant Monetization
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Active Billing & Invoicing
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            Company Subscription Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure tenant licensing tiers, record recurring renewals, and monitor global SaaS revenue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            onClick={() => openPaymentModal()}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs gap-2 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Subscription Payment</span>
          </Button>
        </div>
      </div>

      {/* Plan Tiers Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Starter Tier</span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">$299/mo</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">100 Students</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Up to 50 active wearables, core tracking</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Growth Tier</span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-teal-500/10 text-teal-500">$699/mo</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">500 Students</div>
          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">250 smart bands, dynamic benchmarks</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Enterprise</span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-purple-500/10 text-purple-500">$1,499/mo</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">Unlimited</div>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Custom domain, SLA support, live streaming</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Accounts</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{totalCount} Tenants</div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Across all global billing cycles</p>
        </div>
      </div>

      {/* Subscriptions Table Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden flex flex-col">
        {/* Dynamic Table Toolbar with Search and Limit changer */}
        <TableToolbar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search company, slug or billing email..."
          limit={limit}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          totalCount={totalCount}
          recordLabel="companies"
          filters={
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="ALL">All Plans</option>
                <option value="STARTER">Starter</option>
                <option value="GROWTH">Growth</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          }
        />

        {/* Table Body */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-slate-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-teal-500" />
              <span className="text-xs">Loading subscription accounts...</span>
            </div>
          ) : tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No subscription accounts found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Try clearing search terms or status filters, or record a new subscription payment.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Organization / School</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Active Capacity</th>
                  <th className="py-3 px-4">Last Payment</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tenants.map((t) => {
                  const lastPayment = t.subscriptionPayments && t.subscriptionPayments[0];
                  const planUpper = (t.subscriptionPlan || "starter").toUpperCase();

                  let planBadgeColor =
                    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
                  if (planUpper === "GROWTH")
                    planBadgeColor =
                      "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20";
                  if (planUpper === "ENTERPRISE")
                    planBadgeColor =
                      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>/{t.slug}</span>
                          {t.contactEmail && (
                            <>
                              <span>•</span>
                              <span>{t.contactEmail}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${planBadgeColor}`}
                        >
                          {planUpper}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            t.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px]">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {t._count?.users || 0}
                          </span>{" "}
                          <span className="text-slate-400">Users</span>
                          <span className="mx-1 text-slate-300 dark:text-slate-700">•</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {t._count?.wearableDevices || 0}
                          </span>{" "}
                          <span className="text-slate-400">Bands</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {lastPayment ? (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              ${lastPayment.amount}{" "}
                              <span className="text-[10px] font-normal text-slate-400">
                                ({lastPayment.paymentMethod})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {formatDate(lastPayment.createdAt)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No payments logged</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {lastPayment ? (
                          <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            {formatDate(lastPayment.validUntil)}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openPaymentModal(t)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition-all cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay / Renew</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Dynamic Table Pagination at bottom */}
        <TablePagination
          page={page}
          totalPages={Math.ceil(totalCount / limit) || 1}
          onPageChange={(p) => setPage(p)}
          limit={limit}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          totalCount={totalCount}
        />
      </div>

      {/* Recent Payments Feed */}
      {recentPayments.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-500" />
                <span>Recent Global Subscription Invoices</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audit record of multi-tenant renewals and payments
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {recentPayments.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 font-bold text-xs">
                    $
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {p.tenant?.name || "Company Tenant"}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Ref: {p.transactionRef}</span>
                      <span>•</span>
                      <span>{p.planTier} Plan</span>
                      <span>•</span>
                      <span>{p.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    +${p.amount}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {formatDate(p.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment Interactive Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Record Company Subscription Payment"
        description="Process a new subscription renewal or payment receipt for an organization."
        maxWidth="lg"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Company / School <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.tenantId}
              onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              required
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Choose Organization --</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (/{t.slug}) - Current: {t.subscriptionPlan}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Plan Tier
              </label>
              <select
                value={formData.planTier}
                onChange={(e) => handlePlanTierChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="STARTER">Starter ($299)</option>
                <option value="GROWTH">Growth ($699)</option>
                <option value="ENTERPRISE">Enterprise ($1,499)</option>
                <option value="CUSTOM">Custom Plan ($2,499)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Amount ($) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Billing Cycle
              </label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="STRIPE">Stripe Gateway</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="WIRE">Wire Transfer</option>
                <option value="ACH">ACH Direct Debit</option>
                <option value="CASH">Cash / Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Duration (Months)
              </label>
              <input
                type="number"
                min="1"
                max="36"
                value={formData.durationMonths}
                onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Invoice / Transaction Reference
            </label>
            <input
              type="text"
              value={formData.transactionRef}
              onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
              placeholder="e.g. INV-2026-001 or TXN-99812"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Internal Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Payment remarks or invoice references..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Activate Plan</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
