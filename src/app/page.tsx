"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Layers,
  BarChart3,
  GraduationCap,
  Trophy,
  HeartPulse,
  Watch,
  Handshake,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Send,
  Building2,
  Users2,
  Sliders,
  ShieldCheck,
  Bell,
  FileSpreadsheet,
  Globe,
  Lock,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export default function RaysFitLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Demo Form State
  const [demoForm, setDemoForm] = useState({
    fullName: "",
    organisationName: "",
    designation: "",
    email: "",
    phone: "",
    country: "",
    organisationType: "School / Educational Institution",
    participantCount: "100 - 500",
    primaryObjective: "",
    additionalRequirements: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.fullName.trim() || !demoForm.organisationName.trim() || !demoForm.email.trim()) {
      toast.error("Please provide your Name, Organisation, and Business Email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demoForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        toast.success("Thank you! Your demonstration request has been submitted.");
      } else {
        toast.error(data.error || "Submission failed. Please try again.");
      }
    } catch {
      toast.error("Error submitting form. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: "What is RaysFit?",
      a: "RaysFit is a wearable intelligence and programme management platform that helps organisations connect wearable data, configure benchmarks, monitor participation and evaluate programme outcomes.",
    },
    {
      q: "Who can use RaysFit?",
      a: "RaysFit is designed for educational institutions, schools, universities, sports academies, clubs, fitness centres and wellness programme operators.",
    },
    {
      q: "Do participants need a specific wearable device?",
      a: "Not necessarily. Participants can connect compatible devices through supported integrations. Organisations can also arrange supplied wearable devices. Device compatibility depends on the supported integrations and available data sources.",
    },
    {
      q: "What information can RaysFit monitor?",
      a: "Depending on the connected device and integration, the platform can support information such as activity, steps and sleep-related indicators. The availability of individual metrics varies by device and integration.",
    },
    {
      q: "Can organisations establish their own benchmarks?",
      a: "RaysFit is designed to support configurable programme benchmarks and targets. The precise configuration options depend on the deployed product version.",
    },
    {
      q: "Can we monitor multiple groups?",
      a: "The platform is designed to support programme and group-based management. Available administrative views depend on the configured organisation structure and permissions.",
    },
    {
      q: "Is RaysFit a medical or diagnostic platform?",
      a: "No. RaysFit is intended for programme management, wellness awareness and monitoring of available wearable-derived indicators. It does not diagnose medical conditions or replace professional medical advice.",
    },
    {
      q: "How is participant information protected?",
      a: "RaysFit is designed around responsible data handling and appropriate access permissions. Specific consent workflows, access controls, retention policies and security measures are subject to the implemented platform configuration and applicable privacy requirements.",
    },
    {
      q: "Can schools use RaysFit for students under 18?",
      a: "RaysFit can be considered for educational programmes involving minors, subject to appropriate institutional approvals, guardian consent, privacy requirements and verified platform safeguards.",
    },
    {
      q: "Can parents access their children's progress?",
      a: "Parent or guardian access can be considered within an approved programme model. The available functionality and permissions must be confirmed for the relevant deployment.",
    },
    {
      q: "Can we use our own branding?",
      a: "Organisation-specific branding can be discussed, subject to the available customisation options.",
    },
    {
      q: "Can we generate reports?",
      a: "RaysFit is designed to support programme and group-level reporting. Report formats and export options depend on the deployed functionality.",
    },
    {
      q: "Can we purchase devices through RaysFit?",
      a: "Organisations can discuss device procurement and deployment options through RaysFit, subject to device availability and commercial arrangements.",
    },
    {
      q: "How much does RaysFit cost?",
      a: "Pricing depends on the number of participants, programme requirements, device requirements, integrations and deployment model. Contact our team for a tailored proposal.",
    },
    {
      q: "How long does implementation take?",
      a: "Implementation timelines depend on programme size, device compatibility, integration requirements and onboarding arrangements. Our team can provide an estimated deployment schedule following an initial assessment.",
    },
    {
      q: "Can sponsors fund our programme?",
      a: "Yes. Organisations can explore sponsorship arrangements for wearable devices, programme implementation or participant access. Sponsorship availability and terms depend on individual partnerships.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white font-sans relative">
      {/* Decorative background glows */}
      <div className="fixed top-0 left-1/4 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 right-1/4 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* =========================================================================
          HEADER / NAVBAR (Fully responsive sticky navbar)
         ========================================================================= */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-lg shadow-orange-500/20 border border-slate-700 bg-slate-900 shrink-0 group-hover:border-orange-500/50 transition-colors">
              <img
                src="/brand/png/raysfit-icon-120.png"
                alt="RaysFit"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="font-black text-lg sm:text-xl tracking-wider text-white flex items-center">
                RAYSFIT
              </span>
              <span className="block text-[10px] bg-gradient-to-r from-[#FF6B2C] to-[#FF2D78] bg-clip-text text-transparent font-bold uppercase tracking-wider truncate">
                Wearable Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-semibold text-slate-300">
            <a href="#home" className="hover:text-orange-400 transition-colors">
              Home
            </a>
            <a href="#platform" className="hover:text-orange-400 transition-colors">
              Platform
            </a>
            <a href="#benchmarking" className="hover:text-orange-400 transition-colors">
              Benchmarking
            </a>
            <a href="#solutions" className="hover:text-orange-400 transition-colors">
              Solutions
            </a>
            <a href="#devices" className="hover:text-orange-400 transition-colors">
              Devices
            </a>
            <a href="#partnerships" className="hover:text-orange-400 transition-colors">
              Partnerships
            </a>
            <a href="#features" className="hover:text-orange-400 transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-orange-400 transition-colors">
              About
            </a>
            <a href="#faqs" className="hover:text-orange-400 transition-colors">
              FAQs
            </a>
          </nav>

          {/* Desktop Right CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="#contact"
              className="text-xs font-bold px-4 sm:px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-md shadow-orange-500/20 transition-all hover:scale-105 inline-flex items-center gap-1.5"
            >
              <span>Book a Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Right Bar: Mini CTA + Hamburger Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <a
              href="#contact"
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-orange-500 text-slate-950 shrink-0"
            >
              Demo
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-300">
              <a
                href="#home"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-orange-400 py-1"
              >
                Home
              </a>
              <a
                href="#platform"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-orange-400 py-1"
              >
                Platform
              </a>
              <a
                href="#benchmarking"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-orange-400 py-1"
              >
                Benchmarking &amp; Analytics
              </a>
              <a
                href="#solutions"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-orange-400 py-1"
              >
                Solutions (Education, Sports, Fitness)
              </a>
              <a
                href="#devices"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-orange-400 py-1"
              >
                Wearable Devices
              </a>
              <a
                href="#partnerships"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-orange-400 py-1"
              >
                Sponsorship &amp; Partnerships
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-orange-400 py-1"
              >
                Features
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-orange-400 py-1"
              >
                About RaysFit
              </a>
              <a
                href="#faqs"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-orange-400 py-1"
              >
                FAQs
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center gap-2 mt-2 px-5 py-3 rounded-xl bg-orange-500 text-slate-950 font-bold text-center"
              >
                <span>Book a Demo</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* =========================================================================
          MAIN CONTENT CONTAINER
         ========================================================================= */}
      <main className="flex-1 w-full">
        {/* =====================================================================
            1. HOME / HERO SECTION
           ===================================================================== */}
        <section id="home" className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Top Product Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold mb-6 sm:mb-8">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>A Product of Rays Sports Network Inc.</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-[1.12]">
              Turn Wearable Data Into <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
                Meaningful Progress.
              </span>
            </h1>

            <p className="text-base sm:text-xl font-semibold text-slate-200 mb-4 max-w-2xl mx-auto">
              One platform. Your benchmarks. Measurable progress.
            </p>

            <p className="text-xs sm:text-base text-slate-400 leading-relaxed max-w-3xl mx-auto mb-8 sm:mb-10">
              RaysFit is a wearable intelligence and programme management platform that helps educational
              institutions, sports organisations and wellness providers connect wearable devices, establish
              meaningful benchmarks, monitor participation and measure progress.
            </p>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
              Transform everyday wearable data into structured insights that help organisations manage
              programmes, understand performance and make informed decisions.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-orange-500/25 transition-all hover:scale-105"
              >
                <span>Book a Demo</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#platform"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs sm:text-sm transition-all hover:scale-105"
              >
                <span>Explore the Platform</span>
              </a>
            </div>
          </div>

          {/* Core Problem Statement */}
          <div className="mt-16 sm:mt-24 p-6 sm:p-10 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <h2 className="text-xl sm:text-3xl font-extrabold text-white mb-4">
                Wearable Technology Generates Data. Organisations Need Intelligence.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Wearable devices generate valuable information about daily activity, sleep patterns and other
                wellness indicators. However, managing this information across an entire school, sports academy,
                club or wellness programme presents a different challenge.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
              {[
                "Connect and manage multiple wearable devices.",
                "Establish consistent programme benchmarks.",
                "Monitor participation across groups.",
                "Understand progress against defined objectives.",
                "Identify engagement gaps and changing trends.",
                "Generate meaningful reports for stakeholders.",
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-xs sm:text-sm font-semibold text-orange-400/90 mt-6 pt-4 border-t border-slate-800/60">
              RaysFit bridges the gap between individual wearable technology and organisation-wide programme management.
            </p>
          </div>

          {/* One Connected Platform. Multiple Possibilities. */}
          <div className="mt-16 sm:mt-24">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
                Unified Ecosystem
              </h2>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                One Connected Platform. Multiple Possibilities.
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                RaysFit brings wearable integration, benchmarking, programme management and analytics together in one platform.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {
                  icon: Watch,
                  title: "Connect Wearables",
                  desc: "Integrate supported wearable devices and health data sources to bring participant information into a centralised platform.",
                },
                {
                  icon: Sliders,
                  title: "Define Your Benchmarks",
                  desc: "Establish configurable benchmarks and targets according to your organisation's objectives, programmes and participant groups.",
                },
                {
                  icon: BarChart3,
                  title: "Monitor Progress",
                  desc: "Access centralised dashboards to understand participation, activity trends and progress against defined benchmarks.",
                },
                {
                  icon: FileSpreadsheet,
                  title: "Generate Insights",
                  desc: "Convert collected information into structured reports that help administrators, coaches and programme managers evaluate outcomes.",
                },
                {
                  icon: Building2,
                  title: "Manage Programmes",
                  desc: "Manage participants, groups, device allocations and programme activities through a unified environment.",
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between hover:border-orange-500/40 transition-colors"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-3">
                      <card.icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-2">{card.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* More Than Wearable Monitoring. A Complete Programme Intelligence Layer. */}
          <div className="mt-16 sm:mt-24">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                More Than Wearable Monitoring. A Complete Programme Intelligence Layer.
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Configurable Benchmarking",
                  desc: "Establish programme-specific targets and benchmarks for different participant groups and individuals.",
                },
                {
                  title: "Centralised Analytics",
                  desc: "Understand activity, participation and progress across your organisation through consolidated dashboards.",
                },
                {
                  title: "Multi-Group Management",
                  desc: "Manage multiple programmes, teams, classes, locations and participant groups.",
                },
                {
                  title: "Wearable Integration",
                  desc: "Connect supported wearable devices and health data sources through compatible integrations.",
                },
                {
                  title: "Actionable Programme Insights",
                  desc: "Identify participation patterns, engagement gaps and trends that require management attention.",
                },
                {
                  title: "Flexible Deployment",
                  desc: "Support bring-your-own-device programmes or organisation-supplied wearable devices.",
                },
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 hover:border-slate-700 transition-colors"
                >
                  <h4 className="text-sm sm:text-base font-bold text-white mb-2">{feat.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* One Platform. Three Powerful Applications. */}
          <div id="solutions" className="mt-16 sm:mt-24 scroll-mt-24">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
                Industry Solutions
              </h2>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                One Platform. Three Powerful Applications.
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Education */}
              <div className="p-6 sm:p-8 rounded-3xl border border-indigo-900/40 bg-gradient-to-b from-indigo-950/20 to-slate-900/40 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-3">Education &amp; Institutions</h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                    Build structured student activity and wellness programmes. Monitor participation and
                    programme progress with appropriate consent and supervision.
                  </p>
                </div>
                <a
                  href="#education"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>Explore Education Solutions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Sports */}
              <div className="p-6 sm:p-8 rounded-3xl border border-orange-900/40 bg-gradient-to-b from-orange-950/20 to-slate-900/40 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-5">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-3">Sports Performance &amp; Development</h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                    Support coaches and sports academies with activity trends, training participation and
                    recovery-related indicators.
                  </p>
                </div>
                <a
                  href="#sports"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <span>Explore Sports Solutions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Fitness */}
              <div className="p-6 sm:p-8 rounded-3xl border border-rose-900/40 bg-gradient-to-b from-rose-950/20 to-slate-900/40 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-5">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-3">Fitness &amp; Wellness</h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                    Help fitness centres and wellness operators extend engagement beyond facility visits
                    through structured wearable-based programmes.
                  </p>
                </div>
                <a
                  href="#fitness"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <span>Explore Fitness &amp; Wellness</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* 5-Step Process */}
          <div className="mt-16 sm:mt-24">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
                Operational Lifecycle
              </h2>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                From Wearable Connection to Measurable Programme Insights.
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {
                  step: "01",
                  title: "Connect",
                  desc: "Participants connect compatible wearable devices through supported integrations or use devices supplied by their organisation.",
                },
                {
                  step: "02",
                  title: "Configure",
                  desc: "Administrators establish programme structures, participant groups, metrics and benchmarks.",
                },
                {
                  step: "03",
                  title: "Monitor",
                  desc: "RaysFit consolidates available data and presents programme progress through dashboards and analytics.",
                },
                {
                  step: "04",
                  title: "Evaluate",
                  desc: "Review trends, participation and benchmark outcomes to understand programme effectiveness.",
                },
                {
                  step: "05",
                  title: "Improve",
                  desc: "Use programme insights to refine targets, engagement initiatives and future activities.",
                },
              ].map((st, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 relative overflow-hidden"
                >
                  <span className="text-2xl sm:text-3xl font-black text-slate-700/80 mb-2 block font-mono">
                    {st.step}
                  </span>
                  <h4 className="text-sm font-bold text-white mb-1.5">{st.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Your Programme. Your Devices. Your Choice. */}
          <div className="mt-16 sm:mt-24 p-6 sm:p-10 rounded-3xl border border-slate-800 bg-slate-900/40">
            <div className="max-w-2xl mb-8">
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
                Your Programme. Your Devices. Your Choice.
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                RaysFit supports flexible wearable deployment strategies tailored to your institutional budget.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs sm:text-sm font-bold text-white mb-1">Bring Your Own Device</h4>
                <p className="text-xs text-slate-400">
                  Reduce deployment costs by allowing participants to connect compatible personal devices.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs sm:text-sm font-bold text-white mb-1">Organisation-Supplied Devices</h4>
                <p className="text-xs text-slate-400">
                  Deploy wearable devices across selected groups, classes or programmes.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs sm:text-sm font-bold text-white mb-1">Sponsored Deployments</h4>
                <p className="text-xs text-slate-400">
                  Explore partnerships with sponsors who wish to support wearable-based education, sports and wellness.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs sm:text-sm font-bold text-white mb-1">Device Management</h4>
                <p className="text-xs text-slate-400">
                  Manage device allocations, inventory, assignments and returns through the platform.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">Explore comprehensive hardware integration options</span>
              <a
                href="#devices"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300"
              >
                <span>Explore Wearable Solutions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Partnerships Banner */}
          <div className="mt-16 sm:mt-24 p-6 sm:p-10 rounded-3xl border border-amber-900/30 bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-orange-950/20">
            <div className="max-w-3xl">
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
                Making Wellness Programmes More Accessible Through Partnerships.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                RaysFit provides opportunities for organisations to explore sponsored wearable and wellness programmes.
                Sponsors can support device procurement, programme implementation or participant access. Organisations
                benefit from sponsored deployments while sponsors receive agreed reporting on programme reach and engagement.
              </p>

              <div className="flex flex-wrap gap-2 text-xs font-semibold text-amber-300/90 mb-6">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">Corporate organisations</span>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">Educational foundations</span>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">Community development</span>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">Sports sponsors</span>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">Corporate wellness</span>
              </div>

              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                <span>Discuss a Sponsorship Partnership</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* =====================================================================
            2. PLATFORM SECTION
           ===================================================================== */}
        <section id="platform" className="py-16 sm:py-24 border-t border-slate-800/80 bg-slate-900/20 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2 block">
                Platform Architecture
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
                A Unified Intelligence Platform for Wearable-Driven Programmes.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                RaysFit connects wearable data, configurable benchmarks, participant management and analytics to help organisations manage programmes at scale.
                Instead of working with disconnected devices, individual dashboards and spreadsheets, organisations use a centralised platform to manage programme information and understand progress.
              </p>
            </div>

            {/* Core Platform Capabilities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
              {[
                {
                  title: "Wearable Data Integration",
                  desc: "Connect supported wearable devices and compatible health data sources.",
                },
                {
                  title: "Benchmark Management",
                  desc: "Configure programme benchmarks and targets according to organisational requirements.",
                },
                {
                  title: "Participant Management",
                  desc: "Organise participants into programmes, groups and individual profiles.",
                },
                {
                  title: "Performance Dashboards",
                  desc: "View available data and programme progress through centralised dashboards.",
                },
                {
                  title: "Notifications & Engagement",
                  desc: "Support participant engagement through configurable prompts and notifications.",
                },
                {
                  title: "Reporting & Analytics",
                  desc: "Generate structured reports to evaluate participation, trends and programme outcomes.",
                },
                {
                  title: "Organisation Management",
                  desc: "Support multiple programmes, groups and locations through centralised administration.",
                },
                {
                  title: "Audit & Compliance",
                  desc: "Immutable logs, consent workflows, and enterprise role-based security.",
                },
              ].map((cap, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
                  <h4 className="text-sm font-bold text-white mb-1.5">{cap.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{cap.desc}</p>
                </div>
              ))}
            </div>

            {/* Designed for Flexibility Callout */}
            <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/80">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Designed for Flexibility</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                An educational institution may prioritise participation and daily activity. A sports academy may focus on training participation and recovery-related indicators. A fitness organisation may prioritise consistency, engagement and programme progression. RaysFit brings these different requirements together through configurable programme management and benchmarking.
              </p>
              <a
                href="#contact"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300"
              >
                <span>Request a Platform Demonstration</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* =====================================================================
            3. BENCHMARKING & ANALYTICS SECTION
           ===================================================================== */}
        <section id="benchmarking" className="py-16 sm:py-24 border-t border-slate-800/80 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2 block">
                Benchmarking &amp; Analytics
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
                Move Beyond Data Collection. Understand Progress.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Collecting wearable data is only the beginning. The real value comes from understanding what the data means within the context of a defined programme. RaysFit enables organisations to establish their own benchmarks and evaluate available information against programme objectives.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/40">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4">
                  Configurable Benchmarks
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Establish targets according to your unique operational parameters:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Organisation requirements</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Programme objectives</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Participant groups &amp; cohorts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Individual programme settings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Selected activity and wellness metrics</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/40">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4">
                  Understand Programme Performance
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Monitor key progress and consistency indicators in real time:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Activity trends and participation rates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Available sleep-related indicators</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Progress against defined targets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Data availability and synchronisation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Group and programme-level outcomes</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Centralised Dashboards & Reporting */}
            <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950 text-center max-w-4xl mx-auto">
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                A Benchmark Should Reflect the Programme, Not Just an Algorithm.
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                RaysFit is designed around organisation-defined programme objectives rather than relying exclusively on generic consumer fitness targets. Authorised coaches and administrators get a consolidated view to filter, review, evaluate effectiveness and communicate outcomes to stakeholders.
              </p>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs"
              >
                <span>Explore Benchmarking Capabilities</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* =====================================================================
            4. EDUCATION & INSTITUTIONS
           ===================================================================== */}
        <section id="education" className="py-16 sm:py-24 border-t border-slate-800/80 bg-slate-900/10 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 block">
                Education &amp; Institutions
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
                Building Smarter Student Activity and Wellness Programmes.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Educational institutions need practical ways to encourage participation, understand activity patterns and manage structured wellness initiatives. RaysFit helps schools, colleges and universities manage wearable-based programmes through centralised monitoring, configurable benchmarks and programme reporting.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                {
                  title: "Institution-Wide Programmes",
                  desc: "Organise participants into classes, groups and academic programmes.",
                },
                {
                  title: "Activity Monitoring",
                  desc: "Monitor available activity indicators and participation trends across cohorts.",
                },
                {
                  title: "Configurable Benchmarks",
                  desc: "Establish age-appropriate and programme-specific targets through authorised administrators.",
                },
                {
                  title: "Programme Dashboards",
                  desc: "Review participation and progress across different student groups.",
                },
                {
                  title: "Guardian & Admin Access",
                  desc: "Support appropriate consent, supervision and access controls according to the institution's requirements.",
                },
                {
                  title: "Programme Reporting",
                  desc: "Generate printable compliance reports and verifiable health certificates.",
                },
              ].map((item, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
                  <h4 className="text-sm font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl border border-indigo-900/30 bg-indigo-950/20 text-xs text-slate-300">
              <strong className="text-indigo-300">A More Structured Approach to Student Wellness:</strong>{" "}
              RaysFit focuses on encouraging participation and positive activity habits rather than appearance-based measurements. The platform is intended to support educational wellness programmes, not replace professional medical or educational judgement.
            </div>
          </div>
        </section>

        {/* =====================================================================
            5. SPORTS ACADEMIES & CLUBS
           ===================================================================== */}
        <section id="sports" className="py-16 sm:py-24 border-t border-slate-800/80 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2 block">
                Sports Academies &amp; Clubs
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
                Bring Wearable Intelligence Into Sports Development.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Athlete development requires more than measuring attendance or recording match results. Coaches and sports administrators need structured information to understand participation, activity trends and recovery-related indicators. RaysFit provides a centralised platform for managing wearable-based sports and wellness programmes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                {
                  title: "Squad Management",
                  desc: "Organise athletes across teams, squads and development programmes.",
                },
                {
                  title: "Activity Monitoring",
                  desc: "Review available activity data, heart rates and training participation trends.",
                },
                {
                  title: "Training & Recovery Indicators",
                  desc: "Monitor selected wearable-derived indicators, including sleep-related trends.",
                },
                {
                  title: "Configurable Benchmarks",
                  desc: "Establish athletic targets for groups and individual participants.",
                },
                {
                  title: "Progress Monitoring",
                  desc: "Understand changes in available telemetry over time.",
                },
                {
                  title: "Parent & Stakeholder Reporting",
                  desc: "Support appropriate sharing of junior programme progress, subject to consent.",
                },
              ].map((item, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
                  <h4 className="text-sm font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400">
              RaysFit complements coaching expertise and existing sports performance systems, not replacing professional assessment.
            </p>
          </div>
        </section>

        {/* =====================================================================
            6. FITNESS & WELLNESS
           ===================================================================== */}
        <section id="fitness" className="py-16 sm:py-24 border-t border-slate-800/80 bg-slate-900/10 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2 block">
                Fitness &amp; Wellness
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
                Extend Your Member Experience Beyond the Facility.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Member engagement does not need to stop when someone leaves your fitness centre. RaysFit helps fitness and wellness organisations create structured wearable-based programmes that encourage consistency and provide visibility into participant progress.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Member Programmes", desc: "Create activity and wellness programmes for members." },
                { title: "Wearable Integration", desc: "Connect compatible personal devices or supply wearables." },
                { title: "Progress Monitoring", desc: "Review available activity indicators and programme benchmarks." },
                { title: "Trainer Visibility", desc: "Provide authorised trainers with relevant information about assigned participants." },
                { title: "Member Engagement", desc: "Use programme prompts and progress information to encourage continued participation." },
                { title: "Branded Experience", desc: "Explore organisation-specific branding options for the participant experience." },
              ].map((item, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
                  <h4 className="text-sm font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            7. WEARABLE DEVICES
           ===================================================================== */}
        <section id="devices" className="py-16 sm:py-24 border-t border-slate-800/80 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2 block">
                Hardware Strategies
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
                Flexible Wearable Integration for Every Programme.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Every organisation has different deployment requirements. Some participants already own compatible wearable devices. Others require devices supplied by their institution or programme provider. RaysFit supports a flexible deployment approach.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* BYOD */}
              <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/40">
                <h3 className="text-lg font-bold text-white mb-2">Bring Your Own Device</h3>
                <p className="text-xs sm:text-sm text-slate-400 mb-4">
                  Allow participants to connect compatible wearable devices through supported health-data integrations.
                </p>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-400" />
                    <span>Reduced initial hardware investment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-400" />
                    <span>Faster participant onboarding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-400" />
                    <span>Flexibility in device selection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-400" />
                    <span>Reduced inventory requirements</span>
                  </div>
                </div>
              </div>

              {/* Organisation Supplied */}
              <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/40">
                <h3 className="text-lg font-bold text-white mb-2">Organisation-Supplied Devices</h3>
                <p className="text-xs sm:text-sm text-slate-400 mb-4">
                  Provide wearable devices to participants who do not have compatible hardware. Organisations can explore different commercial models:
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <strong className="text-white block mb-0.5">Sell</strong>
                    <span>Offer at an organisation-defined price</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <strong className="text-white block mb-0.5">Rent</strong>
                    <span>Rental or subscription models</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <strong className="text-white block mb-0.5">Bundle</strong>
                    <span>Included within programme fees</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <strong className="text-white block mb-0.5">Sponsor</strong>
                    <span>Third-party funded deployment</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Device Management */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 text-center">
              <h4 className="text-sm font-bold text-white mb-1">Centralised Device Inventory Management</h4>
              <p className="text-xs text-slate-400">
                RaysFit provides capabilities to track device allocations, participant assignments, returns, and maintenance history.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================================
            8. SPONSORSHIP & PARTNERSHIPS
           ===================================================================== */}
        <section id="partnerships" className="py-16 sm:py-24 border-t border-slate-800/80 bg-slate-900/20 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2 block">
                Partnership Ecosystem
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
                Powering Wellness Programmes Through Collaboration.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Access to wearable technology and structured wellness programmes can be supported through institutional partnerships and sponsorship initiatives. RaysFit provides a platform through which organisations explore sponsored deployments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { title: "Educational Wellness", desc: "Support student activity and wellness initiatives." },
                { title: "Community Sports", desc: "Support grassroots academies, clubs and youth development programmes." },
                { title: "Corporate Wellness", desc: "Support employee activity and engagement programmes." },
                { title: "Community Development", desc: "Help make technology-enabled wellness initiatives accessible to wider communities." },
              ].map((sp, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
                  <h4 className="text-sm font-bold text-white mb-2">{sp.title}</h4>
                  <p className="text-xs text-slate-400">{sp.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950/80">
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">A Transparent Partnership Model</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                Sponsors and programme operators agree on objectives, participant coverage, device funding, timelines, and visibility. Programme reporting uses agreed, privacy-appropriate aggregated information rather than exposing individual participant health information.
              </p>
              <a
                href="#contact"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300"
              >
                <span>Become a RaysFit Partner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* =====================================================================
            9. FEATURES SECTION
           ===================================================================== */}
        <section id="features" className="py-16 sm:py-24 border-t border-slate-800/80 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2 block">
                Platform Capabilities
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
                Everything You Need to Manage Wearable-Driven Programmes.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Wearable Integration", desc: "Connect supported wearable devices and compatible health data sources." },
                { title: "Benchmark Management", desc: "Establish configurable targets and programme benchmarks." },
                { title: "Participant Management", desc: "Organise participants into programmes, groups and individual profiles." },
                { title: "Group Analytics", desc: "Review participation, activity and available wellness indicators across groups." },
                { title: "Progress Monitoring", desc: "Understand programme progress against defined targets over time." },
                { title: "Notifications & Engagement", desc: "Support programme engagement through configurable prompts and notifications." },
                { title: "Reporting", desc: "Generate programme and group-level compliance and progress reports." },
                { title: "Multi-Location Management", desc: "Support centralised administration across multiple locations and campuses." },
                { title: "Device Inventory", desc: "Manage device allocations, returns and associated maintenance records." },
                { title: "Sponsorship Support", desc: "Support the management and reporting requirements of sponsored programmes." },
                { title: "Privacy & Access Management", desc: "Provide appropriate data access and permission controls according to participant roles, consent requirements and platform configuration." },
              ].map((feat, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
                  <h4 className="text-sm font-bold text-white mb-1.5">{feat.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            10. ABOUT RAYSFIT
           ===================================================================== */}
        <section id="about" className="py-16 sm:py-24 border-t border-slate-800/80 bg-slate-900/10 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2 block">
                Our Story &amp; Ecosystem
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
                Making Wearable Intelligence Accessible to Organisations.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                Wearable technology has transformed the way individuals understand their daily activity and wellness. However, organisations managing hundreds or thousands of participants face a different challenge. They need to connect devices, establish meaningful benchmarks, manage participants and understand programme outcomes. RaysFit was developed to address this gap.
              </p>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                RaysFit is a product of <strong className="text-white">Rays Sports Network Inc.</strong>, developed to help educational institutions, sports organisations and wellness providers make better use of wearable technology.
              </p>
            </div>

            {/* Our Approach */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {[
                { title: "Technology with Purpose", desc: "We focus on practical applications of wearable technology." },
                { title: "Benchmarks with Context", desc: "Programme objectives should reflect the organisation and the people participating." },
                { title: "Insights That Matter", desc: "Data becomes valuable when it supports better-informed decisions." },
                { title: "Responsible Innovation", desc: "Privacy, appropriate permissions and responsible data use are fundamental to our approach." },
              ].map((app, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
                  <h4 className="text-sm font-bold text-white mb-1.5">{app.title}</h4>
                  <p className="text-xs text-slate-400">{app.desc}</p>
                </div>
              ))}
            </div>

            {/* Rays Sports Network Inc. Ecosystem */}
            <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-950">
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Rays Sports Network Inc.</h3>
              <p className="text-xs text-slate-400 mb-6">
                RaysFit is part of the Rays Sports Network technology ecosystem:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/10">
                  <strong className="text-white text-xs block mb-1">RaysFit</strong>
                  <span className="text-[11px] text-slate-300">Wearable intelligence &amp; benchmarking</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <strong className="text-white text-xs block mb-1">Sync360</strong>
                  <span className="text-[11px] text-slate-400">Sports academy &amp; athlete development management</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <strong className="text-white text-xs block mb-1">Club7MS</strong>
                  <span className="text-[11px] text-slate-400">Grassroots team management</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <strong className="text-white text-xs block mb-1">RaysVenue</strong>
                  <span className="text-[11px] text-slate-400">Sports facility &amp; venue management</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            11. FREQUENTLY ASKED QUESTIONS
           ===================================================================== */}
        <section id="faqs" className="py-16 sm:py-24 border-t border-slate-800/80 scroll-mt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2 block">
                Common Inquiries
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Clear answers regarding architecture, device compatibility, data privacy, and deployments.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-800 rounded-2xl bg-slate-900/40 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
                    >
                      <span className="text-xs sm:text-sm font-bold text-white leading-snug">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-orange-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            12. CONTACT & DEMO
           ===================================================================== */}
        <section id="contact" className="py-16 sm:py-24 border-t border-slate-800/80 bg-slate-900/20 scroll-mt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2 block">
                Connect With Us
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-3">
                Let&apos;s Explore What RaysFit Can Do for Your Organisation.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
                Whether you are building a student wellness initiative, managing a sports academy or developing a corporate wellness programme, we would be pleased to demonstrate how RaysFit supports your objectives.
              </p>
            </div>

            <div className="p-6 sm:p-10 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Request a Demonstration</span>
              </h3>

              {submitted ? (
                <div className="p-8 text-center rounded-2xl bg-emerald-950/30 border border-emerald-800/50 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Demo Request Received</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Thank you, {demoForm.fullName}. Our team has received your details and will contact you at <strong>{demoForm.email}</strong> to arrange a tailored session.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Full Name <span className="text-orange-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={demoForm.fullName}
                        onChange={(e) => setDemoForm({ ...demoForm, fullName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white placeholder:text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Organisation Name <span className="text-orange-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Springfield High School"
                        value={demoForm.organisationName}
                        onChange={(e) => setDemoForm({ ...demoForm, organisationName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Designation / Role
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Athletic Director / Principal"
                        value={demoForm.designation}
                        onChange={(e) => setDemoForm({ ...demoForm, designation: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white placeholder:text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Business Email <span className="text-orange-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="john@organisation.edu"
                        value={demoForm.email}
                        onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={demoForm.phone}
                        onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white placeholder:text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. United States, United Kingdom, India"
                        value={demoForm.country}
                        onChange={(e) => setDemoForm({ ...demoForm, country: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Organisation Type
                      </label>
                      <select
                        value={demoForm.organisationType}
                        onChange={(e) => setDemoForm({ ...demoForm, organisationType: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white"
                      >
                        <option>School / Educational Institution</option>
                        <option>University / College</option>
                        <option>Sports Academy</option>
                        <option>Sports Club</option>
                        <option>Fitness Centre</option>
                        <option>Corporate Wellness</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Approximate Participants
                      </label>
                      <select
                        value={demoForm.participantCount}
                        onChange={(e) => setDemoForm({ ...demoForm, participantCount: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white"
                      >
                        <option>Under 100</option>
                        <option>100 - 500</option>
                        <option>500 - 2,000</option>
                        <option>2,000 - 10,000</option>
                        <option>10,000+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Primary Programme Objective
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Student daily physical activity benchmark & compliance tracking"
                      value={demoForm.primaryObjective}
                      onChange={(e) => setDemoForm({ ...demoForm, primaryObjective: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Additional Requirements / Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Share details on your preferred wearable devices, timeline, or deployment model..."
                      value={demoForm.additionalRequirements}
                      onChange={(e) => setDemoForm({ ...demoForm, additionalRequirements: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-orange-500 text-white placeholder:text-slate-600 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? "Submitting Request..." : "Submit Demo Request"}</span>
                  </button>

                  <p className="text-center text-[11px] text-slate-500 mt-2">
                    Our team will contact you to discuss your requirements and arrange a suitable demonstration.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          WEBSITE FOOTER (No admin links, matching exact specification)
         ========================================================================= */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 sm:px-6 lg:px-8 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                  <img
                    src="/brand/png/raysfit-icon-76.png"
                    alt="RaysFit"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-extrabold text-base text-white tracking-wider">
                  RaysFit
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Wearable Intelligence &amp; Benchmarking Platform
              </p>
              <p className="text-[11px] text-slate-500">
                A product of <strong className="text-slate-400">Rays Sports Network Inc.</strong>
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
              <a href="#home" className="hover:text-orange-400 transition-colors">Home</a>
              <a href="#platform" className="hover:text-orange-400 transition-colors">Platform</a>
              <a href="#benchmarking" className="hover:text-orange-400 transition-colors">Benchmarking</a>
              <a href="#solutions" className="hover:text-orange-400 transition-colors">Solutions</a>
              <a href="#devices" className="hover:text-orange-400 transition-colors">Devices</a>
              <a href="#partnerships" className="hover:text-orange-400 transition-colors">Partnerships</a>
              <a href="#about" className="hover:text-orange-400 transition-colors">About</a>
              <a href="#contact" className="hover:text-orange-400 transition-colors">Contact</a>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              &copy; 2026 Rays Sports Network Inc. All rights reserved.
            </div>

            <div className="flex items-center gap-6">
              <a href="#contact" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
              <a href="#contact" className="hover:text-slate-400 transition-colors">Terms of Use</a>
              <a href="#contact" className="hover:text-slate-400 transition-colors">Contact Us</a>
            </div>
          </div>

          <div className="text-center pt-2 text-[11px] font-semibold text-slate-600">
            RaysFit &ndash; Turn Wearable Data Into Meaningful Progress.
          </div>
        </div>
      </footer>
    </div>
  );
}
