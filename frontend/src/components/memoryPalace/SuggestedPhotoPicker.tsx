"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { useMemoryPalace } from "@/hooks/useMemoryPalace";
import { useT } from "@/hooks/useT";
import type { ImageAttribution, UnsplashPhoto } from "@/lib/types";

// The app-wide, trilingual counterpart to admin's UnsplashImagePicker — used
// here so a regular user can pick a stock photo for a word instead of (or
// alongside) taking their own. Auto-searches once for the selected word so
// suggestions appear without the user having to type anything first, but
// still lets them refine the search term.
export function SuggestedPhotoPicker({
  defaultQuery,
  selectedImageUrl,
  onSelect,
  onClear,
}: {
  defaultQuery: string;
  selectedImageUrl?: string | null;
  onSelect: (imageUrl: string, attribution: ImageAttribution) => void;
  onClear: () => void;
}) {
  const t = useT("memoryPalace");
  const { fetchSuggestedPhotos } = useMemoryPalace();

  const [query, setQuery] = useState(defaultQuery);
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function runSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSuggestedPhotos(q.trim());
      setPhotos(res.photos);
      setSearched(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.suggestedError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(defaultQuery);
    runSearch(defaultQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultQuery]);

  return (
    <div className="mb-5">
      {selectedImageUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted p-2 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedImageUrl} alt="" className="h-16 w-16 object-cover rounded-lg" />
          <button type="button" onClick={onClear} className="text-xs font-semibold text-danger hover:underline">
            {t.removePhotoBtn}
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runSearch(query);
            }
          }}
          placeholder={t.suggestedSearchPlaceholder}
          className="flex-1 rounded-xl border-2 border-border bg-surface-muted px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={() => runSearch(query)}
          disabled={loading || !query.trim()}
          className="text-xs font-semibold px-3 py-2 rounded-lg bg-accent-soft text-accent hover:brightness-95 disabled:opacity-60 shrink-0"
        >
          {loading ? t.suggestedSearching : t.suggestedSearchBtn}
        </button>
      </div>

      {error && <p className="text-xs text-danger mb-2">{error}</p>}

      {searched && !loading && photos.length === 0 && !error && (
        <p className="text-xs text-foreground/50 mb-2">{t.suggestedNoResults}</p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {photos.map((photo) => (
            <button
              key={photo.thumbUrl}
              type="button"
              onClick={() =>
                onSelect(photo.imageUrl, {
                  photographerName: photo.photographerName,
                  photographerUrl: photo.photographerUrl,
                  unsplashUrl: photo.unsplashUrl,
                })
              }
              title={`Photo by ${photo.photographerName} on Unsplash`}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                selectedImageUrl === photo.imageUrl ? "border-primary" : "border-transparent hover:border-primary/50"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.thumbUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
