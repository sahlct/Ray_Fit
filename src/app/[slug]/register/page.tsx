"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CustomFieldDef {
  id: string;
  label: string;
  fieldKey: string;
  fieldType: "TEXT" | "NUMBER" | "DATE" | "DROPDOWN" | "BOOLEAN" | "TEXTAREA";
  isRequired: boolean;
  placeholder?: string;
  options?: string[] | any;
  validation?: any;
}

interface UserTypeDef {
  id: string;
  name: string;
  slug: string;
  description?: string;
  customFields: CustomFieldDef[];
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
}

export default function PublicRegistrationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const initialTypeSlug = searchParams.get("type");

  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [userTypes, setUserTypes] = useState<UserTypeDef[]>([]);
  const [selectedUserTypeId, setSelectedUserTypeId] = useState<string>("");
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileData, setProfileData] = useState<Record<string, any>>({});

  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoadingConfig(true);
        setError(null);
        const res = await fetch(`/api/${slug}/register`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load registration page.");
        }

        setTenant(data.tenant);
        setUserTypes(data.userTypes || []);

        if (data.userTypes && data.userTypes.length > 0) {
          if (initialTypeSlug) {
            const matched = data.userTypes.find(
              (ut: UserTypeDef) => ut.slug.toLowerCase() === initialTypeSlug.toLowerCase()
            );
            if (matched) {
              setSelectedUserTypeId(matched.id);
            } else {
              setSelectedUserTypeId(data.userTypes[0].id);
            }
          } else {
            setSelectedUserTypeId(data.userTypes[0].id);
          }
        }
      } catch (err: any) {
        setError(err.message || "Unable to load registration portal.");
      } finally {
        setLoadingConfig(false);
      }
    }

    if (slug) {
      loadConfig();
    }
  }, [slug, initialTypeSlug]);

  const activeUserType = userTypes.find((ut) => ut.id === selectedUserTypeId);

  const handleCustomFieldChange = (key: string, value: any) => {
    setProfileData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password) {
      toast.error("Please fill in all required primary fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    // Validate required custom fields
    if (activeUserType) {
      for (const field of activeUserType.customFields) {
        if (field.isRequired) {
          const val = profileData[field.fieldKey];
          if (val === undefined || val === null || val === "") {
            toast.error(`Please provide "${field.label}".`);
            return;
          }
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userTypeId: selectedUserTypeId,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
          profileData,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Submission failed.");
      }

      setSuccessMessage(
        json.message ||
          "Registration submitted successfully! Your account will be activated once verified."
      );
      setIsSuccess(true);
      toast.success("Application submitted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit registration.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
          <span className="text-xs font-semibold">Loading registration portal...</span>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Portal Unavailable</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {error || "Could not find registration configuration for this organization."}
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
            >
              Return to Ray Fit Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Outer Nav Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 font-black text-sm">
              {tenant.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                {tenant.name}
              </div>
              <div className="text-[10px] text-slate-400">Ray Fit Health & Athletics Platform</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href={`/${tenant.slug}/login`}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              Already registered? <span className="text-teal-600 dark:text-teal-400">Log In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-10 px-4 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          {isSuccess ? (
            /* Success confirmation card */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 text-center shadow-xl space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Application Submitted!
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                  {successMessage}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="font-bold text-slate-700 dark:text-slate-300">
                  What happens next?
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
                  <li>
                    The administrators at <span className="font-semibold text-slate-800 dark:text-slate-200">{tenant.name}</span> will review your application.
                  </li>
                  <li>
                    Once approved, your account will be activated and linked to the designated cohort.
                  </li>
                  <li>You can sign in using your email ({email}) and chosen password.</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/${tenant.slug}/login`}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all inline-flex items-center justify-center gap-2"
                >
                  <span>Go to Login Screen</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    setFullName("");
                    setEmail("");
                    setPhone("");
                    setPassword("");
                    setConfirmPassword("");
                    setProfileData({});
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Submit Another Registration
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
              {/* Top Banner */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Public Registration Portal</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Join {tenant.name}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Submit your member profile and registration details for administrative review and cohort onboarding.
                </p>
              </div>

              {/* User Type Selector */}
              {userTypes.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Select Member Role / Registration Type:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {userTypes.map((ut) => {
                      const isSelected = ut.id === selectedUserTypeId;
                      return (
                        <button
                          key={ut.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserTypeId(ut.id);
                            setProfileData({});
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "border-teal-500 bg-teal-500/10 text-teal-900 dark:text-teal-100 shadow-sm"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="font-bold text-xs">{ut.name}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {ut.customFields.length} custom fields
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Primary Contact Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                    1. Account Credentials & Contact
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Legal Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. student@school.edu"
                          className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Account Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Custom Fields Section */}
                {activeUserType && activeUserType.customFields.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                        2. {activeUserType.name} Profile Information
                      </h3>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                        Dynamic Organization Fields
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeUserType.customFields.map((field) => {
                        const val = profileData[field.fieldKey] ?? "";

                        if (field.fieldType === "TEXTAREA") {
                          return (
                            <div key={field.id} className="sm:col-span-2">
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                {field.label}{" "}
                                {field.isRequired && <span className="text-red-500">*</span>}
                              </label>
                              <textarea
                                rows={3}
                                required={field.isRequired}
                                value={val}
                                onChange={(e) =>
                                  handleCustomFieldChange(field.fieldKey, e.target.value)
                                }
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                          );
                        }

                        if (field.fieldType === "DROPDOWN") {
                          let options: string[] = [];
                          if (Array.isArray(field.options)) {
                            options = field.options;
                          } else if (typeof field.options === "string") {
                            try {
                              options = JSON.parse(field.options);
                            } catch {
                              options = (field.options as string).split(",").map((s) => s.trim());
                            }
                          }

                          return (
                            <div key={field.id}>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                {field.label}{" "}
                                {field.isRequired && <span className="text-red-500">*</span>}
                              </label>
                              <select
                                required={field.isRequired}
                                value={val}
                                onChange={(e) =>
                                  handleCustomFieldChange(field.fieldKey, e.target.value)
                                }
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                              >
                                <option value="">-- Select {field.label} --</option>
                                {options.map((opt, idx) => (
                                  <option key={idx} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        }

                        if (field.fieldType === "BOOLEAN") {
                          return (
                            <div
                              key={field.id}
                              className="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30"
                            >
                              <input
                                type="checkbox"
                                id={`custom-${field.fieldKey}`}
                                checked={Boolean(val)}
                                onChange={(e) =>
                                  handleCustomFieldChange(field.fieldKey, e.target.checked)
                                }
                                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                              />
                              <label
                                htmlFor={`custom-${field.fieldKey}`}
                                className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                              >
                                {field.label}{" "}
                                {field.isRequired && <span className="text-red-500">*</span>}
                              </label>
                            </div>
                          );
                        }

                        return (
                          <div key={field.id}>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                              {field.label}{" "}
                              {field.isRequired && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              type={
                                field.fieldType === "NUMBER"
                                  ? "number"
                                  : field.fieldType === "DATE"
                                  ? "date"
                                  : "text"
                              }
                              required={field.isRequired}
                              value={val}
                              onChange={(e) =>
                                handleCustomFieldChange(field.fieldKey, e.target.value)
                              }
                              placeholder={
                                field.placeholder || `Enter ${field.label.toLowerCase()}`
                              }
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Terms & Submit button */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <p className="text-[11px] text-slate-400 text-center">
                    By submitting this registration, your application will be routed to{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {tenant.name}
                    </span>{" "}
                    administrators for verification.
                  </p>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Submitting Application...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        Submit Registration Application
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
