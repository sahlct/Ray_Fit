"use client";

import React, { useState } from "react";
import { Bell, RefreshCw, CheckCircle2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { useNav } from "@/components/navigation/nav-context";

interface TenantHeaderProps {
  title: string;
  subtitle?: string;
  tenantSlug: string;
}

export function TenantHeader({ title, subtitle, tenantSlug }: TenantHeaderProps) {
  const { toggleMobile } = useNav();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState(false);

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    setEvalSuccess(false);
    try {
      const res = await fetch(`/api/${tenantSlug}/evaluations/run`, {
        method: "POST",
      });
      if (res.ok) {
        setEvalSuccess(true);
        setTimeout(() => setEvalSuccess(false), 3000);
        window.location.reload();
      }
    } catch (err) {
      console.error("Evaluation run failed:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md transition-colors print:hidden">
      <div className="flex items-center min-w-0 mr-3">
        {/* Mobile Hamburger Drawer Button */}
        <button
          type="button"
          onClick={toggleMobile}
          className="lg:hidden p-2 -ml-1 mr-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title="Open navigation menu"
        >
          <Menu className="w-5 h-5 text-orange-500" />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Run Daily Evaluation Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRunEvaluation}
          disabled={isEvaluating}
          className="gap-1.5 sm:gap-2 border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 font-semibold text-xs h-9 px-2.5 sm:px-3"
        >
          {evalSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Evaluated!</span>
            </>
          ) : (
            <>
              <RefreshCw
                className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">
                {isEvaluating ? "Evaluating..." : "Run Daily Check"}
              </span>
              <span className="sm:hidden">Run Check</span>
            </>
          )}
        </Button>

        {/* Live sync badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Bands Active</span>
        </div>

        {/* Light & Dark Theme Toggle */}
        <ThemeToggle />

        <button
          className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer border border-slate-200 dark:border-slate-800"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
        </button>
      </div>
    </header>
  );
}
