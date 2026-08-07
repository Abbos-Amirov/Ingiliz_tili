"use client";

import { useState } from "react";
import { parseFormula } from "@/lib/formula";
import { ROLE_COLORS } from "@/lib/roleColors";
import { RoleInfoModal } from "./RoleInfoModal";
import type { GrammarRole } from "@/lib/types";

/** Renders a grammar formula like FormulaBar does, with each token's Korean
 * role label underneath — reused across the grammar hub, cards, and detail page.
 * Tokens are clickable (opening RoleInfoModal) except at size="sm", which is
 * always rendered inside a card <Link> — nesting a <button> there would be
 * invalid HTML and would fight the card's own navigation on click. */
export function GrammarFormula({ formula, size = "md" }: { formula: string; size?: "sm" | "md" | "lg" }) {
  const [openRole, setOpenRole] = useState<GrammarRole | null>(null);
  const tokens = parseFormula(formula);
  const textClass = size === "lg" ? "text-2xl sm:text-3xl" : size === "sm" ? "text-xs" : "text-sm";
  const labelClass = size === "lg" ? "text-[11px] mt-1" : "text-[9px] mt-0.5";
  const gapClass = size === "lg" ? "gap-x-1.5 gap-y-1.5" : "gap-x-1 gap-y-1";
  const clickable = size !== "sm";

  return (
    <div className={`flex flex-wrap items-start justify-center ${gapClass} font-bold`}>
      {tokens.map((token, i) => {
        const inner = (
          <span className="flex flex-col items-center leading-none">
            <span
              className={`${textClass} ${!token.role ? "text-foreground/60" : ""}`}
              style={{ color: token.role ? ROLE_COLORS[token.role].text : undefined }}
            >
              {token.text}
            </span>
            {token.role && size !== "sm" && (
              <span className={`${labelClass} font-medium`} style={{ color: ROLE_COLORS[token.role].text }}>
                {ROLE_COLORS[token.role].label}
              </span>
            )}
          </span>
        );

        return (
          <span key={i} className="flex items-start gap-1">
            {token.role && clickable ? (
              <button
                type="button"
                onClick={() => setOpenRole(token.role)}
                className="rounded-lg border px-1.5 py-0.5 -my-0.5 transition-colors hover:brightness-95 cursor-pointer"
                style={{
                  borderColor: `${ROLE_COLORS[token.role].text}33`,
                  backgroundColor: `${ROLE_COLORS[token.role].text}0d`,
                }}
              >
                {inner}
              </button>
            ) : (
              inner
            )}
            {i < tokens.length - 1 && <span className="text-foreground/30 mt-px">+</span>}
          </span>
        );
      })}
      {clickable && <RoleInfoModal role={openRole} onClose={() => setOpenRole(null)} />}
    </div>
  );
}
