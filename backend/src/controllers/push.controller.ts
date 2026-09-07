import { RequestHandler } from "express";
import { PushToken } from "../models/PushToken";

// TEMPORARY: lets the app self-report what's happening on a real device
// (no permission dialog was appearing, and 0 tokens were ever registered)
// without needing USB/adb access to the phone — visible via
// `docker logs ingiliztili-backend-1`. Remove once push registration is
// confirmed working end-to-end.
export const pushDebugLog: RequestHandler = (req, res) => {
  console.log("[push-debug]", new Date().toISOString(), JSON.stringify(req.body ?? {}));
  res.status(204).end();
};

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
