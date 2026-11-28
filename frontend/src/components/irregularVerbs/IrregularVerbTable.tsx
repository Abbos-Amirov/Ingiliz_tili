"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { IrregularVerb } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { useT, useLocale } from "@/hooks/useT";
import { irregularVerbTranslation } from "@/lib/contentLocale";
import { playAudio } from "@/lib/tts";
import { PlayAllButton, TextbookAudioContext } from "@/components/textbook/PronunciationButton";

// Groups follow the textbook's verb tables: ① regular, ② A-B-B, ③ A-A-A,
// ④ A-B-A, ⑤ A-B-C (by comparing the three forms).
type Pattern = "regular" | "abb" | "aaa" | "aba" | "abc";
const PATTERN_ORDER: Pattern[] = ["regular", "abb", "aaa", "aba", "abc"];

function patternOf(v: IrregularVerb): Pattern {
  if (v.regular) return "regular";
  const [b, p, pp] = [v.base, v.past, v.participle].map((s) => s.trim().toLowerCase());
  if (b === p && p === pp) return "aaa";
  if (p === pp) return "abb";
  if (b === pp) return "aba";
  return "abc";
}

// How a form is read aloud — must match backend services/irregularVerbs.service.ts
// speakableForm ("was / were" → "was, were"; "-" → nothing).
function speakableForm(form: string | null | undefined): string {
  const f = (form ?? "").trim();
  if (!f || f === "-") return "";
  return f
    .split(/\s*[/,]\s*/)
    .filter(Boolean)
    .join(", ");
}

// A verb form you can tap to hear.
function Speakable({ form, strong }: { form: string | undefined; strong?: boolean }) {
  const audio = useContext(TextbookAudioContext);
  const text = speakableForm(form);
  if (!text) return <span className="text-foreground/40">{form || "—"}</span>;
  return (
    <button
      type="button"
      onClick={() => playAudio(audio[text], text, "en-US")}
      className={`group inline-flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 -mx-1.5 text-left hover:bg-primary/10 ${strong ? "font-semibold" : ""}`}
    >
      {form}
      <span aria-hidden className="text-[11px] opacity-35 group-hover:opacity-100">
        🔊
      </span>
    </button>
  );
}

const chant = (list: IrregularVerb[]) =>
  list.flatMap((v) => [v.base, v.past, v.participle].map(speakableForm).filter(Boolean));

export function IrregularVerbTable() {
  const t = useT("irregularVerbs");
  const { locale } = useLocale();
  const [verbs, setVerbs] = useState<IrregularVerb[]>([]);
  const [audio, setAudio] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ verbs: IrregularVerb[]; audio?: Record<string, string> }>("/irregular-verbs?limit=500")
      .then((res) => {
        setVerbs(res.verbs);
        setAudio(res.audio ?? {});
      })
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => {
    const map = new Map<Pattern, IrregularVerb[]>();
    for (const v of verbs) {
      const p = patternOf(v);
      map.set(p, [...(map.get(p) ?? []), v]);
    }
    return PATTERN_ORDER.filter((p) => map.has(p)).map((p) => [p, map.get(p)!] as const);
  }, [verbs]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (verbs.length === 0) {
    return <p className="text-center py-20 text-foreground/60">{t.empty}</p>;
  }

  return (
    <TextbookAudioContext.Provider value={audio}>
      <div className="space-y-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground/55">{t.tapToListen}</p>
          <PlayAllButton texts={groups.flatMap(([, list]) => chant(list))} />
        </div>

        {groups.map(([pattern, list]) => {
          const hasIng = list.some((v) => v.ing);
          return (
            <div key={pattern}>
              <div className="mb-2 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold">
                    {t.patterns[pattern].title} <span className="text-foreground/45">({list.length})</span>
                  </h2>
                  <p className="text-xs text-foreground/55">{t.patterns[pattern].note}</p>
                </div>
                <PlayAllButton variant="icon" className="bg-primary/10 text-primary hover:bg-primary/20 h-9 w-9" texts={chant(list)} label={`${t.patterns[pattern].title}`} />
              </div>
              <Card className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-foreground/50 border-b border-border">
                      <th className="px-4 py-3 font-medium">{t.base}</th>
                      <th className="px-4 py-3 font-medium">{t.past}</th>
                      <th className="px-4 py-3 font-medium">{t.participle}</th>
                      {hasIng && <th className="px-4 py-3 font-medium">{t.ing}</th>}
                      <th className="px-4 py-3 font-medium">{t.korean}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((v) => (
                      <tr key={v._id} className="border-b border-border last:border-0 hover:bg-surface-muted/60">
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Speakable form={v.base} strong />
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Speakable form={v.past} />
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Speakable form={v.participle} />
                        </td>
                        {hasIng && (
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {v.ing ? <Speakable form={v.ing} /> : <span className="text-foreground/30">—</span>}
                          </td>
                        )}
                        <td className="px-4 py-2.5 min-w-[7rem]">{irregularVerbTranslation(v, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          );
        })}
      </div>
    </TextbookAudioContext.Provider>
  );
}
