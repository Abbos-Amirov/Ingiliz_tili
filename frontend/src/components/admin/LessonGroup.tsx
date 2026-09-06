"use client";

import { ReactNode, useState } from "react";

interface LessonGroupProps {
  label: string;
  count: number;
  /** Shown next to the label only while collapsed, e.g. the first item added to this lesson. */
  previewLabel?: string;
  children: ReactNode;
}

// Each lesson's word/sentence list can get long once a lesson is fully
// filled in, making the admin page one long scroll across many lessons —
// collapsing to just the lesson number + a preview of what's inside lets an
// admin scan the whole list and only expand the lesson they're editing.
// Defaults open so nothing changes visually until an admin collapses one.
export function LessonGroup({ label, count, previewLabel, children }: LessonGroupProps) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 mb-2 text-left group"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className={`text-foreground/40 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden
        >
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="font-bold text-sm text-foreground/60 uppercase tracking-wide group-hover:text-foreground transition-colors">
          {label}-dars ({count})
          {!open && previewLabel && (
            <span className="ml-2 normal-case font-normal text-foreground/40">— {previewLabel}</span>
          )}
        </h2>
      </button>
      {open && children}
    </div>
  );
}
