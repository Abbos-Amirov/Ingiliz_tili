"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { parseFormula } from "@/lib/formula";
import { ROLE_COLORS } from "@/lib/roleColors";
import { RoleInfoModal } from "@/components/grammar/RoleInfoModal";
import type { GrammarRole } from "@/lib/types";

export function FormulaBar({ formula, pulseKey }: { formula: string; pulseKey: number }) {
  const [openRole, setOpenRole] = useState<GrammarRole | null>(null);
  if (!formula) return null;
  const tokens = parseFormula(formula);

  return (
    <>
      <motion.div
        key={pulseKey}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 0.35 }}
        className="flex flex-wrap items-start justify-center gap-x-1 gap-y-2 text-sm font-bold"
      >
        <span className="text-foreground/40 font-semibold text-xs uppercase tracking-wide mr-1 self-center">
          Formula:
        </span>
        {tokens.map((token, i) =>
          token.role ? (
            <span key={i} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOpenRole(token.role)}
                className="flex flex-col items-center leading-none rounded-lg border px-2 py-1 transition-colors hover:brightness-95 cursor-pointer"
                style={{
                  borderColor: `${ROLE_COLORS[token.role].text}33`,
                  backgroundColor: `${ROLE_COLORS[token.role].text}0d`,
                }}
              >
                <span style={{ color: ROLE_COLORS[token.role].text }}>{token.text}</span>
                <span className="text-[10px] font-medium mt-0.5" style={{ color: ROLE_COLORS[token.role].text }}>
                  {ROLE_COLORS[token.role].label}
                </span>
              </button>
              {i < tokens.length - 1 && <span className="text-foreground/30">+</span>}
            </span>
          ) : (
            <span key={i} className="flex items-center gap-1">
              <span className="text-foreground/60 px-1">{token.text}</span>
              {i < tokens.length - 1 && <span className="text-foreground/30">+</span>}
            </span>
          ),
        )}
      </motion.div>
      <RoleInfoModal role={openRole} onClose={() => setOpenRole(null)} />
    </>
  );
}
