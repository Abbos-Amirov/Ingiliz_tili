import { RequestHandler } from "express";
import { Sentence, SentenceDoc } from "../models/Sentence";
import { GRAMMAR_ROLES } from "../config/grammar";
import { suggestSentenceRoles } from "../services/ai.service";

const ROLE_SET = new Set<string>(GRAMMAR_ROLES);
const WH_WORDS = ["what", "who", "where", "when", "why", "how", "which", "whose", "whom"];
const YES_NO_STARTERS = [
  "do", "does", "did", "is", "are", "was", "were", "am",
  "can", "could", "will", "would", "should", "shall", "must", "may", "might",
  "have", "has", "had",
];

function isValidRoleWordArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (w) =>
        w &&
        typeof w === "object" &&
        typeof (w as Record<string, unknown>).text === "string" &&
        (w as Record<string, unknown>).text !== "" &&
        ROLE_SET.has((w as Record<string, unknown>).role as string),
    )
  );
}

function guessQuestionCategory(englishQuestion: string): "yes_no" | "wh_question" | null {
  const firstWord = englishQuestion.trim().split(/\s+/)[0]?.toLowerCase().replace(/[?.,!]/g, "");
  if (!firstWord) return null;
  if (WH_WORDS.includes(firstWord)) return "wh_question";
  if (YES_NO_STARTERS.includes(firstWord)) return "yes_no";
  return null;
}

interface SentencePayload {
  korean: string;
  words: { text: string; role: string }[];
  distractorWords?: { text: string; role: string }[];
  formula?: string;
}

function isValidSentencePayload(body: unknown): body is SentencePayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.korean !== "string" || !b.korean.trim()) return false;
  if (!Array.isArray(b.words) || b.words.length === 0 || !isValidRoleWordArray(b.words)) return false;
  if (b.distractorWords !== undefined && !isValidRoleWordArray(b.distractorWords)) return false;
  return true;
}

export const listQuestionAnswerPairs: RequestHandler = async (req, res, next) => {
  try {
    const { level, subLevel, questionCategory } = req.query;
    const filter: Record<string, unknown> = { sentenceType: "question" };
    if (level) filter.level = level;
    if (subLevel) filter.subLevel = Number(subLevel);
    if (questionCategory) filter.questionCategory = questionCategory;

    const questions = await Sentence.find(filter).sort({ createdAt: -1 }).populate<{ pairId: SentenceDoc }>("pairId");
    const pairs = questions
      .filter((q) => q.pairId)
      .map((q) => ({ question: q, answer: q.pairId }));

    res.json({ pairs });
  } catch (err) {
    next(err);
  }
};

export const createQuestionAnswerPair: RequestHandler = async (req, res, next) => {
  try {
    const { level, subLevel, questionCategory, question, answer } = req.body ?? {};
    if (!isValidSentencePayload(question) || !isValidSentencePayload(answer)) {
      res.status(400).json({ error: "question and answer each need korean and a non-empty words[] of { text, role }" });
      return;
    }
    if (!level || !["beginner", "intermediate", "advanced"].includes(level)) {
      res.status(400).json({ error: "A valid level is required" });
      return;
    }
    const subLevelNum = Number(subLevel) || 1;

    const savedQuestion = await Sentence.create({
      korean: question.korean,
      words: question.words,
      distractorWords: question.distractorWords ?? [],
      formula: question.formula ?? "",
      sentenceType: "question",
      questionCategory: questionCategory ?? guessQuestionCategory(question.words.map((w) => w.text).join(" ")),
      level,
      subLevel: subLevelNum,
    });
    const savedAnswer = await Sentence.create({
      korean: answer.korean,
      words: answer.words,
      distractorWords: answer.distractorWords ?? [],
      formula: answer.formula ?? "",
      sentenceType: "answer",
      level,
      subLevel: subLevelNum,
      pairId: savedQuestion._id,
    });
    savedQuestion.pairId = savedAnswer._id;
    await savedQuestion.save();

    res.status(201).json({ question: savedQuestion, answer: savedAnswer });
  } catch (err) {
    next(err);
  }
};

export const updateQuestionAnswerPair: RequestHandler = async (req, res, next) => {
  try {
    const { level, subLevel, questionCategory, question, answer } = req.body ?? {};
    const existingQuestion = await Sentence.findById(req.params.questionId);
    if (!existingQuestion || existingQuestion.sentenceType !== "question" || !existingQuestion.pairId) {
      res.status(404).json({ error: "Question-answer pair not found" });
      return;
    }
    if (question !== undefined && !isValidSentencePayload(question)) {
      res.status(400).json({ error: "question needs korean and a non-empty words[] of { text, role }" });
      return;
    }
    if (answer !== undefined && !isValidSentencePayload(answer)) {
      res.status(400).json({ error: "answer needs korean and a non-empty words[] of { text, role }" });
      return;
    }

    const shared: Record<string, unknown> = {};
    if (level) shared.level = level;
    if (subLevel) shared.subLevel = Number(subLevel);

    const questionUpdate: Record<string, unknown> = { ...shared };
    if (question) {
      Object.assign(questionUpdate, {
        korean: question.korean,
        words: question.words,
        distractorWords: question.distractorWords ?? [],
        formula: question.formula ?? "",
      });
    }
    if (questionCategory !== undefined) questionUpdate.questionCategory = questionCategory;

    const answerUpdate: Record<string, unknown> = { ...shared };
    if (answer) {
      Object.assign(answerUpdate, {
        korean: answer.korean,
        words: answer.words,
        distractorWords: answer.distractorWords ?? [],
        formula: answer.formula ?? "",
      });
    }

    const [updatedQuestion, updatedAnswer] = await Promise.all([
      Sentence.findByIdAndUpdate(existingQuestion._id, questionUpdate, { new: true, runValidators: true }),
      Sentence.findByIdAndUpdate(existingQuestion.pairId, answerUpdate, { new: true, runValidators: true }),
    ]);

    res.json({ question: updatedQuestion, answer: updatedAnswer });
  } catch (err) {
    next(err);
  }
};

export const deleteQuestionAnswerPair: RequestHandler = async (req, res, next) => {
  try {
    const question = await Sentence.findById(req.params.questionId);
    if (!question || question.sentenceType !== "question") {
      res.status(404).json({ error: "Question-answer pair not found" });
      return;
    }
    if (question.pairId) {
      await Sentence.findByIdAndDelete(question.pairId);
    }
    await Sentence.findByIdAndDelete(question._id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const aiSuggestQuestionAnswerPair: RequestHandler = async (req, res, next) => {
  try {
    const { questionEnglish, questionKorean, answerEnglish, answerKorean } = req.body ?? {};
    if (!questionEnglish || !questionKorean || !answerEnglish || !answerKorean) {
      res.status(400).json({ error: "questionEnglish, questionKorean, answerEnglish and answerKorean are required" });
      return;
    }
    const [questionSuggestion, answerSuggestion] = await Promise.all([
      suggestSentenceRoles(questionEnglish, questionKorean),
      suggestSentenceRoles(answerEnglish, answerKorean),
    ]);
    res.json({
      question: questionSuggestion,
      answer: answerSuggestion,
      questionCategory: guessQuestionCategory(questionEnglish),
    });
  } catch (err) {
    next(err);
  }
};
