"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  Filter,
  Users,
  Search,
  Sparkles,
  Info,
} from "lucide-react";
import { TableToolbar, TablePagination } from "@/components/ui/table-pagination";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface CustomField {
  id: string;
  label: string;
  fieldKey: string;
  fieldType: string;
  isRequired: boolean;
}

interface UserType {
  id: string;
  name: string;
  slug: string;
  customFields?: CustomField[];
}

interface RegistrationRequest {
  id: string;
  tenantId: string;
  userTypeId: string;
  fullName: string;
  email: string;
  phone?: string;
  profileData?: Record<string, any>;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  userType: UserType;
}

export default function TenantRegistrationsPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [userTypeFilter, setUserTypeFilter] = useState("ALL");

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Review Modal State
  const [activeModalRequest, setActiveModalRequest] = useState<RegistrationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Origin for links
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search.trim()) qParams.append("search", search.trim());
      if (statusFilter !== "ALL") qParams.append("status", statusFilter);
      if (userTypeFilter !== "ALL") qParams.append("userTypeId", userTypeFilter);

      const res = await fetch(`/api/${slug}/users/registrations?${qParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load registration applications.");
      const data = await res.json();

      setRequests(data.requests || []);
      setUserTypes(data.userTypes || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load registrations.");
    } finally {
      setLoading(false);
    }
  }, [slug, page, limit, search, statusFilter, userTypeFilter]);

  useEffect(() => {
    if (slug) {
      fetchRegistrations();
    }
  }, [fetchRegistrations, slug]);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Registration link copied to clipboard!");
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2500);
  };

  const handleOpenReviewModal = (req: RegistrationRequest) => {
    setActiveModalRequest(req);
    setReviewNotes(req.reviewNotes || "");
  };

  const handleApproveReject = async (action: "APPROVE" | "REJECT") => {
    if (!activeModalRequest) return;
    setSubmittingAction(true);

    try {
      const res = await fetch(`/api/${slug}/users/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: activeModalRequest.id,
          action,
          reviewNotes: reviewNotes.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Failed to ${action.toLowerCase()} application.`);

      toast.success(json.message);
      setActiveModalRequest(null);
      fetchRegistrations();
    } catch (err: any) {
      toast.error(err.message || "Error processing request.");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              Self-Serve Onboarding
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Registration Links & Queue
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            Public Registrations & Applicant Approvals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Distribute company-specific registration URLs, receive applicant profiles, and review/approve them into official members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${slug}/users`}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-slate-400" />
            <span>Active Users Directory</span>
          </Link>
        </div>
      </div>

      {/* Share Registration Links Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-teal-500" />
              <span>Shareable Registration Portals</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Each user type renders its own customized set of fields configured for this organization
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* General Link Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm hover:border-teal-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  Universal Portal
                </span>
                <span className="text-[11px] text-slate-400">All Roles</span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2">
                General Registration Link
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Allows applicant to pick from any available member type on arrival.
              </p>

              <div className="mt-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
                {origin ? `${origin}/${slug}/register` : `/${slug}/register`}
              </div>
            </div>

            <div className="pt-4 flex items-center gap-2 mt-2">
              <Button
                onClick={() =>
                  handleCopyLink(
                    `${origin || ""}/${slug}/register`,
                    "general"
                  )
                }
                className="flex-1 h-9 rounded-xl text-xs font-bold bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 gap-1.5"
              >
                {copiedId === "general" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </Button>

              <a
                href={`/${slug}/register`}
                target="_blank"
                rel="noreferrer"
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors"
                title="Preview Outer Form"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* UserType Specific Cards */}
          {userTypes.map((ut) => {
            const linkUrl = `${origin || ""}/${slug}/register?type=${ut.slug}`;
            const fieldCount = ut.customFields?.length || 0;

            return (
              <div
                key={ut.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm hover:border-teal-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {ut.name} Link
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {fieldCount} custom fields
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2">
                    {ut.name} Direct Registration
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Preselects {ut.name} role and renders dynamic fields configured for {ut.name}.
                  </p>

                  <div className="mt-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    {linkUrl}
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-2 mt-2">
                  <Button
                    onClick={() => handleCopyLink(linkUrl, ut.id)}
                    className="flex-1 h-9 rounded-xl text-xs font-bold bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 gap-1.5"
                  >
                    {copiedId === ut.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </Button>

                  <a
                    href={`/${slug}/register?type=${ut.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors"
                    title="Preview Outer Form"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Registrations List Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden flex flex-col">
        {/* Dynamic Toolbar */}
        <TableToolbar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search applicant name or email..."
          limit={limit}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          totalCount={totalCount}
          recordLabel="applications"
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
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={userTypeFilter}
                onChange={(e) => {
                  setUserTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="ALL">All User Types</option>
                {userTypes.map((ut) => (
                  <option key={ut.id} value={ut.id}>
                    {ut.name}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        {/* Table Body */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-slate-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-teal-500" />
              <span className="text-xs">Loading registration submissions...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <UserPlus className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No registration applications found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Share your public registration link with students, coaches, or staff to start collecting applications.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Requested Role</th>
                  <th className="py-3 px-4">Custom Data</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {requests.map((r) => {
                  const customFieldKeys = r.profileData ? Object.keys(r.profileData) : [];

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{r.fullName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{r.email}</span>
                          {r.phone && (
                            <>
                              <span>•</span>
                              <span>{r.phone}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                          {r.userType?.name || "Member"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {customFieldKeys.length > 0 ? (
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {customFieldKeys.length} fields completed
                            </span>
                          ) : (
                            <span className="italic text-slate-400">None provided</span>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatDate(r.createdAt)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {r.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                        {r.status === "APPROVED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </span>
                        )}
                        {r.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenReviewModal(r)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Dynamic Pagination */}
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

      {/* Application Review & Approval Modal */}
      {activeModalRequest && (
        <Modal
          isOpen={Boolean(activeModalRequest)}
          onClose={() => setActiveModalRequest(null)}
          title={`Review Application: ${activeModalRequest.fullName}`}
          description={`Application for ${activeModalRequest.userType?.name} membership submitted on ${formatDate(
            activeModalRequest.createdAt
          )}`}
          maxWidth="xl"
        >
          <div className="space-y-5">
            {/* Applicant Base Information */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-2 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Primary Contact Information
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400">Full Legal Name:</span>{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeModalRequest.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Email Address:</span>{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeModalRequest.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Phone:</span>{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeModalRequest.phone || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Target User Type:</span>{" "}
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {activeModalRequest.userType?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Custom Fields Values */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                <span>Submitted Custom Fields for {activeModalRequest.userType?.name}</span>
              </h4>

              {activeModalRequest.userType?.customFields &&
              activeModalRequest.userType.customFields.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900/60 overflow-hidden">
                  {activeModalRequest.userType.customFields.map((field) => {
                    const submittedVal =
                      activeModalRequest.profileData?.[field.fieldKey];

                    return (
                      <div
                        key={field.id}
                        className="p-3 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {field.label}
                          </span>
                          <span className="ml-1.5 text-[10px] font-mono text-slate-400">
                            ({field.fieldKey})
                          </span>
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {submittedVal !== undefined &&
                          submittedVal !== null &&
                          submittedVal !== "" ? (
                            typeof submittedVal === "boolean" ? (
                              submittedVal ? "Yes" : "No"
                            ) : (
                              String(submittedVal)
                            )
                          ) : (
                            <span className="text-slate-400 italic font-normal">
                              Not answered
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No custom fields defined for this user type.
                </p>
              )}
            </div>

            {/* Review Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Administrator Remarks / Rejection Reason
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Optional notes or instructions for the applicant..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                {activeModalRequest.status !== "PENDING" && (
                  <span className="text-xs text-slate-400">
                    Status: <span className="font-bold">{activeModalRequest.status}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalRequest(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>

                {activeModalRequest.status === "PENDING" && (
                  <>
                    <Button
                      type="button"
                      disabled={submittingAction}
                      onClick={() => handleApproveReject("REJECT")}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </Button>

                    <Button
                      type="button"
                      disabled={submittingAction}
                      onClick={() => handleApproveReject("APPROVE")}
                      className="bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold gap-1.5 shadow-md"
                    >
                      {submittingAction ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Approve & Create User</span>
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
