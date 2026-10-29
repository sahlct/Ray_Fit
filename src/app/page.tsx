"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Building2,
  ShieldCheck,
  Watch,
  Sliders,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Mail,
  Phone,
  Send,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  Cpu,
  Lock,
  HeartPulse,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RootHomePage() {
  const [contactForm, setContactForm] = useState({
    institutionName: "",
    contactName: "",
    email: "",
    phone: "",
    studentCount: "500-1000",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  const projectConcepts = [
    {
      icon: Building2,
      title: "Multi-Tenant School Isolation",
      description:
        "Every school operates within a completely isolated logical domain with custom slug routing, personalized branding, independent user directories, and guaranteed zero cross-school data access.",
    },
    {
      icon: Watch,
      title: "Wearable Smart Band Ingestion",
      description:
        "Modular, vendor-agnostic telemetry ingestion pipeline synchronizing real-time physical activity and physiological measurements: daily steps, resting heart rate, blood pressure, sleep cycles, and SpO2.",
    },
    {
      icon: Activity,
      title: "Deterministic Benchmark Engine",
      description:
        "Automated daily evaluation against customizable clinical and athletic benchmarks (>=, <=, and ranges) with strict deterministic categorization into Met, Not Met, and unpenalized No Data states.",
    },
    {
      icon: Sliders,
      title: "Dynamic User Type & Field Builder",
      description:
        "Extensible profile builder allowing school administrators to define custom attributes (Date of Birth, Blood Group, Guardian Emergency Contact, Allergies) stored in validated JSONB with zero database schema migrations.",
    },
    {
      icon: GraduationCap,
      title: "Cohort Hierarchy & Enrollments",
      description:
        "Structured academic organization from Classes to granular Batches with student capacity enforcement, assigned athletic coaches, and controlled duplicate-free enrollments.",
    },
    {
      icon: CalendarDays,
      title: "Historical Timetables & Versioning",
      description:
        "Time-windowed task schedules that permanently preserve historical benchmark versions so previously generated health compliance reports continue to reflect the exact rules in effect at measurement time.",
    },
    {
      icon: BarChart3,
      title: "Institutional Analytics & Exports",
      description:
        "Comprehensive health compliance dashboards with cohort comparisons, trend curves, student drill-downs, CSV data exports, and printable health certificates.",
    },
    {
      icon: ShieldCheck,
      title: "Granular RBAC & Audit Trails",
      description:
        "Module and action-based permissions (VIEW, CREATE, EDIT, DELETE, ASSIGN, EXPORT, MANAGE) paired with an immutable audit log capturing every administrative mutation.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-black text-lg tracking-wider text-white">
              RAY FIT
            </span>
            <span className="block text-[10px] text-teal-400 font-bold uppercase tracking-wider">
              School Health & Fitness Platform
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
          <a href="#concepts" className="hover:text-teal-400 transition-colors">
            Core Concepts
          </a>
          <a href="#evaluation-engine" className="hover:text-teal-400 transition-colors">
            Evaluation Engine
          </a>
          <a href="#contact" className="hover:text-teal-400 transition-colors">
            Contact & Onboarding
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 transition-colors"
          >
            Super Admin Login
          </Link>
          <a
            href="#contact"
            className="text-xs font-bold px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md transition-all"
          >
            Request Access
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Next-Generation Institutional Health Monitoring System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1]">
            Intelligent Health &amp; Fitness <br />
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Telemetry for Modern Schools
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-3xl mx-auto mb-10">
            Ray Fit is an enterprise multi-tenant platform designed to monitor, evaluate,
            and report student physical activity and vital metrics collected through connected
            wearable smart bands with complete data isolation, granular RBAC, and automated
            benchmark compliance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#concepts"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 transition-all hover:scale-105"
            >
              <span>Explore Platform Concepts</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm transition-all hover:scale-105"
            >
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Platform Super Admin Portal</span>
            </Link>
          </div>
        </section>

        {/* Deterministic Evaluation Architecture Section */}
        <section id="evaluation-engine" className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
              Automated Telemetry Evaluation
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Deterministic 3-State Benchmark Engine
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              Missing wearable telemetry is never penalized as failure. The platform accurately separates compliance from connectivity states.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Status: MET</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Student recorded health telemetry that satisfies or exceeds the configured benchmark operator (&gt;=, &lt;=, or clinical range).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-500/20 text-[11px] font-mono text-emerald-300">
                e.g., Steps &gt;= 8,000 / Day
              </div>
            </div>

            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Status: NOT MET</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Valid wearable readings were successfully synchronized during the evaluation window, but the target value or physiological boundary was not reached.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-rose-500/20 text-[11px] font-mono text-rose-300">
                e.g., Recorded 5,200 / 8,000 steps
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Status: NO DATA</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The student has an active assignment, but no smart band synchronization was received for this period. Categorized strictly as No Data without student penalty.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                e.g., Unsynced or band uncharged
              </div>
            </div>
          </div>
        </section>

        {/* Core Concepts Grid */}
        <section id="concepts" className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-800/80">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
              Architectural Pillars
            </h2>
            <h3 className="text-3xl font-black text-white">
              Engineered for Modern School Health
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              A comprehensive system built specifically for athletic directors, physical educators, school nurses, and institutional administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {projectConcepts.map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-teal-500/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-2">
                      {c.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact & Institutional Onboarding Section */}
        <section id="contact" className="max-w-4xl mx-auto px-6 py-16 border-t border-slate-800/80">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-8 sm:p-12 shadow-2xl">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 inline-flex items-center justify-center mb-4">
                <Mail className="w-6 h-6" />
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Contact &amp; School Onboarding
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Interested in deploying Ray Fit across your school district or institution? Inquire below and our platform specialists will set up your dedicated tenant domain.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-teal-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">
                  Inquiry Received Successfully!
                </h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Thank you for reaching out. An institutional onboarding specialist will review your school requirements and reach out to <strong>{contactForm.email}</strong> within 1 business day.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSubmitted(false)}
                  className="mt-3 text-xs"
                >
                  Send Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      School / Institution Name *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Westlake Academy"
                      value={contactForm.institutionName}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          institutionName: e.target.value,
                        }))
                      }
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Your Name &amp; Title *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Athletic Director John Doe"
                      value={contactForm.contactName}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          contactName: e.target.value,
                        }))
                      }
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Official Work Email *
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="jdoe@westlake.edu"
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Contact Phone
                    </label>
                    <Input
                      placeholder="+1 (555) 012-3456"
                      value={contactForm.phone}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Estimated Student Enrollment
                  </label>
                  <select
                    value={contactForm.studentCount}
                    onChange={(e) =>
                      setContactForm((prev) => ({
                        ...prev,
                        studentCount: e.target.value,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-slate-800 bg-slate-950 text-white text-xs font-medium"
                  >
                    <option value="Under 250">Under 250 Students</option>
                    <option value="250-500">250 - 500 Students</option>
                    <option value="500-1000">500 - 1,000 Students</option>
                    <option value="1000-2500">1,000 - 2,500 Students</option>
                    <option value="2500+">2,500+ Students (District Scale)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Project Requirements / Message
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your smart band integration, PE curriculum goals, or timeline..."
                    value={contactForm.message}
                    onChange={(e) =>
                      setContactForm((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    className="w-full p-3 rounded-lg border border-slate-800 bg-slate-950 text-white text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Sending Request..." : "Submit Institutional Inquiry"}</span>
                </Button>
              </form>
            )}

            {/* Direct Contact Channels */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-400" />
                <span>inquiries@rayfit.io</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400" />
                <span>+1 (800) 555-RAYFIT</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-400" />
                <span>FERPA &amp; HIPAA-Aligned Cloud Security</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-slate-950 px-6 lg:px-12 py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-slate-300">Ray Fit Platform</span>
            <span>— Enterprise School Health Telemetry</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-teal-400 transition-colors">
              Super Admin Access
            </Link>
            <a href="#concepts" className="hover:text-teal-400 transition-colors">
              Concepts
            </a>
            <a href="#contact" className="hover:text-teal-400 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
