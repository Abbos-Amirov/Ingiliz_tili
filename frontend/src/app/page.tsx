"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";

// Pallo! landing page — built from the centre's own mockup (desktop + mobile).
// The slogan stays in English in every locale (it's the brand line painted
// on the centre's wall); everything else follows the language switcher.

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
});

// Lucide-style line icons (24×24, stroke = currentColor).
const ICONS = {
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  trophy: (
    <>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </>
  ),
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  chat: (
    <>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
    </>
  ),
  headphones: (
    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
  ),
  book: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  briefcase: (
    <>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
};

function Icon({ name, className = "h-6 w-6" }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  );
}

const STAT_ICONS = ["users", "trophy", "star", "pin"] as const;
const COURSE_ICONS = ["chat", "headphones", "book", "briefcase"] as const;

function PillLink({
  href,
  children,
  variant = "solid",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline" | "white";
  className?: string;
}) {
  const styles = {
    solid: "bg-brand text-white hover:brightness-110 shadow-[0_12px_24px_-12px_rgba(85,25,158,0.8)]",
    outline: "border-2 border-brand/30 text-brand hover:border-brand bg-surface/70 dark:text-primary dark:border-primary/40",
    white: "bg-white text-[#55199e] hover:bg-white/90",
  }[variant];
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}

export default function Home() {
  const { user, ready } = useAuth();
  const t = useT("home");
  const loggedIn = ready && !!user;
  const startHref = loggedIn ? "/lessons" : "/register";

  return (
    <div className="flex-1 bg-lavender/60">
      {/* ───────── Hero ─────────
          Desktop: photo fills the right ~60%, fading into lavender on the
          left where the copy sits. Phones: compact copy first, then the photo
          directly under it (in normal flow, so it never drifts down the
          screen), with only a thin fade at its top edge. */}
      <section className="relative overflow-hidden bg-lavender">
        <div className="absolute inset-y-0 right-0 hidden w-[62%] lg:block">
          <Image
            src="/images/pallo-hall.jpg"
            alt="Pallo! o'quv markazi zalida talabalar ingliz tilini o'rganmoqda"
            fill
            priority
            unoptimized
            sizes="62vw"
            className="object-cover object-[center_58%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--lavender)_0%,color-mix(in_srgb,var(--lavender)_88%,transparent)_22%,color-mix(in_srgb,var(--lavender)_35%,transparent)_40%,transparent_55%)]" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-lavender/70 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-7 sm:pt-10 lg:pt-20 lg:pb-40 lg:min-h-[600px]">
          <div className="max-w-xl">
            {/* small burst doodle, as in the mockup */}
            <svg viewBox="0 0 40 40" className="hidden lg:block h-9 w-9 -ml-8 mb-1 text-brand dark:text-primary" aria-hidden>
              <path d="M8 30 L2 22 M14 24 L10 12 M22 22 L22 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
            <motion.h1
              {...fadeUp(0)}
              className="font-sans text-[2.15rem] leading-[1.05] sm:text-5xl lg:text-[4.2rem] font-extrabold tracking-tight text-foreground"
            >
              Learn English.
              <br />
              Grow{" "}
              <span className="bg-gradient-to-r from-[#55199e] to-[#8b3fe0] bg-clip-text text-transparent dark:from-[#b597f0] dark:to-[#d9c4ff]">
                Together.
              </span>
            </motion.h1>
            <motion.p {...fadeUp(0.1)} className="mt-3 lg:mt-5 text-sm sm:text-base lg:text-lg leading-relaxed text-foreground/75">
              {t.centerName}
              <br />
              {t.tagline}
            </motion.p>
            <motion.div {...fadeUp(0.2)} className="mt-5 lg:mt-7 flex flex-wrap items-center gap-2.5 lg:gap-3">
              <PillLink href={startHref} className="px-5 py-2.5 lg:px-6 lg:py-3">
                {t.startLearning} <Icon name="arrow" className="h-4 w-4" />
              </PillLink>
              {!loggedIn && ready && (
                <PillLink href="/login" variant="outline" className="px-5 py-2.5 lg:px-6 lg:py-3">
                  {t.login}
                </PillLink>
              )}
            </motion.div>
          </div>
        </div>

        {/* phone / tablet photo, right under the copy */}
        <div className="relative mt-5 aspect-[4/3] w-full sm:aspect-[16/10] lg:hidden">
          <Image
            src="/images/pallo-hall.jpg"
            alt="Pallo! o'quv markazi zalida talabalar ingliz tilini o'rganmoqda"
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover object-[center_62%]"
          />
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-lavender to-transparent" />
        </div>
      </section>

      {/* ───────── Stats (overlaps the hero) ───────── */}
      <section className="relative z-10 -mt-9 sm:-mt-14 lg:-mt-16 px-4 sm:px-8">
        <motion.div
          {...fadeUp(0.3)}
          className="mx-auto grid max-w-5xl grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 rounded-2xl sm:rounded-3xl bg-surface px-2 py-2.5 sm:px-8 sm:py-6 shadow-[0_24px_50px_-24px_rgba(27,16,53,0.35)] ring-1 ring-border"
        >
          {t.stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center gap-0.5 sm:gap-1.5 text-center lg:flex-row lg:gap-3 lg:text-left ${i === 3 ? "hidden lg:flex" : ""}`}
            >
              <span className="text-brand dark:text-primary">
                <Icon name={STAT_ICONS[i]} className="h-4.5 w-4.5 sm:h-7 sm:w-7" />
              </span>
              <div>
                <p className="text-sm sm:text-xl font-extrabold leading-tight">
                  <span className="lg:hidden">{s.valueShort}</span>
                  <span className="hidden lg:inline">{s.value}</span>
                </p>
                <p className="text-[11px] sm:text-sm leading-tight text-foreground/60">
                  <span className="lg:hidden">{t.statsShort[i] ?? s.label}</span>
                  <span className="hidden lg:inline">{s.label}</span>
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ───────── Courses ───────── */}
      <section className="px-5 sm:px-8 pt-14 sm:pt-20 pb-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_2fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-brand dark:text-primary">
              <span className="h-0.5 w-6 rounded bg-current" />
              {t.coursesEyebrow}
            </p>
            <h2 className="mt-2 font-sans text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">{t.coursesTitle}</h2>
            <p className="mt-3 hidden lg:block text-foreground/70">{t.coursesSubtitle}</p>
            <div className="mt-6 hidden lg:block">
              <PillLink href="/lessons">
                {t.viewAllCourses} <Icon name="arrow" className="h-4 w-4" />
              </PillLink>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {t.courses.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.35 + i * 0.07 }}
                className="rounded-2xl bg-lavender-strong p-4 sm:p-5 text-center lg:text-left transition-transform hover:-translate-y-1"
              >
                <span className="inline-flex text-brand dark:text-primary">
                  <Icon name={COURSE_ICONS[i]} className="h-8 w-8" />
                </span>
                <p className="mt-2 font-bold">{c.title}</p>
                <p className="mt-1 hidden lg:block text-sm text-foreground/65 leading-snug">{c.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="lg:hidden">
            <PillLink href="/lessons" className="w-full py-3.5">
              {t.viewAllCourses} <Icon name="arrow" className="h-4 w-4" />
            </PillLink>
          </div>
        </div>
      </section>

      {/* ───────── About ───────── */}
      <section className="px-4 sm:px-8 pb-20">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl shadow-[0_30px_60px_-30px_rgba(27,16,53,0.5)] lg:grid-cols-[0.9fr_1.4fr]">
          <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[260px]">
            <Image
              src="/images/pallo-classroom.jpg"
              alt="Pallo! o'quv markazida talabalar va o'qituvchi"
              fill
              unoptimized
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover object-[45%_center]"
            />
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#5b21b6] to-[#7c3aed] p-7 sm:p-10 text-white">
            {/* faint brand mark */}
            <svg viewBox="0 0 100 100" className="pointer-events-none absolute -right-8 top-1/2 h-48 w-48 -translate-y-1/2 opacity-10" aria-hidden>
              <g stroke="white" strokeWidth="22" strokeLinecap="round">
                <line x1="14" y1="50" x2="86" y2="50" />
                <line x1="30" y1="24" x2="70" y2="76" />
                <line x1="70" y1="24" x2="30" y2="76" />
              </g>
            </svg>
            <div className="relative grid gap-7 sm:grid-cols-[1.4fr_1fr] sm:items-center">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold text-white/80">
                  <span className="h-0.5 w-6 rounded bg-white/70" />
                  {t.aboutEyebrow}
                </p>
                <h2 className="mt-2 font-sans text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-white">
                  {t.aboutTitle}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed">{t.aboutBody}</p>
                <PillLink href={startHref} variant="white" className="mt-5 py-2.5">
                  {t.learnMore} <Icon name="arrow" className="h-4 w-4" />
                </PillLink>
              </div>
              <ul className="space-y-3">
                {t.aboutPoints.map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-sm font-semibold">
                    <Icon name="check" className="h-5 w-5 shrink-0 text-white" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
