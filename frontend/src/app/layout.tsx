import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { AiChatWidget } from "@/components/chat/AiChatWidget";
import { PushNotificationsInit } from "@/components/push/PushNotificationsInit";
import "./globals.css";

// Fonts are self-hosted from npm (@fontsource-variable/*) rather than
// next/font/google: the production Docker build kept failing intermittently
// while fetching from Google Fonts. Each @font-face carries a unicode-range,
// so browsers only download the subsets a page actually uses.
// Fraunces (serif display, with optical sizing) for headings; Manrope for body/UI.
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "@fontsource-variable/manrope/index.css";

export const metadata: Metadata = {
  title: "Pallo! English — ingliz tilini zavq bilan o'rganing",
  description:
    "Pallo! o'quv markazining ilovasi: so'z moslashtirish va gap tuzish orqali ingliz tilini interaktiv o'rganing.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pallo!",
  },
  icons: {
    icon: [
      { url: "/pallo-logo.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B1035",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        <PushNotificationsInit />
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <AiChatWidget />
      </body>
    </html>
  );
}
