import type { CapacitorConfig } from "@capacitor/cli";

// Wraps the deployed production site (not a bundled static build) — the
// app just needs a native icon/splash/shell + Play Store presence.
// Points at the server's IP over plain HTTP for now because there's no
// domain/TLS cert yet; switch `server.url` to `https://<domain>/` once
// one exists (see README's "Android APK" section) and this cleartext
// exception can be dropped.
const config: CapacitorConfig = {
  appId: "uz.abbosamirov.englishlearn",
  appName: "English✦Learn",
  webDir: "www",
  server: {
    url: "http://38.247.134.248:5050",
    cleartext: true,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#6366F1",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
