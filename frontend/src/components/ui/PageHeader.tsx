"use client";

import { motion } from "framer-motion";

export function PageHeader({
  title,
  subtitle,
  count,
  countLabel,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  countLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-col items-center gap-3">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-surface border border-border card-shadow px-6 py-4"
      >
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center">{title}</h1>
        {count !== undefined && (
          <span className="shrink-0 px-3 py-1 rounded-full gradient-primary text-white text-xs font-bold whitespace-nowrap">
            {count} {countLabel}
          </span>
        )}
      </motion.div>

      {subtitle && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl bg-surface-muted border border-border/60 px-4 py-2.5 max-w-lg"
        >
          <p className="text-foreground/60 text-sm sm:text-base text-center">{subtitle}</p>
        </motion.div>
      )}
    </div>
  );
}
