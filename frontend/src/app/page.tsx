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
          The classroom photo is shown whole (16:9, nothing laid over it) and
          the copy sits on the ink panel below it, so no part of the photo is
          covered on any screen size. */}
      <section className="px-3 sm:px-6 pt-4 sm:pt-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] ink-panel">
          <motion.div
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[16/9]"
          >
            <Image
              src="/images/pallo-classroom.jpg"
              alt="Pallo! o'quv markazida talabalar ingliz tilini birga o'rganmoqda"
              fill
              priority
              unoptimized
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="object-cover"
            />
            {/* thin fade so the photo melts into the panel below */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink to-transparent" />
          </motion.div>

          <QuarterArc size={200} color="rgba(233,168,35,0.10)" className="absolute -right-10 -bottom-10" />

          <div className="relative grid gap-6 px-6 pb-10 pt-6 sm:px-12 sm:pb-12 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-12">
            <div className="text-center lg:text-left">
              <motion.p
                {...fadeUp(0.1)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gold"
              >
                <Asterisk size={12} color="var(--gold)" />
                {t.eyebrow}
              </motion.p>

              <motion.h1
                {...fadeUp(0.18)}
                className="mt-5 text-[2.5rem] leading-[1.1] sm:text-5xl lg:text-[3.5rem] font-bold text-on-ink text-balance"
              >
                {t.titlePrefix} <span className="italic text-gold">{t.titleHighlight}</span>{" "}
                {t.titleSuffix}
              </motion.h1>
            </div>

            <div className="text-center lg:text-left">
              <motion.p {...fadeUp(0.26)} className="text-base sm:text-lg leading-relaxed text-on-ink/75">
                {t.subtitle}
              </motion.p>

              <motion.div
                {...fadeUp(0.34)}
                className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-3"
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
