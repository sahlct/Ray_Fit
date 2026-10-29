"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Determine active theme from document class or localStorage
    const savedTheme = localStorage.getItem("rayfit_theme") as "light" | "dark" | null;
    const isDarkClass = document.documentElement.classList.contains("dark");
    const initial = savedTheme || (isDarkClass ? "dark" : "light");
    setTheme(initial);

    // Keep all ThemeToggle buttons across the application perfectly in sync
    const handleThemeChange = (e: CustomEvent<"light" | "dark">) => {
      setTheme(e.detail);
    };

    window.addEventListener("rayfit-theme-change", handleThemeChange as EventListener);
    return () => {
      window.removeEventListener("rayfit-theme-change", handleThemeChange as EventListener);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("rayfit_theme", nextTheme);
    } catch (_) {}

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }

    // Broadcast theme update to all other toggle buttons
    window.dispatchEvent(
      new CustomEvent("rayfit-theme-change", { detail: nextTheme })
    );
  };

  const isDark = mounted ? theme === "dark" : true;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      suppressHydrationWarning
      className={`p-2 rounded-xl transition-colors border flex items-center justify-center cursor-pointer ${
        isDark
          ? "bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-slate-700/80 hover:text-amber-200 shadow-sm"
          : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:text-slate-900 shadow-sm"
      } ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
