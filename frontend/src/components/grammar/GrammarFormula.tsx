import { parseFormula } from "@/lib/formula";
import { ROLE_COLORS } from "@/lib/roleColors";

/** Renders a grammar formula like FormulaBar does, with each token's Korean
 * role label underneath — reused across the grammar hub, cards, and detail page. */
export function GrammarFormula({ formula, size = "md" }: { formula: string; size?: "sm" | "md" | "lg" }) {
  const tokens = parseFormula(formula);
  const textClass = size === "lg" ? "text-2xl sm:text-3xl" : size === "sm" ? "text-xs" : "text-sm";
  const labelClass = size === "lg" ? "text-[11px] mt-1" : "text-[9px] mt-0.5";
  const gapClass = size === "lg" ? "gap-x-2 gap-y-1.5" : "gap-x-1 gap-y-1";

  return (
    <div className={`flex flex-wrap items-start justify-center ${gapClass} font-bold`}>
      {tokens.map((token, i) => (
        <span key={i} className="flex items-start gap-1">
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
          {i < tokens.length - 1 && <span className="text-foreground/30 mt-px">+</span>}
        </span>
      ))}
    </div>
  );
}
