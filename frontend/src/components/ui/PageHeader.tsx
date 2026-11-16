"use client";

import { motion } from "framer-motion";
import { Asterisk, DotGrid, Ring, Squiggle } from "@/components/ui/Shapes";

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
  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1 mb-3">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex flex-wrap items-center justify-center gap-2"
        >
          <Asterisk size={14} color="var(--gold)" />
          <h1 className="font-bold text-center text-lg sm:text-xl">{title}</h1>
          {count !== undefined && (
            <span className="shrink-0 rounded-full bg-ink text-gold px-2 py-0.5 text-[10px] font-bold whitespace-nowrap">
              {count} {countLabel}
            </span>
          )}
        </motion.div>
        {subtitle && <p className="text-foreground/60 text-center text-xs max-w-lg">{subtitle}</p>}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-3 mb-9 pt-2">
      {/* decorative shapes framing the title */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="pointer-events-none absolute -top-1 left-1/2 -translate-x-[calc(50%+9rem)] hidden sm:block"
      >
        <Ring size={34} stroke={10} color="color-mix(in srgb, var(--gold) 55%, transparent)" />
      </motion.div>
      <motion.div
        aria-hidden
        initial={{ opacity: 0, rotate: -45 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.6 }}
        className="pointer-events-none absolute top-6 left-1/2 translate-x-[calc(-50%+10rem)] hidden sm:block"
      >
        <DotGrid cols={4} rows={3} gap={10} dot={2} color="color-mix(in srgb, var(--brand) 35%, transparent)" />
      </motion.div>

      <motion.span
        initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 15 }}
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink shadow-[0_10px_24px_-10px_rgba(27,16,53,0.6)] dark:ring-1 dark:ring-white/15"
      >
        <Asterisk size={22} color="var(--gold)" />
      </motion.span>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col items-center"
      >
        <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <h1 className="font-bold text-center text-3xl sm:text-4xl">{title}</h1>
          {count !== undefined && (
            <span className="shrink-0 rounded-full bg-ink text-gold px-3 py-1 text-xs font-bold whitespace-nowrap">
              {count} {countLabel}
            </span>
          )}
        </div>
        <Squiggle width={84} stroke={5} color="var(--gold)" className="mt-2" />
      </motion.div>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-foreground/65 text-center text-sm sm:text-base max-w-lg leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
