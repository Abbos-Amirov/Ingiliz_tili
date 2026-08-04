"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";

export default function Home() {
  const { user, ready } = useAuth();
  const t = useT("home");

  return (
    <div className="flex-1 flex flex-col">
      <section className="relative overflow-hidden px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl gradient-primary"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight"
          >
            {t.titlePrefix} <span className="gradient-text">{t.titleHighlight}</span> {t.titleSuffix}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 text-lg text-foreground/60"
          >
            {t.subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            {ready && user ? (
              <Link href="/learn/match">
                <Button size="lg">{t.startLearning}</Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg">{t.register}</Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="secondary">
                    {t.login}
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-24">
        <div className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 gap-5">
          {t.features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="p-6 h-full">
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="font-bold text-lg mb-1.5">{f.title}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
