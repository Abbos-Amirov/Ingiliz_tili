"use client";

import { useT } from "@/hooks/useT";
import type { ImageAttribution } from "@/lib/types";

/** Renders a word's Unsplash photo with the required attribution caption
 * (Unsplash's API terms require crediting the photographer + linking back
 * to Unsplash wherever a photo appears). Plain `<img>` — these come from
 * Unsplash's CDN, not local assets, so next/image's optimizer doesn't apply. */
export function WordImage({
  src,
  attribution,
  alt,
  imgClassName = "",
  captioned = true,
}: {
  src: string;
  attribution?: ImageAttribution | null;
  alt: string;
  imgClassName?: string;
  captioned?: boolean;
}) {
  const t = useT("wordImage");

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        title={attribution ? `${t.photoBy} ${attribution.photographerName}` : undefined}
        className={imgClassName}
      />
      {captioned && attribution && (
        <a
          href={attribution.unsplashUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="block text-center text-[10px] leading-tight text-foreground/35 hover:text-foreground/60 mt-1 truncate transition-colors"
        >
          {t.photoBy} {attribution.photographerName} {t.onUnsplash}
        </a>
      )}
    </div>
  );
}
