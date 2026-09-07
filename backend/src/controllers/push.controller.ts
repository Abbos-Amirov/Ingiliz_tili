import { RequestHandler } from "express";
import { PushToken } from "../models/PushToken";

export const registerPushToken: RequestHandler = async (req, res, next) => {
  try {
    const { token, platform } = req.body ?? {};
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "token is required" });
      return;
    }
    await PushToken.updateOne(
      { token },
      { $setOnInsert: { token, platform: typeof platform === "string" ? platform : "android" } },
      { upsert: true },
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
