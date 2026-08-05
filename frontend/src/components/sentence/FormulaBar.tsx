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
      className="flex flex-wrap items-center justify-center gap-1.5 text-sm font-bold"
    >
      <span className="text-foreground/40 font-semibold text-xs uppercase tracking-wide mr-1">Formula:</span>
      {tokens.map((token, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span style={{ color: token.role ? ROLE_COLORS[token.role].text : undefined }} className={!token.role ? "text-foreground/60" : ""}>
            {token.text}
          </span>
          {i < tokens.length - 1 && <span className="text-foreground/30">+</span>}
        </span>
      ))}
    </motion.div>
  );
}
