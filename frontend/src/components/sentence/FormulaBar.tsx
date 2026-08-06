"use client";

import { motion } from "framer-motion";
import { parseFormula } from "@/lib/formula";
import { ROLE_COLORS } from "@/lib/roleColors";

export function FormulaBar({ formula, pulseKey }: { formula: string; pulseKey: number }) {
  if (!formula) return null;
  const tokens = parseFormula(formula);

  return (
    <motion.div
      key={pulseKey}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 0.35 }}
      className="flex flex-wrap items-start justify-center gap-x-1.5 gap-y-2 text-sm font-bold"
    >
      <span className="text-foreground/40 font-semibold text-xs uppercase tracking-wide mr-1 self-center">
        Formula:
      </span>
      {tokens.map((token, i) => (
        <span key={i} className="flex items-start gap-1.5">
          <span className="flex flex-col items-center leading-none">
            <span style={{ color: token.role ? ROLE_COLORS[token.role].text : undefined }} className={!token.role ? "text-foreground/60" : ""}>
              {token.text}
            </span>
            {token.role && (
              <span className="text-[10px] font-medium mt-1" style={{ color: ROLE_COLORS[token.role].text }}>
                {ROLE_COLORS[token.role].label}
              </span>
            )}
          </span>
          {i < tokens.length - 1 && <span className="text-foreground/30 mt-px">+</span>}
        </span>
      ))}
    </motion.div>
  );
}
