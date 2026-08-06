"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT, useLocale } from "@/hooks/useT";
import { useGrammarTopics } from "@/hooks/useGrammarTopics";
import type { GrammarTopic } from "@/lib/types";
import type { Locale } from "@/lib/i18n/translations";
import { localeLabels } from "@/lib/i18n/translations";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GrammarFormula } from "@/components/grammar/GrammarFormula";
import { GrammarPractice } from "@/components/grammar/GrammarPractice";
import { GrammarQuiz } from "@/components/grammar/GrammarQuiz";

const RULE_LOCALES: Locale[] = ["uz", "en", "ko"];

export default function GrammarTopicPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const t = useT("grammar");
  const { locale } = useLocale();
  const { fetchTopic } = useGrammarTopics();

  const [topic, setTopic] = useState<GrammarTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [ruleLocale, setRuleLocale] = useState<Locale>(locale);
  const [practiceOpen, setPracticeOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user || !params.id) return;
    fetchTopic(params.id)
      .then((res) => setTopic(res.topic))
      .finally(() => setLoading(false));
  }, [user, params.id, fetchTopic]);

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/grammar" className="text-sm text-foreground/50 hover:text-foreground">
          {t.backToHub}
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : !topic ? (
          <p className="text-center py-20 text-foreground/60">{t.empty}</p>
        ) : (
          <div className="space-y-6 mt-6">
            {/* a) Title + formula */}
            <Card className="p-8 text-center">
              <h1 className="text-2xl font-extrabold mb-4">{topic.title[locale]}</h1>
              <GrammarFormula formula={topic.formula} size="lg" />
            </Card>

            {/* b) Rule explanation, with its own uz/en/ko switcher */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg">{t.ruleExplanationTitle}</h2>
                <div className="flex gap-1">
                  {RULE_LOCALES.map((l) => (
                    <button
                      key={l}
                      onClick={() => setRuleLocale(l)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        ruleLocale === l ? "bg-primary text-white" : "bg-surface-muted text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      {localeLabels[l].flag}
                    </button>
                  ))}
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={ruleLocale}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm leading-relaxed text-foreground/80"
                >
                  {topic.ruleExplanation[ruleLocale] || t.noContentYet}
                </motion.p>
              </AnimatePresence>
            </Card>

            {/* c) Usage cases */}
            {topic.usageCases.length > 0 && (
              <Card className="p-6">
                <h2 className="font-bold text-lg mb-4">{t.usageCasesTitle}</h2>
                <div className="space-y-3">
                  {topic.usageCases.map((uc, i) => (
                    <div key={i} className="rounded-xl bg-surface-muted p-3.5">
                      <p className="text-sm font-medium mb-1">{uc.uz}</p>
                      <p className="text-sm text-primary font-semibold">{uc.example}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* d) Related grammar comparison table */}
            {topic.relatedFormulas.length > 0 && (
              <Card className="p-6 overflow-x-auto">
                <h2 className="font-bold text-lg mb-4">{t.relatedFormulasTitle}</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-foreground/50 border-b border-border">
                      <th className="pb-2 pr-4 font-medium">{t.relatedFormulasCol}</th>
                      <th className="pb-2 font-medium">{t.relatedFormulasDiffCol}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topic.relatedFormulas.map((rf, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="py-2.5 pr-4">
                          <Link href={`/grammar/${rf.relatedTopicId}`} className="font-semibold text-primary hover:underline">
                            {rf.title}
                          </Link>
                        </td>
                        <td className="py-2.5 text-foreground/70">{rf.difference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            {/* e) Common mistakes */}
            {topic.commonMistakes.length > 0 && (
              <Card className="p-6">
                <h2 className="font-bold text-lg mb-4">{t.commonMistakesTitle}</h2>
                <div className="space-y-3">
                  {topic.commonMistakes.map((cm, i) => (
                    <div key={i} className="rounded-xl border border-border p-3.5">
                      <p className="text-danger font-medium text-sm mb-1">✗ {cm.wrong}</p>
                      <p className="text-success font-medium text-sm mb-1.5">✓ {cm.correct}</p>
                      <p className="text-xs text-foreground/60">{cm.explanation}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* f) Examples */}
            {topic.examples.length > 0 && (
              <Card className="p-6">
                <h2 className="font-bold text-lg mb-4">{t.examplesTitle}</h2>
                <div className="space-y-3">
                  {topic.examples.map((ex, i) => (
                    <div key={i} className="rounded-xl bg-surface-muted p-3.5 space-y-0.5">
                      <p className="font-semibold text-sm">{ex.english}</p>
                      <p className="text-sm text-foreground/70">{ex.korean}</p>
                      <p className="text-xs text-foreground/50">{ex.uzbek}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* g) Practice — reuses the existing Sentence Building component */}
            <div>
              <div className="flex justify-center mb-4">
                <Button onClick={() => setPracticeOpen((v) => !v)} variant={practiceOpen ? "secondary" : "primary"}>
                  {practiceOpen ? t.practiceClose : `📝 ${t.practiceBtn}`}
                </Button>
              </div>
              <AnimatePresence>
                {practiceOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <GrammarPractice formula={topic.formula} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* h) Quick quiz */}
            <GrammarQuiz topicId={topic._id} formula={topic.formula} />
          </div>
        )}
      </div>
    </div>
  );
}
