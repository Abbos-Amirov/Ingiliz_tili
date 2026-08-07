"use client";

import { Modal } from "@/components/ui/Modal";
import { useT } from "@/hooks/useT";
import { ROLE_COLORS } from "@/lib/roleColors";
import { ROLE_GUIDE_EXAMPLES } from "@/lib/roleGuide";
import type { GrammarRole } from "@/lib/types";

/** Explains a grammar role (Subject, Verb, Object, ...) when its formula
 * token is tapped — description in the current UI language, plus example
 * filler-words and demo sentences. */
export function RoleInfoModal({ role, onClose }: { role: GrammarRole | null; onClose: () => void }) {
  const t = useT("roleGuide");

  if (!role) return null;
  const color = ROLE_COLORS[role];
  const guide = ROLE_GUIDE_EXAMPLES[role];

  return (
    <Modal open={Boolean(role)} onClose={onClose} title={color.label}>
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-foreground/80">{t[role]}</p>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-2">{t.examplesTitle}</p>
          <div className="flex flex-wrap gap-2">
            {guide.examples.map((ex, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: color.bg, color: color.text }}
              >
                {ex}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50 mb-2">{t.sentencesTitle}</p>
          <div className="space-y-2">
            {guide.sentences.map((s, i) => (
              <div key={i} className="rounded-xl bg-surface-muted p-3">
                <p className="font-semibold text-sm">{s.english}</p>
                <p className="text-sm text-foreground/70">{s.korean}</p>
                <p className="text-xs text-foreground/50">{s.uzbek}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
