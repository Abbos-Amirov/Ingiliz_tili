import { getMessaging } from "firebase-admin/messaging";
import { getFirebaseApp } from "../config/firebase";
import { PushToken } from "../models/PushToken";

// Sends one push notification to every registered device (see
// PushToken.ts) — used when new words are added (see words.controller.ts
// and csv.service.ts) so learners know there's fresh content without
// having to check the app. Silently no-ops if Firebase isn't configured
// (no service account key deployed yet) or there are no devices registered
// — never throws, so it can never break word creation/upload.
export async function notifyNewWords(count: number, sampleEnglish?: string): Promise<void> {
  if (count <= 0) return;
  const app = getFirebaseApp();
  if (!app) return;

  const tokens = await PushToken.find({}, { token: 1 });
  if (tokens.length === 0) return;

  const title = "Yangi so'zlar qo'shildi! 📚";
  const body =
    count === 1 && sampleEnglish
      ? `1 ta yangi so'z qo'shildi: "${sampleEnglish}"`
      : `${count} ta yangi so'z qo'shildi. Ko'rish uchun ilovaga kiring!`;

  const response = await getMessaging(app).sendEachForMulticast({
    tokens: tokens.map((t) => t.token),
    notification: { title, body },
  });

  // Prune tokens Firebase reports as dead (app uninstalled, token
  // rotated, ...) so the device list doesn't grow stale forever.
  const deadTokens = response.responses
    .map((r, i) => (r.success ? null : tokens[i].token))
    .filter((t): t is string => t !== null);
  if (deadTokens.length > 0) {
    await PushToken.deleteMany({ token: { $in: deadTokens } });
  }
}
