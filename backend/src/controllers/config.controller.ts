import { RequestHandler } from "express";
import { LEVEL_CONFIG, PARTS_OF_SPEECH, GRAMMAR_ROLES } from "../config/grammar";

export const getLevelsConfig: RequestHandler = (_req, res) => {
  res.json({ levels: LEVEL_CONFIG, partsOfSpeech: PARTS_OF_SPEECH, roles: GRAMMAR_ROLES });
};
