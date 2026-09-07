"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

// Registers this device for new-word push notifications (see
// push.controller.ts / push.service.ts) — meaningful only inside the
// installed Android app, which is why everything here is gated on
// Capacitor.isNativePlatform(): in a regular browser tab (or during `next
// dev`), this component mounts and does nothing. Runs once per login;
// registration is idempotent server-side (upsert by token), so re-running
// on every app relaunch is harmless.
export function PushNotificationsInit() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      const current = await PushNotifications.checkPermissions();
      let granted = current.receive === "granted";
      if (!granted && current.receive !== "denied") {
        const requested = await PushNotifications.requestPermissions();
        granted = requested.receive === "granted";
      }
      if (!granted || cancelled) return;

      const registrationListener = await PushNotifications.addListener("registration", (token) => {
        apiFetch("/push/register", {
          method: "POST",
          body: JSON.stringify({ token: token.value, platform: "android" }),
        }).catch(() => {
          // Best-effort — a failed registration just means this device
          // misses notifications until the next successful app launch.
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
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [user]);

  return null;
}
