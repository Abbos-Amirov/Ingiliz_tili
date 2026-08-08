"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { UnsplashPhoto, ImageAttribution } from "@/lib/types";

/** Admin-only Unsplash search + pick grid for FEATURE 1 ("Rasm orqali
 * yodlash") — called once per word, on demand, so it stays well under
 * Unsplash's demo-app rate limit (50 req/hr). The chosen photo's URL +
 * attribution are handed back via onSelect; nothing is auto-applied. */
export function UnsplashImagePicker({
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
  const [query, setQuery] = useState(defaultQuery);
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ photos: UnsplashPhoto[] }>(`/admin/unsplash-search?query=${encodeURIComponent(q)}`, {
        admin: true,
      });
      setPhotos(res.photos);
      setSearched(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unsplash qidiruvida xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">Rasm (Unsplash)</span>

      {selectedImageUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedImageUrl} alt="" className="h-16 w-16 object-cover rounded-lg" />
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-danger hover:underline"
          >
            Rasmni olib tashlash
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="masalan: go, walking person"
          className="flex-1 rounded-xl border border-border bg-surface-muted px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent-soft text-accent hover:brightness-95 disabled:opacity-60 shrink-0"
        >
          {loading ? "Qidirilmoqda..." : "🔍 Mos rasmlarni qidirish"}
        </button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {searched && !loading && photos.length === 0 && !error && (
        <p className="text-xs text-foreground/50">Hech qanday rasm topilmadi.</p>
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
