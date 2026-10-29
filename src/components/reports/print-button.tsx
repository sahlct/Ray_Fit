"use client";

import React from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="gap-2 text-xs font-semibold border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white"
    >
      <Printer className="w-4 h-4" />
      <span>Print Official PDF</span>
    </Button>
  );
}
