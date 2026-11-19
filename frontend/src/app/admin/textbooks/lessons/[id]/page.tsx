"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { AdminIcon } from "@/components/admin/AdminIcons";
import { tf, useAdminT } from "@/hooks/useAdminT";
import {
  GRAMMAR_TYPES,
  KEYWORD_POS,
  TRANSFORMS,
  VERB_TYPES,
  type AdminLesson,
} from "@/lib/adminTextbook";

const card =
  "rounded-3xl bg-white p-5 shadow-[0_10px_30px_-18px_rgba(76,29,149,0.35)] dark:bg-surface sm:p-6";
const inputCls =
  "w-full rounded-xl border border-[#e7defb] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7c3aed]/30 dark:border-border dark:bg-surface-muted";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_20px_-12px_rgba(124,58,237,0.9)] transition hover:bg-[#6d28d9] disabled:opacity-50";
const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#f3effd] px-4 py-2 text-sm font-bold text-[#5b21b6] transition hover:bg-[#ebe3fd] disabled:opacity-50 dark:bg-surface-muted dark:text-[#c4b5fd]";
const smallBtn =
  "inline-flex items-center gap-1.5 rounded-full border border-[#e7defb] px-3 py-1.5 text-xs font-bold text-[#6d28d9] hover:bg-[#faf7ff] dark:border-border dark:text-[#c4b5fd] dark:hover:bg-surface-muted";

const EDITABLE = [
  "lessonNumber",
  "title",
  "titleKo",
  "titleUz",
  "keywords",
  "puzzles",
  "storyQuestions",
  "verbClassificationQuiz",
  "selfTransform",
  "sentencePractice",
  "freeTalk",
  "aiWarnings",
] as const;

type Editable = Pick<AdminLesson, (typeof EDITABLE)[number]>;
const pickEditable = (l: AdminLesson): Editable =>
  Object.fromEntries(EDITABLE.map((k) => [k, l[k]])) as Editable;

let uid = 0;
const tmpKey = () => `tmp-${Date.now().toString(36)}-${++uid}`;
// Rows added in the editor get a temporary key for React; the server gives
// them their real stable key on save.
function stripTmpKeys<T>(value: T): T {
  return JSON.parse(JSON.stringify(value), (k, v) =>
    k === "key" && typeof v === "string" && v.startsWith("tmp-") ? "" : v
  );
}

// ─── small field components ───────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  invalid,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  invalid?: string;
}) {
  return (
    <label
      className={`block text-[11px] font-bold text-foreground/55 ${className}`}
    >
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} mt-1 font-normal text-foreground ${
          invalid ? "border-amber-400 ring-1 ring-amber-300" : ""
        }`}
      />
      {invalid && (
        <span className="mt-0.5 block font-semibold text-amber-700 dark:text-amber-300">
          {invalid}
        </span>
      )}
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  labels,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  labels: Record<string, string>;
}) {
  return (
    <label className="block text-[11px] font-bold text-foreground/55">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`${inputCls} mt-1 font-normal text-foreground`}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {labels[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}

// Accepted answers edited as "don't / do not". Keeps its own text while
// typing so a trailing " /" isn't swallowed.
function AnswersField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [text, setText] = useState(value.join(" / "));
  return (
    <label className="block text-[11px] font-bold text-foreground/55">
      {label}
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            e.target.value
              .split("/")
              .map((s) => s.trim())
              .filter(Boolean)
          );
        }}
        className={`${inputCls} mt-1 font-normal text-foreground ${
          value.length ? "" : "border-amber-400"
        }`}
      />
    </label>
  );
}

function Row({
  warn,
  onRemove,
  children,
  index,
}: {
  warn: string[];
  onRemove: () => void;
  children: ReactNode;
  index?: number;
}) {
  const t = useAdminT("tbEditor");
  return (
    <div
      className={`flex gap-2.5 rounded-2xl border p-3 ${
        warn.length
          ? "border-amber-300 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-500/5"
          : "border-[#efe9fc] dark:border-border"
      }`}
    >
      {index !== undefined && (
        <span className="mt-5 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-[#f3effd] px-1.5 text-xs font-extrabold text-[#6d28d9] dark:bg-surface-muted dark:text-[#c4b5fd]">
          {index + 1}
        </span>
      )}
      <div className="min-w-0 flex-1">
        {warn.map((w) => (
          <p
            key={w}
            className="mb-2 flex items-start gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300"
          >
            <AdminIcon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {w}
          </p>
        ))}
        {children}
      </div>
      <button
        onClick={onRemove}
        title={t.removeRow}
        className="mt-5 h-8 shrink-0 self-start rounded-lg p-1.5 text-foreground/35 hover:bg-danger-soft hover:text-danger"
      >
        <AdminIcon name="trash" className="h-4 w-4" />
      </button>
    </div>
  );
}

function Section({
  id,
  title,
  hint,
  count,
  warn,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  count?: number;
  warn: string[];
  children: ReactNode;
}) {
  return (
    <section id={id} className={`${card} scroll-mt-32`}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-sans text-lg font-extrabold">{title}</h2>
        {count !== undefined && (
          <span className="rounded-lg bg-[#f3effd] px-2 py-0.5 text-xs font-extrabold text-[#6d28d9] dark:bg-surface-muted dark:text-[#c4b5fd]">
            {count}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-foreground/55">{hint}</p>
      {warn.map((w) => (
        <p
          key={w}
          className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
        >
          <AdminIcon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {w}
        </p>
      ))}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────

function EditorContent() {
  const t = useAdminT("tbEditor");
  const en = useAdminT("tbEnums") as Record<string, string>;
  const common = useAdminT("common");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = useSearchParams().get("new") === "1";

  const [lesson, setLesson] = useState<AdminLesson | null>(null);
  const [draft, setDraft] = useState<Editable | null>(null);
  const [saved, setSaved] = useState<string>("");
  // Bumped whenever server data replaces the draft (load, save, cancel) so
  // inputs with their own local text (AnswersField) remount with fresh values.
  const [rev, setRev] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );

  const accept = useCallback((l: AdminLesson) => {
    const e = pickEditable(l);
    setLesson(l);
    setDraft(e);
    setSaved(JSON.stringify(e));
    setRev((r) => r + 1);
  }, []);

  useEffect(() => {
    apiFetch<{ lesson: AdminLesson }>(`/admin/textbook/lessons/${id}`, {
      admin: true,
    })
      .then((d) => accept(d.lesson))
      .catch(() => setLoadError(true));
  }, [id, accept]);

  const dirty = draft !== null && JSON.stringify(draft) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const edit = useCallback((fn: (d: Editable) => void) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setMsg(null);
  }, []);

  const warnings = useMemo(() => draft?.aiWarnings ?? [], [draft]);
  const warnAt = useCallback(
    (path: string, exact = false) =>
      warnings
        .filter(
          (w) => w.path === path || (!exact && w.path.startsWith(`${path}.`))
        )
        .map((w) => w.note),
    [warnings]
  );

  async function save(
    override?: Partial<Editable>
  ): Promise<AdminLesson | null> {
    if (!draft) return null;
    setBusy(true);
    setMsg(null);
    try {
      const body = stripTmpKeys({ ...draft, ...override });
      const { lesson } = await apiFetch<{ lesson: AdminLesson }>(
        `/admin/textbook/lessons/${id}`,
        {
          admin: true,
          method: "PUT",
          body: JSON.stringify(body),
        }
      );
      accept(lesson);
      setMsg({ kind: "ok", text: t.saved });
      return lesson;
    } catch (e) {
      setMsg({
        kind: "err",
        text: e instanceof ApiError ? e.message : common.saveError,
      });
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function setPublished(publish: boolean) {
    if (!confirm(publish ? t.publishConfirm : t.unpublishConfirm)) return;
    if (dirty && !(await save())) return;
    setBusy(true);
    try {
      const { lesson } = await apiFetch<{ lesson: AdminLesson }>(
        `/admin/textbook/lessons/${id}/publish`,
        {
          admin: true,
          method: "POST",
          body: JSON.stringify({ publish }),
        }
      );
      accept(lesson);
      setMsg({ kind: "ok", text: publish ? t.statusPublished : t.statusDraft });
    } catch (e) {
      setMsg({
        kind: "err",
        text: e instanceof ApiError ? e.message : common.saveError,
      });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(t.deleteConfirm)) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/textbook/lessons/${id}`, {
        admin: true,
        method: "DELETE",
      });
      router.push("/admin/textbooks");
    } catch (e) {
      setMsg({
        kind: "err",
        text: e instanceof ApiError ? e.message : common.deleteError,
      });
      setBusy(false);
    }
  }

  // "keywords.10.pronunciationKo" → "Keywords · 11 · Pronunciation (Korean letters)"
  const SECTION_LABEL: Record<string, string> = {
    title: t.fTitle,
    titleKo: t.fTitleKo,
    titleUz: t.fTitleUz,
    lessonNumber: t.fLessonNumber,
    keywords: t.secKeywords,
    puzzles: t.secPuzzles,
    storyQuestions: t.secStory,
    verbClassificationQuiz: t.secQuiz,
    selfTransform: t.secSelf,
    sentencePractice: t.secPractice,
    freeTalk: t.secFreeTalk,
    shared: t.secShared,
  };
  const FIELD_LABEL: Record<string, string> = {
    word: t.fWord,
    pronunciationKo: t.fPron,
    korean: t.fKorean,
    uzbek: t.fUzbek,
    partOfSpeech: t.fPos,
    verbType: t.fVerbType,
    correctType: t.fVerbType,
    baseSentence: t.fBase,
    baseMeaningKo: t.fBaseKo,
    baseMeaningUz: t.fBaseUz,
    transform: t.fTransform,
    prompt: t.fPrompt,
    answers: t.fAnswers,
    hintKo: t.fHintKo,
    hintUz: t.fHintUz,
    question: t.fQuestion,
    meaningKo: t.fMeaningKo,
    meaningUz: t.fMeaningUz,
    grammarType: t.fGrammar,
    exampleI: t.fExI,
    exampleShe: t.fExShe,
    exampleHe: t.fExHe,
    exampleSentence: t.fExample,
    labelKo: t.fLabelKo,
    labelUz: t.fLabelUz,
    promptKo: t.fPromptKo,
    promptUz: t.fPromptUz,
    english: t.fEnglish,
  };
  const placeOf = (path: string) =>
    path
      ? path
          .split(".")
          .filter((p) => p !== "rows")
          .map((p) =>
            /^\d+$/.test(p)
              ? String(Number(p) + 1)
              : SECTION_LABEL[p] ?? FIELD_LABEL[p] ?? p
          )
          .join(" · ")
      : "—";

  if (loadError)
    return (
      <p className="rounded-2xl bg-danger-soft p-4 text-sm text-danger">
        {t.loadError}
      </p>
    );
  if (!lesson || !draft)
    return (
      <div className={`${card} mx-auto h-64 max-w-[1100px] animate-pulse`} />
    );

  const published = lesson.status === "published";
  const sections = [
    {
      id: "basics",
      label: t.secBasics,
      warn: ["title", "titleKo", "titleUz", "lessonNumber"].flatMap((p) =>
        warnAt(p)
      ).length,
    },
    {
      id: "keywords",
      label: t.secKeywords,
      n: draft.keywords.length,
      warn: warnAt("keywords").length,
    },
    {
      id: "puzzles",
      label: t.secPuzzles,
      n: draft.puzzles.reduce((a, p) => a + p.rows.length, 0),
      warn: warnAt("puzzles").length,
    },
    {
      id: "story",
      label: t.secStory,
      n: draft.storyQuestions.length,
      warn: warnAt("storyQuestions").length,
    },
    {
      id: "quiz",
      label: t.secQuiz,
      n: draft.verbClassificationQuiz.length,
      warn: warnAt("verbClassificationQuiz").length,
    },
    {
      id: "self",
      label: t.secSelf,
      n: draft.selfTransform.reduce((a, b) => a + b.rows.length, 0),
      warn: warnAt("selfTransform").length,
    },
    {
      id: "practice",
      label: t.secPractice,
      n: draft.sentencePractice.length,
      warn: warnAt("sentencePractice").length,
    },
    {
      id: "freetalk",
      label: t.secFreeTalk,
      n: draft.freeTalk.length,
      warn: warnAt("freeTalk").length,
    },
    { id: "shared", label: t.secShared, warn: warnAt("shared").length },
  ];

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 pb-24">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/admin/textbooks"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6d28d9] hover:underline dark:text-[#c4b5fd]"
          >
            <AdminIcon name="arrowLeft" className="h-4 w-4" />
            {t.back}
          </Link>
          <p className="mt-2 text-sm font-bold text-foreground/50">
            {tf(t.lessonOf, { level: lesson.level, n: lesson.lessonNumber })}
          </p>
          <h1 className="font-sans text-2xl font-extrabold tracking-tight sm:text-3xl">
            {draft.title || "—"}
          </h1>
          <span
            className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
              published
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                published ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {published ? t.statusPublished : t.statusDraft}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {published && (
            <a
              href={`/lessons/${lesson.level}/${lesson.lessonNumber}`}
              target="_blank"
              rel="noreferrer"
              className={ghostBtn}
            >
              <AdminIcon name="eye" className="h-4 w-4" />
              {t.preview}
            </a>
          )}
          <button
            onClick={() => setPublished(!published)}
            disabled={busy}
            className={published ? ghostBtn : primaryBtn}
          >
            <AdminIcon name={published ? "x" : "check"} className="h-4 w-4" />
            {published ? t.unpublish : t.publish}
          </button>
          <button
            onClick={remove}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-danger hover:bg-danger-soft"
          >
            <AdminIcon name="trash" className="h-4 w-4" />
            <span className="hidden sm:inline">{t.delete}</span>
          </button>
        </div>
      </div>

      {/* new-draft banner */}
      {(isNew || lesson.source === "ai") && !published && (
        <div className="rounded-3xl bg-gradient-to-br from-[#4c1d95] to-[#7c3aed] p-5 text-white">
          <p className="flex items-center gap-2 font-bold">
            <AdminIcon name="sparkles" className="h-5 w-5" />
            {t.newBannerTitle}
          </p>
          <p className="mt-1 text-sm text-white/80">{t.newBannerText}</p>
          {lesson.aiUsage && (
            <p className="mt-2 text-xs text-white/65">
              {tf(t.cost, {
                usd: lesson.aiUsage.usd.toFixed(2),
                inT: lesson.aiUsage.inputTokens.toLocaleString("en-US"),
                outT: lesson.aiUsage.outputTokens.toLocaleString("en-US"),
              })}
            </p>
          )}
        </div>
      )}

      {/* AI warnings */}
      {warnings.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <AdminIcon name="alert" className="h-5 w-5" />
                {tf(t.warningsTitle, { n: warnings.length })}
              </p>
              <p className="mt-0.5 text-sm text-amber-800/80 dark:text-amber-300/80">
                {t.warningsHint}
              </p>
            </div>
            <button
              onClick={() => void save({ aiWarnings: [] })}
              disabled={busy}
              className={smallBtn}
            >
              <AdminIcon name="check" className="h-3.5 w-3.5" />
              {t.warningsClear}
            </button>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-amber-900 dark:text-amber-200">
            {warnings.map((w, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                  {placeOf(w.path)}
                </span>
                <span>{w.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* section nav */}
      <nav className="sticky top-[57px] z-20 -mx-1 flex gap-1.5 overflow-x-auto bg-[#f3effd]/90 px-1 py-2 backdrop-blur dark:bg-background/90 lg:top-[69px]">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold shadow-[0_6px_16px_-12px_rgba(76,29,149,0.5)] hover:text-[#6d28d9] dark:bg-surface"
          >
            {s.label}
            {s.n !== undefined && (
              <span className="text-foreground/40">{s.n}</span>
            )}
            {s.warn > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-500" />
            )}
          </a>
        ))}
      </nav>

      <div key={rev} className="space-y-5">
        {/* basics */}
        <Section
          id="basics"
          title={t.secBasics}
          hint={t.basicsHint}
          warn={["title", "titleKo", "titleUz", "lessonNumber"].flatMap((p) =>
            warnAt(p)
          )}
        >
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <Field
              label={t.fLessonNumber}
              type="number"
              value={draft.lessonNumber}
              onChange={(v) => edit((d) => void (d.lessonNumber = Number(v)))}
            />
            <Field
              label={t.fTitle}
              value={draft.title}
              onChange={(v) => edit((d) => void (d.title = v))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t.fTitleKo}
              value={draft.titleKo}
              onChange={(v) => edit((d) => void (d.titleKo = v))}
            />
            <Field
              label={t.fTitleUz}
              value={draft.titleUz}
              onChange={(v) => edit((d) => void (d.titleUz = v))}
            />
          </div>
        </Section>

        {/* keywords */}
        <Section
          id="keywords"
          title={t.secKeywords}
          hint={t.keywordsHint}
          count={draft.keywords.length}
          warn={warnAt("keywords", true)}
        >
          {draft.keywords.map((k, i) => (
            <Row
              key={i}
              index={i}
              warn={warnAt(`keywords.${i}`)}
              onRemove={() => edit((d) => void d.keywords.splice(i, 1))}
            >
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <Field
                  label={t.fWord}
                  value={k.word}
                  onChange={(v) => edit((d) => void (d.keywords[i].word = v))}
                />
                <Field
                  label={t.fPron}
                  value={k.pronunciationKo}
                  onChange={(v) =>
                    edit((d) => void (d.keywords[i].pronunciationKo = v))
                  }
                />
                <Field
                  label={t.fKorean}
                  value={k.korean}
                  onChange={(v) => edit((d) => void (d.keywords[i].korean = v))}
                />
                <Field
                  label={t.fUzbek}
                  value={k.uzbek}
                  onChange={(v) => edit((d) => void (d.keywords[i].uzbek = v))}
                />
                <SelectField
                  label={t.fPos}
                  value={k.partOfSpeech}
                  options={KEYWORD_POS}
                  labels={en}
                  onChange={(v) =>
                    edit((d) => void (d.keywords[i].partOfSpeech = v))
                  }
                />
              </div>
            </Row>
          ))}
          <button
            className={smallBtn}
            onClick={() =>
              edit(
                (d) =>
                  void d.keywords.push({
                    word: "",
                    pronunciationKo: "",
                    korean: "",
                    uzbek: "",
                    partOfSpeech: "noun",
                  })
              )
            }
          >
            <AdminIcon name="plus" className="h-3.5 w-3.5" />
            {t.add}
          </button>
        </Section>

        {/* puzzles */}
        <Section
          id="puzzles"
          title={t.secPuzzles}
          hint={t.puzzlesHint}
          count={sections[2].n}
          warn={warnAt("puzzles", true)}
        >
          {draft.puzzles.map((p, pi) => (
            <div
              key={pi}
              className="rounded-2xl bg-[#faf7ff] p-3 dark:bg-surface-muted/50 sm:p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-extrabold">
                  {tf(t.table, { n: pi + 1 })} · {en[p.verbType]}
                </p>
                <button
                  onClick={() => edit((d) => void d.puzzles.splice(pi, 1))}
                  className="rounded-lg p-1 text-foreground/35 hover:bg-danger-soft hover:text-danger"
                >
                  <AdminIcon name="trash" className="h-4 w-4" />
                </button>
              </div>
              {warnAt(`puzzles.${pi}`, true).map((w) => (
                <p
                  key={w}
                  className="mb-2 text-xs font-semibold text-amber-800 dark:text-amber-300"
                >
                  ⚠ {w}
                </p>
              ))}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <SelectField
                  label={t.fVerbType}
                  value={p.verbType}
                  options={VERB_TYPES}
                  labels={en}
                  onChange={(v) =>
                    edit((d) => void (d.puzzles[pi].verbType = v))
                  }
                />
                <Field
                  label={t.fBase}
                  value={p.baseSentence}
                  onChange={(v) =>
                    edit((d) => void (d.puzzles[pi].baseSentence = v))
                  }
                />
                <Field
                  label={t.fBaseKo}
                  value={p.baseMeaningKo}
                  onChange={(v) =>
                    edit((d) => void (d.puzzles[pi].baseMeaningKo = v))
                  }
                />
                <Field
                  label={t.fBaseUz}
                  value={p.baseMeaningUz}
                  onChange={(v) =>
                    edit((d) => void (d.puzzles[pi].baseMeaningUz = v))
                  }
                />
              </div>
              <div className="mt-3 space-y-2">
                {p.rows.map((r, ri) => (
                  <Row
                    key={r.key}
                    index={ri}
                    warn={warnAt(`puzzles.${pi}.rows.${ri}`)}
                    onRemove={() =>
                      edit((d) => void d.puzzles[pi].rows.splice(ri, 1))
                    }
                  >
                    <div className="grid gap-2 sm:grid-cols-[150px_1fr_200px]">
                      <SelectField
                        label={t.fTransform}
                        value={r.transform}
                        options={TRANSFORMS}
                        labels={en}
                        onChange={(v) =>
                          edit(
                            (d) => void (d.puzzles[pi].rows[ri].transform = v)
                          )
                        }
                      />
                      <Field
                        label={t.fPrompt}
                        value={r.prompt}
                        invalid={
                          r.prompt.includes("___") ? undefined : t.noBlank
                        }
                        onChange={(v) =>
                          edit((d) => void (d.puzzles[pi].rows[ri].prompt = v))
                        }
                      />
                      <AnswersField
                        label={t.fAnswers}
                        value={r.answers}
                        onChange={(v) =>
                          edit((d) => void (d.puzzles[pi].rows[ri].answers = v))
                        }
                      />
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <Field
                        label={t.fHintKo}
                        value={r.hintKo}
                        onChange={(v) =>
                          edit((d) => void (d.puzzles[pi].rows[ri].hintKo = v))
                        }
                      />
                      <Field
                        label={t.fHintUz}
                        value={r.hintUz}
                        onChange={(v) =>
                          edit((d) => void (d.puzzles[pi].rows[ri].hintUz = v))
                        }
                      />
                    </div>
                  </Row>
                ))}
                <button
                  className={smallBtn}
                  onClick={() =>
                    edit(
                      (d) =>
                        void d.puzzles[pi].rows.push({
                          key: tmpKey(),
                          transform: "negative",
                          prompt: "___",
                          answers: [],
                          hintKo: "",
                          hintUz: "",
                        })
                    )
                  }
                >
                  <AdminIcon name="plus" className="h-3.5 w-3.5" />
                  {t.addRow}
                </button>
              </div>
            </div>
          ))}
          <button
            className={smallBtn}
            onClick={() =>
              edit(
                (d) =>
                  void d.puzzles.push({
                    verbType: "general_verb",
                    baseSentence: "",
                    baseMeaningKo: "",
                    baseMeaningUz: "",
                    pronunciationKo: "",
                    rows: [],
                  })
              )
            }
          >
            <AdminIcon name="plus" className="h-3.5 w-3.5" />
            {t.addTable}
          </button>
        </Section>

        {/* Our Story */}
        <Section
          id="story"
          title={t.secStory}
          hint={t.storyHint}
          count={draft.storyQuestions.length}
          warn={warnAt("storyQuestions", true)}
        >
          {draft.storyQuestions.map((q, i) => (
            <Row
              key={q.key}
              index={i}
              warn={warnAt(`storyQuestions.${i}`)}
              onRemove={() => edit((d) => void d.storyQuestions.splice(i, 1))}
            >
              <div className="grid gap-2 sm:grid-cols-[1fr_190px]">
                <Field
                  label={t.fQuestion}
                  value={q.question}
                  onChange={(v) =>
                    edit((d) => void (d.storyQuestions[i].question = v))
                  }
                />
                <SelectField
                  label={t.fGrammar}
                  value={q.grammarType}
                  options={GRAMMAR_TYPES}
                  labels={en}
                  onChange={(v) =>
                    edit((d) => void (d.storyQuestions[i].grammarType = v))
                  }
                />
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <Field
                  label={t.fPron}
                  value={q.pronunciationKo}
                  onChange={(v) =>
                    edit((d) => void (d.storyQuestions[i].pronunciationKo = v))
                  }
                />
                <Field
                  label={t.fMeaningKo}
                  value={q.meaningKo}
                  onChange={(v) =>
                    edit((d) => void (d.storyQuestions[i].meaningKo = v))
                  }
                />
                <Field
                  label={t.fMeaningUz}
                  value={q.meaningUz}
                  onChange={(v) =>
                    edit((d) => void (d.storyQuestions[i].meaningUz = v))
                  }
                />
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <Field
                  label={t.fExI}
                  value={q.examples[1]}
                  onChange={(v) =>
                    edit((d) => void (d.storyQuestions[i].examples[1] = v))
                  }
                />
                <Field
                  label={t.fExShe}
                  value={q.examples[2]}
                  onChange={(v) =>
                    edit((d) => void (d.storyQuestions[i].examples[2] = v))
                  }
                />
                <Field
                  label={t.fExHe}
                  value={q.examples[3]}
                  onChange={(v) =>
                    edit((d) => void (d.storyQuestions[i].examples[3] = v))
                  }
                />
              </div>
            </Row>
          ))}
          <button
            className={smallBtn}
            onClick={() =>
              edit(
                (d) =>
                  void d.storyQuestions.push({
                    key: tmpKey(),
                    question: "",
                    pronunciationKo: "",
                    meaningKo: "",
                    meaningUz: "",
                    grammarType: "general_verb",
                    examples: { 1: "", 2: "", 3: "" },
                  })
              )
            }
          >
            <AdminIcon name="plus" className="h-3.5 w-3.5" />
            {t.add}
          </button>
        </Section>

        {/* verb quiz */}
        <Section
          id="quiz"
          title={t.secQuiz}
          hint={t.quizHint}
          count={draft.verbClassificationQuiz.length}
          warn={warnAt("verbClassificationQuiz", true)}
        >
          <div className="grid gap-2 lg:grid-cols-2">
            {draft.verbClassificationQuiz.map((v, i) => (
              <Row
                key={v.key}
                index={i}
                warn={warnAt(`verbClassificationQuiz.${i}`)}
                onRemove={() =>
                  edit((d) => void d.verbClassificationQuiz.splice(i, 1))
                }
              >
                <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
                  <Field
                    label={t.fWord}
                    value={v.word}
                    onChange={(x) =>
                      edit((d) => void (d.verbClassificationQuiz[i].word = x))
                    }
                  />
                  <SelectField
                    label={t.fVerbType}
                    value={v.correctType}
                    options={VERB_TYPES}
                    labels={en}
                    onChange={(x) =>
                      edit(
                        (d) =>
                          void (d.verbClassificationQuiz[i].correctType = x)
                      )
                    }
                  />
                </div>
                <Field
                  className="mt-2"
                  label={t.fExample}
                  value={v.exampleSentence}
                  onChange={(x) =>
                    edit(
                      (d) =>
                        void (d.verbClassificationQuiz[i].exampleSentence = x)
                    )
                  }
                />
              </Row>
            ))}
          </div>
          <button
            className={smallBtn}
            onClick={() =>
              edit(
                (d) =>
                  void d.verbClassificationQuiz.push({
                    key: tmpKey(),
                    word: "",
                    correctType: "general_verb",
                    exampleSentence: "",
                  })
              )
            }
          >
            <AdminIcon name="plus" className="h-3.5 w-3.5" />
            {t.add}
          </button>
        </Section>

        {/* self-transform */}
        <Section
          id="self"
          title={t.secSelf}
          hint={t.selfHint}
          count={sections[5].n}
          warn={warnAt("selfTransform", true)}
        >
          {draft.selfTransform.map((b, bi) => (
            <div
              key={b.key}
              className="rounded-2xl bg-[#faf7ff] p-3 dark:bg-surface-muted/50 sm:p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-extrabold">
                  {tf(t.block, { n: bi + 1 })}
                </p>
                <button
                  onClick={() =>
                    edit((d) => void d.selfTransform.splice(bi, 1))
                  }
                  className="rounded-lg p-1 text-foreground/35 hover:bg-danger-soft hover:text-danger"
                >
                  <AdminIcon name="trash" className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field
                  label={t.fBlockKo}
                  value={b.titleKo}
                  onChange={(v) =>
                    edit((d) => void (d.selfTransform[bi].titleKo = v))
                  }
                />
                <Field
                  label={t.fBlockUz}
                  value={b.titleUz}
                  onChange={(v) =>
                    edit((d) => void (d.selfTransform[bi].titleUz = v))
                  }
                />
              </div>
              <div className="mt-3 space-y-2">
                {b.rows.map((r, ri) => (
                  <Row
                    key={r.key}
                    index={ri}
                    warn={warnAt(`selfTransform.${bi}.rows.${ri}`)}
                    onRemove={() =>
                      edit((d) => void d.selfTransform[bi].rows.splice(ri, 1))
                    }
                  >
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <Field
                        label={t.fLabelKo}
                        value={r.labelKo}
                        onChange={(v) =>
                          edit(
                            (d) =>
                              void (d.selfTransform[bi].rows[ri].labelKo = v)
                          )
                        }
                      />
                      <Field
                        label={t.fLabelUz}
                        value={r.labelUz}
                        onChange={(v) =>
                          edit(
                            (d) =>
                              void (d.selfTransform[bi].rows[ri].labelUz = v)
                          )
                        }
                      />
                      <Field
                        label={t.fPromptKo}
                        value={r.promptKo}
                        onChange={(v) =>
                          edit(
                            (d) =>
                              void (d.selfTransform[bi].rows[ri].promptKo = v)
                          )
                        }
                      />
                      <Field
                        label={t.fPromptUz}
                        value={r.promptUz}
                        onChange={(v) =>
                          edit(
                            (d) =>
                              void (d.selfTransform[bi].rows[ri].promptUz = v)
                          )
                        }
                      />
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_190px_auto] sm:items-end">
                      <AnswersField
                        label={t.fAnswers}
                        value={r.answers}
                        onChange={(v) =>
                          edit(
                            (d) =>
                              void (d.selfTransform[bi].rows[ri].answers = v)
                          )
                        }
                      />
                      <SelectField
                        label={t.fGrammar}
                        value={r.grammarType}
                        options={GRAMMAR_TYPES}
                        labels={en}
                        onChange={(v) =>
                          edit(
                            (d) =>
                              void (d.selfTransform[bi].rows[ri].grammarType =
                                v)
                          )
                        }
                      />
                      <label className="flex items-center gap-2 pb-2 text-xs font-bold text-foreground/60">
                        <input
                          type="checkbox"
                          checked={r.given}
                          onChange={(e) =>
                            edit(
                              (d) =>
                                void (d.selfTransform[bi].rows[ri].given =
                                  e.target.checked)
                            )
                          }
                          className="h-4 w-4 accent-[#7c3aed]"
                        />
                        {t.fGiven}
                      </label>
                    </div>
                  </Row>
                ))}
                <button
                  className={smallBtn}
                  onClick={() =>
                    edit(
                      (d) =>
                        void d.selfTransform[bi].rows.push({
                          key: tmpKey(),
                          labelKo: "",
                          labelUz: "",
                          promptKo: "",
                          promptUz: "",
                          answers: [],
                          grammarType: "general_verb",
                          given: false,
                        })
                    )
                  }
                >
                  <AdminIcon name="plus" className="h-3.5 w-3.5" />
                  {t.addRow}
                </button>
              </div>
            </div>
          ))}
          <button
            className={smallBtn}
            onClick={() =>
              edit(
                (d) =>
                  void d.selfTransform.push({
                    key: tmpKey(),
                    titleKo: "",
                    titleUz: "",
                    rows: [],
                  })
              )
            }
          >
            <AdminIcon name="plus" className="h-3.5 w-3.5" />
            {t.addBlock}
          </button>
        </Section>

        {/* sentence practice */}
        <Section
          id="practice"
          title={t.secPractice}
          hint={t.practiceHint}
          count={draft.sentencePractice.length}
          warn={warnAt("sentencePractice", true)}
        >
          {draft.sentencePractice.map((s, i) => (
            <Row
              key={s.key}
              index={i}
              warn={warnAt(`sentencePractice.${i}`)}
              onRemove={() => edit((d) => void d.sentencePractice.splice(i, 1))}
            >
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label={t.fEnglish}
                  value={s.english}
                  onChange={(v) =>
                    edit((d) => void (d.sentencePractice[i].english = v))
                  }
                />
                <Field
                  label={t.fPron}
                  value={s.pronunciationKo}
                  onChange={(v) =>
                    edit(
                      (d) => void (d.sentencePractice[i].pronunciationKo = v)
                    )
                  }
                />
                <Field
                  label={t.fKorean}
                  value={s.korean}
                  onChange={(v) =>
                    edit((d) => void (d.sentencePractice[i].korean = v))
                  }
                />
                <Field
                  label={t.fUzbek}
                  value={s.uzbek}
                  onChange={(v) =>
                    edit((d) => void (d.sentencePractice[i].uzbek = v))
                  }
                />
              </div>
            </Row>
          ))}
          <button
            className={smallBtn}
            onClick={() =>
              edit(
                (d) =>
                  void d.sentencePractice.push({
                    key: tmpKey(),
                    english: "",
                    pronunciationKo: "",
                    korean: "",
                    uzbek: "",
                  })
              )
            }
          >
            <AdminIcon name="plus" className="h-3.5 w-3.5" />
            {t.add}
          </button>
        </Section>

        {/* free talk */}
        <Section
          id="freetalk"
          title={t.secFreeTalk}
          hint={t.freeTalkHint}
          count={draft.freeTalk.length}
          warn={warnAt("freeTalk", true)}
        >
          {draft.freeTalk.map((f, i) => (
            <Row
              key={f.key}
              index={i}
              warn={warnAt(`freeTalk.${i}`)}
              onRemove={() => edit((d) => void d.freeTalk.splice(i, 1))}
            >
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label={t.fQuestion}
                  value={f.question}
                  onChange={(v) =>
                    edit((d) => void (d.freeTalk[i].question = v))
                  }
                />
                <Field
                  label={t.fPron}
                  value={f.pronunciationKo}
                  onChange={(v) =>
                    edit((d) => void (d.freeTalk[i].pronunciationKo = v))
                  }
                />
                <Field
                  label={t.fMeaningKo}
                  value={f.meaningKo}
                  onChange={(v) =>
                    edit((d) => void (d.freeTalk[i].meaningKo = v))
                  }
                />
                <Field
                  label={t.fMeaningUz}
                  value={f.meaningUz}
                  onChange={(v) =>
                    edit((d) => void (d.freeTalk[i].meaningUz = v))
                  }
                />
              </div>
            </Row>
          ))}
          <button
            className={smallBtn}
            onClick={() =>
              edit(
                (d) =>
                  void d.freeTalk.push({
                    key: tmpKey(),
                    question: "",
                    pronunciationKo: "",
                    meaningKo: "",
                    meaningUz: "",
                  })
              )
            }
          >
            <AdminIcon name="plus" className="h-3.5 w-3.5" />
            {t.add}
          </button>
        </Section>

        {/* shared reference charts */}
        <Section
          id="shared"
          title={t.secShared}
          hint={t.sharedHint}
          warn={warnAt("shared")}
        >
          <p className="rounded-xl bg-[#faf7ff] px-3 py-2 text-sm font-semibold text-foreground/65 dark:bg-surface-muted">
            {tf(t.sharedCounts, {
              a: lesson.verbTypes?.length ?? 0,
              b:
                (lesson.shapeTransforms?.length ?? 0) +
                (lesson.subjectTenseTransforms?.length ?? 0),
            })}
          </p>
        </Section>
      </div>

      {/* floating save bar */}
      {(dirty || msg) && (
        <div className="fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 lg:bottom-6 lg:pl-60">
          <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl bg-[#1f1235] px-4 py-3 text-white shadow-2xl">
            <span
              className={`flex-1 text-sm font-semibold ${
                msg?.kind === "err" ? "text-red-300" : ""
              }`}
            >
              {msg && !dirty
                ? msg.text
                : msg?.kind === "err"
                ? msg.text
                : t.unsaved}
            </span>
            {dirty && (
              <>
                <button
                  onClick={() => accept(lesson)}
                  disabled={busy}
                  className="rounded-full px-3 py-2 text-sm font-bold text-white/70 hover:text-white"
                >
                  {common.cancel}
                </button>
                <button
                  onClick={() => void save()}
                  disabled={busy}
                  className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#4c1d95] disabled:opacity-60"
                >
                  {busy ? common.saving : t.save}
                </button>
              </>
            )}
            {!dirty && (
              <button
                onClick={() => setMsg(null)}
                className="rounded-lg p-1 text-white/60 hover:text-white"
              >
                <AdminIcon name="x" className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTextbookLessonPage() {
  return (
    <Suspense fallback={null}>
      <EditorContent />
    </Suspense>
  );
}
