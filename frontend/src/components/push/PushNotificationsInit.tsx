"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";

// TEMPORARY: reports each step to the backend (visible via `docker logs`)
// since a real device gave zero visible errors and never showed a
// permission dialog — the only way to see what's actually happening
// without USB/adb access. Remove once registration is confirmed working.
function debugLog(event: string, detail?: unknown) {
  apiFetch("/push/debug", {
    method: "POST",
    body: JSON.stringify({ event, detail }),
    skipAuth: true,
  }).catch(() => {});
}

// Registers this device for new-word push notifications (see
// push.controller.ts / push.service.ts) — meaningful only inside the
// installed Android app, which is why everything here is gated on
// Capacitor.isNativePlatform(): in a regular browser tab (or during `next
// dev`), this component mounts and does nothing. Runs once per login;
// registration is idempotent server-side (upsert by token), so re-running
// on every app relaunch is harmless.
//
// Registers under EITHER session (learner or admin) — the two auth stores
// are entirely separate, and the one person actually testing this app is
// often signed in only as admin, never as a regular learner, so gating on
// just useAuth() would silently never register on their own device.
export function PushNotificationsInit() {
  const { user } = useAuth();
  const { user: adminUser } = useAdminAuth();
  const asAdmin = !user && !!adminUser;
  const loggedIn = !!user || !!adminUser;

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    debugLog("effect-run", { loggedIn, asAdmin, isNative, platform: Capacitor.getPlatform() });
    if (!loggedIn || !isNative) return;

    let cleanup: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const current = await PushNotifications.checkPermissions();
        debugLog("checkPermissions", current);
        let granted = current.receive === "granted";
        if (!granted && current.receive !== "denied") {
          const requested = await PushNotifications.requestPermissions();
          debugLog("requestPermissions", requested);
          granted = requested.receive === "granted";
        }
        if (!granted) {
          debugLog("not-granted", { current });
          return;
        }
        if (cancelled) return;

        const registrationListener = await PushNotifications.addListener("registration", (token) => {
          debugLog("registration-token-received", { tokenPreview: token.value.slice(0, 12) });
          apiFetch("/push/register", {
            method: "POST",
            body: JSON.stringify({ token: token.value, platform: "android" }),
            admin: asAdmin,
          })
            .then(() => debugLog("backend-register-ok"))
            .catch((err) => debugLog("backend-register-failed", String(err)));
        });
        const errorListener = await PushNotifications.addListener("registrationError", (err) => {
          debugLog("registrationError", err);
        });

        debugLog("calling-register");
        await PushNotifications.register();
        debugLog("register-call-returned");

        cleanup = () => {
          registrationListener.remove();
          errorListener.remove();
        };
      } catch (err) {
        debugLog("init-exception", String(err));
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [loggedIn, asAdmin]);

  return null;
}
