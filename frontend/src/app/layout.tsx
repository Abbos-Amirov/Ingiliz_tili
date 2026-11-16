import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { AiChatWidget } from "@/components/chat/AiChatWidget";
import { PushNotificationsInit } from "@/components/push/PushNotificationsInit";
import "./globals.css";

// Serif display face for headings (confident, academic) + a clean,
// highly legible sans for body text and UI.
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
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
  themeColor: "#1B1035",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${display.variable} ${body.variable} h-full antialiased`}>
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
