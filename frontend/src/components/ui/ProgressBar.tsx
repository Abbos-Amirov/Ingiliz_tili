"use client";

import { motion } from "framer-motion";

export function ProgressBar({ value, total, label }: { value: number; total: number; label?: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm font-medium text-foreground/70 mb-1.5">
          <span>{label}</span>
          <span>
            {value}/{total}
          </span>
        </div>
      )}
      <div className="h-2.5 w-full rounded-full bg-surface-muted overflow-hidden">
        <motion.div
          className="h-full gradient-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
