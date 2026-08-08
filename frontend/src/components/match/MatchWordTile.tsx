"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import type { ImageAttribution } from "@/lib/types";

interface MatchWordTileProps {
  text: string;
  state: "idle" | "selected" | "matched" | "wrong";
  onClick: () => void;
  disabled?: boolean;
  imageUrl?: string | null;
  imageAttribution?: ImageAttribution | null;
}

export const MatchWordTile = forwardRef<HTMLButtonElement, MatchWordTileProps>(
  ({ text, state, onClick, disabled, imageUrl, imageAttribution }, ref) => {
    const stateClasses: Record<typeof state, string> = {
      idle: "bg-surface border-border hover:border-primary hover:bg-surface-muted",
      selected: "bg-primary/10 border-primary ring-2 ring-primary/30",
      matched: "bg-success-soft border-success text-success cursor-default",
      wrong: "bg-danger-soft border-danger text-danger",
    };

    return (
      <motion.button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled || state === "matched"}
        animate={state === "wrong" ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.35 }}
        whileTap={state !== "matched" ? { scale: 0.97 } : undefined}
        className={`w-full min-h-12 px-4 py-3 rounded-xl border-2 font-semibold text-sm sm:text-base text-center transition-colors select-none ${stateClasses[state]}`}
      >
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            title={imageAttribution ? `Photo: ${imageAttribution.photographerName} (Unsplash)` : undefined}
            className="w-full h-12 object-cover rounded-lg mb-1.5"
          />
        )}
        {text}
      </motion.button>
    );
  },
);

MatchWordTile.displayName = "MatchWordTile";
