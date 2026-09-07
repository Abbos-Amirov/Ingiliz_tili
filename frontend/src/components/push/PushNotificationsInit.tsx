"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";

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
    if (!loggedIn || !Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const current = await PushNotifications.checkPermissions();
        let granted = current.receive === "granted";
        if (!granted && current.receive !== "denied") {
          const requested = await PushNotifications.requestPermissions();
          granted = requested.receive === "granted";
        }
        if (!granted) {
          console.warn("Push notifications: permission not granted:", current, granted);
          return;
        }
        if (cancelled) return;

        const registrationListener = await PushNotifications.addListener("registration", (token) => {
          apiFetch("/push/register", {
            method: "POST",
            body: JSON.stringify({ token: token.value, platform: "android" }),
            admin: asAdmin,
          }).catch((err) => {
            // Best-effort — a failed registration just means this device
            // misses notifications until the next successful app launch.
            console.warn("Push token registration with backend failed:", err);
          });
        });
        const errorListener = await PushNotifications.addListener("registrationError", (err) => {
          console.warn("Push registration failed:", err);
        });

        await PushNotifications.register();

        cleanup = () => {
          registrationListener.remove();
          errorListener.remove();
        };
      } catch (err) {
        console.warn("Push notifications init failed:", err);
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [loggedIn, asAdmin]);

  return null;
}
