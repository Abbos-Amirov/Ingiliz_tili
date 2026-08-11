import { OAuth2Client } from "google-auth-library";
import { GOOGLE_CLIENT_ID } from "../config/env";

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string;
}

// Verifies the signed ID token Google Identity Services hands back to the
// frontend after "Sign in with Google" — this is enough to trust the
// email/name/sub claims without ever needing GOOGLE_CLIENT_SECRET (that's
// only relevant to the authorization-code flow, which this app doesn't use).
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!GOOGLE_CLIENT_ID) {
    throw Object.assign(new Error("Google sign-in is not configured"), { status: 503 });
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw Object.assign(new Error("Invalid Google token"), { status: 401 });
  }
  if (!payload || !payload.email || !payload.sub) {
    throw Object.assign(new Error("Invalid Google token"), { status: 401 });
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    displayName: payload.name ?? payload.email.split("@")[0],
  };
}
