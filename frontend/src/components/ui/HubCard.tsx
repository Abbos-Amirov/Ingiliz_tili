"use client";

import { Asterisk, HalfMoon, Ring } from "@/components/ui/Shapes";

/** Large link card used on the hub pages (Learn / Rules / Practice). */
export function HubCard({ icon, label, index }: { icon: string; label: string; index: number }) {
  const accents = [
    { tile: "bg-primary/10", shape: <Asterisk size={44} outline color="color-mix(in srgb, var(--brand) 25%, transparent)" /> },
    { tile: "bg-accent-soft", shape: <Ring size={46} stroke={6} color="color-mix(in srgb, var(--gold) 45%, transparent)" /> },
    { tile: "bg-surface-muted", shape: <HalfMoon size={64} color="color-mix(in srgb, var(--brand) 10%, transparent)" /> },
  ];
  const a = accents[index % accents.length];
  return (
    <div className="group relative overflow-hidden flex items-center gap-4 rounded-2xl bg-surface border border-border card-shadow p-5 sm:p-6 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]">
      <span className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${a.tile}`}>
        {icon}
      </span>
      <p className="relative z-10 flex-1 font-bold text-lg">{label}</p>
      <span className="pointer-events-none absolute right-16 -bottom-3 opacity-80 transition-transform duration-500 group-hover:rotate-45">
        {a.shape}
      </span>
      <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-gold text-lg font-bold transition-transform duration-300 group-hover:translate-x-1 dark:ring-1 dark:ring-white/10">
        →
      </span>
    </div>
  );
}
