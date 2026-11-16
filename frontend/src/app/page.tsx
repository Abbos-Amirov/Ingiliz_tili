"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PalloLogo } from "@/components/ui/PalloLogo";
import { Asterisk, DotGrid, Floating, HalfMoon, Plus, QuarterArc, Ring, Squiggle } from "@/components/ui/Shapes";
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

/* Decorative stack of word cards on the hero's right side. */
function HeroCards() {
  return (
    <div className="relative mx-auto h-[300px] w-[300px] sm:h-[340px] sm:w-[340px]">
      <Floating className="-left-6 top-6" distance={10}>
        <Ring size={64} stroke={6} color="rgba(233,168,35,0.9)" />
      </Floating>
      <Floating className="-right-4 -top-2" spin duration={8}>
        <Asterisk size={56} outline color="rgba(255,255,255,0.45)" />
      </Floating>
      <Floating className="right-2 -bottom-4" delay={1}>
        <DotGrid cols={5} rows={4} gap={12} color="rgba(255,255,255,0.3)" />
      </Floating>

      <motion.div
        initial={{ opacity: 0, rotate: -14, y: 30 }}
        animate={{ opacity: 1, rotate: -8, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-0 top-2 w-52 rounded-2xl bg-ink-soft/90 border border-white/10 p-5 shadow-2xl backdrop-blur"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">한국어</p>
        <p className="mt-2 text-2xl font-bold text-on-ink">안녕하세요</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, rotate: 12, y: 30 }}
        animate={{ opacity: 1, rotate: 5, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-0 top-28 w-56 rounded-2xl bg-white p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9a5b00]">English</p>
          <span className="h-7 w-7 rounded-full bg-[#55199e] flex items-center justify-center">
            <Asterisk size={14} color="#fff" />
          </span>
        </div>
        <p className="mt-2 font-serif text-3xl font-bold text-[#1b1035]">Hello!</p>
        <Squiggle width={90} stroke={6} color="#e9a823" className="mt-1" />
        <p className="mt-2 text-sm font-semibold text-[#1b1035]/60">Salom!</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.6 }}
        className="absolute left-6 bottom-2"
      >
        <PalloLogo size={76} className="drop-shadow-[0_16px_30px_rgba(0,0,0,0.5)]" />
      </motion.div>
    </div>
  );
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
      {/* ───────── Hero ───────── */}
      <section className="px-3 sm:px-6 pt-4 sm:pt-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] ink-panel">
          {/* background shapes */}
          <QuarterArc size={220} color="rgba(233,168,35,0.10)" className="absolute -left-10 -bottom-10 rotate-90" />
          <Floating className="left-[46%] top-10 hidden md:block" delay={0.5}>
            <Plus size={18} color="rgba(233,168,35,0.8)" />
          </Floating>
          <Floating className="left-8 top-8" delay={1.2} distance={6}>
            <Plus size={14} color="rgba(255,255,255,0.35)" />
          </Floating>

          <div className="relative grid items-center gap-10 px-6 py-12 sm:px-12 sm:py-16 lg:grid-cols-[1.15fr_1fr]">
            <div className="text-center lg:text-left">
              <motion.p
                {...fadeUp(0)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gold"
              >
                <Asterisk size={12} color="var(--gold)" />
                {t.eyebrow}
              </motion.p>

              <motion.h1
                {...fadeUp(0.08)}
                className="mt-6 text-[2.5rem] leading-[1.12] sm:text-6xl font-bold text-on-ink text-balance"
              >
                {t.titlePrefix}{" "}
                <span className="italic text-gold">{t.titleHighlight}</span>{" "}
                {t.titleSuffix}
              </motion.h1>

              <motion.p
                {...fadeUp(0.16)}
                className="mt-7 max-w-xl text-base sm:text-lg leading-relaxed text-on-ink/70 mx-auto lg:mx-0"
              >
                {t.subtitle}
              </motion.p>

              <motion.div
                {...fadeUp(0.24)}
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

            <div className="relative hidden lg:block">
              <HeroCards />
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
