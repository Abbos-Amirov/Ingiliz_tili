import { Schema, model } from "mongoose";

// One row per installed-app device (see push.controller.ts's register
// endpoint, called once on app launch by the Android app's push-init code).
// Not tied to a single user — new-word notifications go to every device
// that has the app installed, not a personalized feed.
const pushTokenSchema = new Schema({
  token: { type: String, required: true, unique: true },
  platform: { type: String, default: "android" },
  createdAt: { type: Date, default: Date.now },
});

export const PushToken = model("PushToken", pushTokenSchema);
