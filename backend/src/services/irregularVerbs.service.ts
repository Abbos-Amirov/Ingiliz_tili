import { BOOK_ING_FORMS, NEW_IRREGULAR_BOOK_VERBS, REGULAR_BOOK_VERBS } from "../data/bookVerbs";
import { IrregularVerb } from "../models/IrregularVerb";

// Adds the textbook's verb tables (src/data/bookVerbs.ts) on server start.
// Insert-only: verbs already in the database (possibly edited in the admin)
// are left alone except for filling a missing -ing form.
export async function syncBookVerbs(): Promise<void> {
  let inserted = 0;
  for (const v of [...REGULAR_BOOK_VERBS, ...NEW_IRREGULAR_BOOK_VERBS]) {
    const res = await IrregularVerb.updateOne(
      { base: v.base },
      { $setOnInsert: { ...v, regular: !!v.regular, category: "other", frequency: null, createdAt: new Date() } },
      { upsert: true },
    );
    inserted += res.upsertedCount;
  }
  for (const [base, ing] of Object.entries({
    ...BOOK_ING_FORMS,
    ...Object.fromEntries([...REGULAR_BOOK_VERBS, ...NEW_IRREGULAR_BOOK_VERBS].map((v) => [v.base, v.ing])),
  })) {
    await IrregularVerb.updateOne({ base, $or: [{ ing: { $exists: false } }, { ing: "" }] }, { $set: { ing } });
  }
  if (inserted) console.log(`Verbs: ${inserted} textbook verb(s) added`);
}

// How a stored form is read aloud: "was / were", "am,is", "do, does" →
// "was, were" etc.; "-" (no participle, e.g. can) is skipped. The frontend
// uses the same rule (lib/verbAudio.ts) to look clips up.
export function speakableForm(form: string | null | undefined): string {
  const f = (form ?? "").trim();
  if (!f || f === "-") return "";
  return f
    .split(/\s*[/,]\s*/)
    .filter(Boolean)
    .join(", ");
}

export function verbSpeakableTexts(
  verbs: { base: string; past: string; participle: string; ing?: string | null }[],
): string[] {
  const texts = new Set<string>();
  for (const v of verbs) {
    for (const f of [v.base, v.past, v.participle, v.ing]) {
      const s = speakableForm(f);
      if (s) texts.add(s);
    }
  }
  return [...texts];
}
