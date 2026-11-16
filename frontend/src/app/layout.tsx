import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { AiChatWidget } from "@/components/chat/AiChatWidget";
import { PushNotificationsInit } from "@/components/push/PushNotificationsInit";
import "./globals.css";

// Nunito's rounded letterforms echo the Pallo! logo and feel friendly to learners.
const display = Nunito({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

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
  themeColor: "#55199E",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${display.variable} h-full antialiased`}>
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
