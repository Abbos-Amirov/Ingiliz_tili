"use client";

import { Asterisk, DotGrid, Floating, HalfMoon, Ring, Squiggle } from "@/components/ui/Shapes";

/** Decorative shapes behind the login/register card. */
export function AuthBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand opacity-[0.07]" />
      <HalfMoon size={200} color="color-mix(in srgb, var(--gold) 22%, transparent)" className="absolute bottom-0 left-[8%]" />
      <Floating className="left-[10%] top-[14%]" spin duration={8}>
        <Asterisk size={54} outline color="color-mix(in srgb, var(--brand) 45%, transparent)" />
      </Floating>
      <Floating className="right-[12%] top-[22%]" distance={10}>
        <Ring size={46} stroke={10} color="color-mix(in srgb, var(--gold) 65%, transparent)" />
      </Floating>
      <Floating className="right-[9%] bottom-[16%]" delay={1}>
        <DotGrid cols={5} rows={5} gap={12} color="color-mix(in srgb, var(--brand) 30%, transparent)" />
      </Floating>
      <Floating className="left-[16%] bottom-[30%] hidden sm:block" delay={0.6}>
        <Squiggle width={90} stroke={5} color="color-mix(in srgb, var(--brand) 35%, transparent)" />
      </Floating>
    </div>
  );
}
