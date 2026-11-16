"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";

/*
 * Decorative geometric shapes used across the app. They're the "emotion"
 * layer of the Pallo! look: the serious palette stays calm, and these
 * shapes (the brand asterisk, rings, half-moons, dot grids, squiggles)
 * add movement and warmth. All are aria-hidden and pointer-events-none.
 */

type ShapeProps = {
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
};

const base = "pointer-events-none select-none";

/** The Pallo! asterisk (three rounded bars) — the brand's signature shape. */
export function Asterisk({ size = 48, color = "currentColor", className = "", style, outline }: ShapeProps & { outline?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`${base} ${className}`} style={style} aria-hidden>
      {outline ? (
        <g fill="none" stroke={color} strokeWidth="5" strokeLinecap="round">
          <line x1="10" y1="50" x2="90" y2="50" />
          <line x1="28" y1="22" x2="72" y2="78" />
          <line x1="72" y1="22" x2="28" y2="78" />
        </g>
      ) : (
        <g stroke={color} strokeWidth="22" strokeLinecap="round">
          <line x1="14" y1="50" x2="86" y2="50" />
          <line x1="30" y1="24" x2="70" y2="76" />
          <line x1="70" y1="24" x2="30" y2="76" />
        </g>
      )}
    </svg>
  );
}

export function Ring({ size = 64, color = "currentColor", className = "", style, stroke = 8 }: ShapeProps & { stroke?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`${base} ${className}`} style={style} aria-hidden>
      <circle cx="50" cy="50" r={50 - stroke / 2} fill="none" stroke={color} strokeWidth={stroke} />
    </svg>
  );
}

export function HalfMoon({ size = 64, color = "currentColor", className = "", style }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 50" width={size} height={size / 2} className={`${base} ${className}`} style={style} aria-hidden>
      <path d="M0 50 A50 50 0 0 1 100 50 Z" fill={color} />
    </svg>
  );
}

export function QuarterArc({ size = 64, color = "currentColor", className = "", style }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`${base} ${className}`} style={style} aria-hidden>
      <path d="M0 100 A100 100 0 0 1 100 0 L100 100 Z" fill={color} />
    </svg>
  );
}

export function DotGrid({
  cols = 6,
  rows = 4,
  gap = 14,
  dot = 2.2,
  color = "currentColor",
  className = "",
  style,
}: { cols?: number; rows?: number; gap?: number; dot?: number } & Omit<ShapeProps, "size">) {
  const w = (cols - 1) * gap + dot * 2;
  const h = (rows - 1) * gap + dot * 2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className={`${base} ${className}`} style={style} aria-hidden>
      {Array.from({ length: rows }).flatMap((_, r) =>
        Array.from({ length: cols }).map((__, c) => (
          <circle key={`${r}-${c}`} cx={dot + c * gap} cy={dot + r * gap} r={dot} fill={color} />
        )),
      )}
    </svg>
  );
}

export function Squiggle({ width = 120, color = "currentColor", className = "", style, stroke = 5 }: Omit<ShapeProps, "size"> & { width?: number; stroke?: number }) {
  return (
    <svg viewBox="0 0 120 20" width={width} height={(width / 120) * 20} className={`${base} ${className}`} style={style} aria-hidden>
      <path
        d="M3 12 C 13 2, 23 2, 33 12 S 53 22, 63 12 S 83 2, 93 12 S 113 22, 117 12"
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Plus({ size = 20, color = "currentColor", className = "", style }: ShapeProps) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} className={`${base} ${className}`} style={style} aria-hidden>
      <path d="M10 2v16M2 10h16" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Wraps a shape in a gentle, endless float/spin. */
export function Floating({
  children,
  className = "",
  delay = 0,
  spin = false,
  distance = 8,
  duration = 6,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  spin?: boolean;
  distance?: number;
  duration?: number;
}) {
  return (
    <motion.div
      aria-hidden
      className={`${base} absolute ${className}`}
      animate={spin ? { rotate: [0, 360] } : { y: [0, -distance, 0] }}
      transition={
        spin
          ? { duration: duration * 6, repeat: Infinity, ease: "linear", delay }
          : { duration, repeat: Infinity, ease: "easeInOut", delay }
      }
    >
      {children}
    </motion.div>
  );
}
