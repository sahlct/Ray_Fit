"use client";

import React, { useState } from "react";
import { Bell, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

interface TenantHeaderProps {
  title: string;
  subtitle?: string;
  tenantSlug: string;
}

export function TenantHeader({ title, subtitle, tenantSlug }: TenantHeaderProps) {
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
    <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Run Daily Evaluation Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRunEvaluation}
          disabled={isEvaluating}
          className="gap-2 border-teal-500/40 text-teal-700 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20"
        >
          {evalSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Evaluated!</span>
            </>
          ) : (
            <>
              <RefreshCw
                className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`}
              />
              <span>{isEvaluating ? "Evaluating..." : "Run Daily Check"}</span>
            </>
          )}
        </Button>

        {/* Live sync badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/30">
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
