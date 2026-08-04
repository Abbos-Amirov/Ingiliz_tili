"use client";

import { motion } from "framer-motion";

interface WordChipProps {
  text: string;
  variant?: "pool" | "placed" | "wrong";
  onClick?: () => void;
  disabled?: boolean;
}

export function WordChip({ text, variant = "pool", onClick, disabled }: WordChipProps) {
  const variantClasses: Record<NonNullable<WordChipProps["variant"]>, string> = {
    pool: "bg-surface border-border hover:border-primary hover:bg-surface-muted",
    placed: "bg-primary/10 border-primary text-primary",
    wrong: "bg-danger-soft border-danger text-danger",
  };

  return (
    <motion.button
      layout
      type="button"
      onClick={onClick}
      disabled={disabled}
      animate={variant === "wrong" ? { x: [0, -6, 6, -4, 4, 0] } : {}}
      transition={{ duration: 0.35 }}
      whileTap={{ scale: 0.95 }}
      className={`min-h-11 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm sm:text-base select-none transition-colors ${variantClasses[variant]}`}
    >
      {text}
    </motion.button>
  );
}
