"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface TableToolbarProps {
  searchQuery?: string;
  searchValue?: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  limit: number;
  onLimitChange: (limit: number) => void;
  limitOptions?: number[];
  totalItems?: number;
  totalCount?: number;
  recordLabel?: string;
  filterSlot?: React.ReactNode;
  filters?: React.ReactNode;
  actionSlot?: React.ReactNode;
}

export function TableToolbar({
  searchQuery,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search records...",
  limit,
  onLimitChange,
  limitOptions = [10, 25, 50, 100],
  totalItems,
  totalCount,
  recordLabel = "records",
  filterSlot,
  filters,
  actionSlot,
}: TableToolbarProps) {
  const currentSearch = searchQuery ?? searchValue ?? "";
  const total = totalItems ?? totalCount;
  const currentFilters = filterSlot ?? filters;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
      {/* Search and Limit Controls */}
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <Input
            value={currentSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Limit Dropdown */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Show:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none cursor-pointer"
          >
            {limitOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} per page
              </option>
            ))}
          </select>
        </div>

        {/* Additional Filters */}
        {currentFilters}
      </div>

      {/* Action Buttons & Counter */}
      <div className="flex items-center gap-3 shrink-0">
        {total !== undefined && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {total} total {recordLabel}
          </span>
        )}
        {actionSlot}
      </div>
    </div>
  );
}

export interface TablePaginationProps {
  currentPage?: number;
  page?: number;
  totalPages: number;
  totalItems?: number;
  totalCount?: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function TablePagination({
  currentPage,
  page,
  totalPages,
  totalItems,
  totalCount,
  limit,
  onPageChange,
  onLimitChange,
}: TablePaginationProps) {
  const activePage = currentPage ?? page ?? 1;
  const total = totalItems ?? totalCount ?? 0;
  if (total === 0) return null;

  const startItem = (activePage - 1) * limit + 1;
  const endItem = Math.min(activePage * limit, total);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (activePage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (activePage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", activePage - 1, activePage, activePage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
      <div className="text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold text-slate-900 dark:text-white">{startItem}</span> to{" "}
        <span className="font-semibold text-slate-900 dark:text-white">{endItem}</span> of{" "}
        <span className="font-semibold text-slate-900 dark:text-white">{total}</span> entries
      </div>

      <div className="flex items-center gap-1.5">
        {/* First & Prev */}
        <Button
          size="sm"
          variant="outline"
          disabled={activePage <= 1}
          onClick={() => onPageChange(1)}
          className="h-8 w-8 p-0"
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={activePage <= 1}
          onClick={() => onPageChange(activePage - 1)}
          className="h-8 px-2.5 gap-1 text-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </Button>

        {/* Numeric page buttons */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`dots-${idx}`} className="px-1 text-slate-400">
                  ...
                </span>
              );
            }
            const isCurrent = p === activePage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(Number(p))}
                className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next & Last */}
        <Button
          size="sm"
          variant="outline"
          disabled={activePage >= totalPages}
          onClick={() => onPageChange(activePage + 1)}
          className="h-8 px-2.5 gap-1 text-xs"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={activePage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="h-8 w-8 p-0"
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
