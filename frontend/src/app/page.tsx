"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Asterisk, DotGrid, Floating, HalfMoon, QuarterArc, Ring } from "@/components/ui/Shapes";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/* One geometric badge per feature — each card gets its own shape. */
function FeatureBadge({ index }: { index: number }) {
  const variants = [
    <div key="0" className="relative h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
      <Asterisk size={28} color="var(--brand)" />
    </div>,
    <div key="1" className="relative h-14 w-14 rounded-2xl bg-accent-soft flex items-center justify-center rotate-6">
      <Ring size={26} stroke={14} color="var(--gold)" />
    </div>,
    <div key="2" className="relative h-14 w-14 rounded-2xl bg-ink flex items-end justify-center overflow-hidden">
      <HalfMoon size={40} color="var(--gold)" />
    </div>,
    <div key="3" className="relative h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
      <QuarterArc size={30} color="var(--brand)" className="translate-x-1 translate-y-1" />
    </div>,
  ];
  return variants[index % variants.length];
}

export default function Home() {
  const { user, ready } = useAuth();
  const t = useT("home");

  const primaryCta =
    ready && user ? (
      <Link href="/learn/match">
        <Button size="lg" variant="gold">
          {t.startLearning} <span aria-hidden>→</span>
        </Button>
      </Link>
    ) : (
      <Link href="/register">
        <Button size="lg" variant="gold">
          {t.register} <span aria-hidden>→</span>
        </Button>
      </Link>
    );

  return (
    <div className="flex-1 flex flex-col">
      {/* ───────── Hero ─────────
          The Pallo! hall photo (portrait, ~1211×1299) is always shown whole at
          its own aspect ratio with nothing laid over it: beside the copy on
          desktop, above it on phones. */}
      <section className="px-3 sm:px-6 pt-4 sm:pt-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] ink-panel">
          <QuarterArc size={220} color="rgba(233,168,35,0.10)" className="absolute -left-10 -bottom-10 rotate-90" />
          <Floating className="left-8 top-8 hidden lg:block" delay={1.2} distance={6}>
            <Ring size={34} stroke={8} color="rgba(233,168,35,0.6)" />
          </Floating>

          <div className="relative grid lg:grid-cols-[1fr_1fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative order-first lg:order-last p-3 sm:p-4 lg:p-5"
            >
              <div className="relative aspect-[1211/1299] overflow-hidden rounded-[1.5rem] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.7)]">
                <Image
                  src="/images/pallo-hall.jpg"
                  alt="Pallo! o'quv markazi zalida talabalar ingliz tilini birga o'rganmoqda"
                  fill
                  priority
                  unoptimized
                  sizes="(min-width: 1024px) 576px, 100vw"
                  className="object-cover"
                />
              </div>
            </motion.div>

            <div className="px-6 pb-10 pt-4 sm:px-12 lg:py-14 lg:pr-6 text-center lg:text-left">
              <motion.p
                {...fadeUp(0.1)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gold"
              >
                <Asterisk size={12} color="var(--gold)" />
                {t.eyebrow}
              </motion.p>

              <motion.h1
                {...fadeUp(0.18)}
                className="mt-6 text-[2.5rem] leading-[1.1] sm:text-5xl lg:text-[3.6rem] font-bold text-on-ink text-balance"
              >
                {t.titlePrefix} <span className="italic text-gold">{t.titleHighlight}</span>{" "}
                {t.titleSuffix}
              </motion.h1>

              <motion.p
                {...fadeUp(0.26)}
                className="mt-6 text-base sm:text-lg leading-relaxed text-on-ink/75 max-w-xl mx-auto lg:mx-0"
              >
                {t.subtitle}
              </motion.p>

              <motion.div
                {...fadeUp(0.34)}
                className="mt-9 flex flex-wrap items-center justify-center lg:justify-start gap-3"
              >
                {primaryCta}
                {!(ready && user) && (
                  <Link href="/login">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="!bg-white/5 !text-on-ink !border-white/25 hover:!border-white/60"
                    >
                      {t.login}
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Features ───────── */}
      <section className="relative px-4 sm:px-6 pt-20 pb-16">
        <Floating className="right-[8%] top-12 hidden sm:block" spin duration={7}>
          <Asterisk size={40} outline color="var(--gold)" />
        </Floating>
        <Floating className="left-[6%] top-28 hidden sm:block" delay={0.8}>
          <DotGrid cols={4} rows={4} color="color-mix(in srgb, var(--brand) 30%, transparent)" />
        </Floating>

        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              <span className="h-px w-8 bg-accent/50" />
              {t.featuresEyebrow}
              <span className="h-px w-8 bg-accent/50" />
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold max-w-2xl mx-auto text-balance">{t.featuresTitle}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {t.features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className="group relative overflow-hidden rounded-3xl bg-surface border border-border card-shadow p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] hover:border-primary/30"
              >
                <span className="absolute right-6 top-5 font-serif text-5xl font-bold text-foreground/[0.06] group-hover:text-primary/15 transition-colors">
                  0{i + 1}
                </span>
                <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-primary/[0.04] group-hover:scale-125 transition-transform duration-500" />
                <FeatureBadge index={i} />
                <h3 className="mt-5 font-bold text-lg">{f.title}</h3>
                <p className="mt-2 text-foreground/65 text-[15px] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Closing CTA ───────── */}
      <section className="px-3 sm:px-6 pb-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] ink-panel px-6 py-12 sm:px-12 text-center">
          <HalfMoon size={180} color="rgba(233,168,35,0.14)" className="absolute -bottom-1 left-8" />
          <Floating className="right-8 top-6" spin duration={9}>
            <Asterisk size={64} color="rgba(255,255,255,0.08)" />
          </Floating>
          <Ring size={110} stroke={4} color="rgba(255,255,255,0.08)" className="absolute -right-6 bottom-4" />
          <h2 className="relative text-3xl sm:text-4xl font-bold text-on-ink">{t.ctaTitle}</h2>
          <div className="relative mt-7 flex justify-center">{primaryCta}</div>
        </div>
      </section>
    </div>
  );
}
