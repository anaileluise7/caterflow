import React from "react";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  "New": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
  "Quoted": "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  "Tasting Booked": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30",
  "Confirmed": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  "Declined": "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
};

export function StatusBadge({ status, className }) {
  const styles = STATUS_STYLES[status] || STATUS_STYLES["New"];
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap",
      styles, className
    )}>
      {status}
    </span>
  );
}