"use client";

import { motion } from "framer-motion";

export function PageHeader({
  title,
  subtitle,
  count,
  countLabel,
  compact,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  countLabel?: string;
  // Smaller text/padding for pages stacked with other intro chrome above the
  // fold (e.g. Memory Palace's back-link + tip cards) — on narrow phones the
  // full-size header alone could push all real content below the viewport.
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 ${compact ? "mb-3" : "mb-8"}`}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-surface border border-border card-shadow ${
          compact ? "px-4 py-2" : "px-6 py-4"
        }`}
      >
        <h1 className={`font-extrabold text-center ${compact ? "text-base sm:text-lg" : "text-2xl sm:text-3xl"}`}>{title}</h1>
        {count !== undefined && (
          <span
            className={`shrink-0 rounded-full gradient-primary text-white font-bold whitespace-nowrap ${
              compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
            }`}
          >
            {count} {countLabel}
          </span>
        )}
      </motion.div>

      {subtitle && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`rounded-xl bg-surface-muted border border-border/60 max-w-lg ${compact ? "px-3 py-1.5" : "px-4 py-2.5"}`}
        >
          <p className={`text-foreground/60 text-center ${compact ? "text-xs" : "text-sm sm:text-base"}`}>{subtitle}</p>
        </motion.div>
      )}
    </div>
  );
}
