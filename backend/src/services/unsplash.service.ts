import { UNSPLASH_ACCESS_KEY } from "../config/env";

export interface UnsplashPhoto {
  imageUrl: string;
  thumbUrl: string;
  photographerName: string;
  photographerUrl: string;
  unsplashUrl: string;
}

interface UnsplashApiPhoto {
  urls: { small: string; thumb: string };
  user: { name: string; links: { html: string } };
  links: { html: string };
}

interface UnsplashSearchResponse {
  results: UnsplashApiPhoto[];
  total_pages: number;
}

export interface UnsplashSearchResult {
  photos: UnsplashPhoto[];
  hasMore: boolean;
}

// Admin-only, called once per word when it's being added/edited (see
// FEATURE 1 "Rasm orqali yodlash") — never at runtime for regular users, so
// this stays well under Unsplash's demo-app rate limit (50 req/hr).
//
// Also reused by memory-anchors' suggested-photos endpoint (regular users,
// Memory Palace word placement) with a higher per_page + pagination so that
// flow's horizontal photo gallery has enough variety to scroll through.
export async function searchUnsplashPhotos(query: string, page = 1, perPage = 20): Promise<UnsplashSearchResult> {
  if (!UNSPLASH_ACCESS_KEY) {
    throw Object.assign(new Error("UNSPLASH_ACCESS_KEY is not configured"), { status: 503 });
  }

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
  const response = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  });

  if (!response.ok) {
    const status = response.status === 403 ? 429 : 502;
    throw Object.assign(new Error(`Unsplash search failed (${response.status})`), { status });
  }

  const data = (await response.json()) as UnsplashSearchResponse;

  return {
    photos: (data.results ?? []).map((photo) => ({
      imageUrl: photo.urls.small,
      thumbUrl: photo.urls.thumb,
      photographerName: photo.user.name,
      photographerUrl: photo.user.links.html,
      unsplashUrl: photo.links.html,
    })),
    hasMore: page < (data.total_pages ?? page),
  };
}
