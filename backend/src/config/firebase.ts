import { existsSync } from "fs";
import path from "path";
import { App, cert, getApps, initializeApp } from "firebase-admin/app";

// Service account key lives outside version control (see backend/secrets/,
// gitignored) and is deployed to the server the same manual way as the
// other API keys — see push.service.ts for what it's used for.
const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), "secrets/firebase-service-account.json");

let app: App | null = null;

export function getFirebaseApp(): App | null {
  if (app) return app;
  if (!existsSync(SERVICE_ACCOUNT_PATH)) return null;
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  const existing = getApps();
  app = existing.length ? existing[0] : initializeApp({ credential: cert(serviceAccount) });
  return app;
}
