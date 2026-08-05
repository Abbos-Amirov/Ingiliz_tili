"use client";

import { motion } from "framer-motion";
import type { GrammarRole } from "@/lib/types";
import { ROLE_COLORS } from "@/lib/roleColors";

interface WordChipProps {
  text: string;
  role: GrammarRole;
  variant?: "pool" | "placed" | "wrong";
  showLabel?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function WordChip({ text, role, variant = "pool", showLabel = false, onClick, disabled }: WordChipProps) {
  const color = ROLE_COLORS[role];
  const isWrong = variant === "wrong";

  return (
    <motion.div layout="position" className="flex flex-col items-center gap-1">
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.35 }}
        whileTap={{ scale: 0.95 }}
        style={
          isWrong
            ? undefined
            : {
                backgroundColor: variant === "placed" ? color.bg : `${color.bg}99`,
                color: color.text,
                borderColor: `${color.text}30`,
              }
        }
        className={`min-h-11 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm sm:text-base select-none transition-colors ${
          isWrong ? "bg-danger-soft border-danger text-danger" : "hover:brightness-95"
        }`}
      >
        {text}
      </motion.button>
      {showLabel && !isWrong && (
        <span
          className="text-[10px] font-bold uppercase tracking-wide leading-none"
          style={{ color: color.text }}
        >
          {color.label}
        </span>
      )}
    </motion.div>
  );
}
