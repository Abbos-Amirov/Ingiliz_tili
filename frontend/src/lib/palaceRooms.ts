import type { PalaceRoomKey } from "./types";

// Visual metadata for the Memory Palace's 15 fixed rooms — order they're
// shown in and their color pairing (same bg/text hex-pair pattern as
// ROLE_COLORS). Display text (name/description/story) is trilingual and
// lives in translations.ts's `palaceRooms` namespace instead, since it must
// follow the app's language switcher.
export interface PalaceRoomMeta {
  key: PalaceRoomKey;
  emoji: string;
  bg: string;
  text: string;
}

export const PALACE_ROOMS: PalaceRoomMeta[] = [
  { key: "princess_room", emoji: "👑", bg: "#FFE4E6", text: "#E11D48" },
  { key: "knights_hall", emoji: "🛡️", bg: "#FEE2E2", text: "#DC2626" },
  { key: "wise_tower", emoji: "📚", bg: "#E0F2FE", text: "#0284C7" },
  { key: "feast_hall", emoji: "🍽️", bg: "#FFEDD5", text: "#EA580C" },
  { key: "mask_gallery", emoji: "🎭", bg: "#EDE9FE", text: "#7C3AED" },
  { key: "treasure_room", emoji: "🏺", bg: "#FEF3C7", text: "#D97706" },
  { key: "dragon_cave", emoji: "🐉", bg: "#FECACA", text: "#7F1D1D" },
  { key: "unicorn_valley", emoji: "🦄", bg: "#ECFCCB", text: "#65A30D" },
  { key: "mermaid_lake", emoji: "🧜‍♀️", bg: "#CFFAFE", text: "#0891B2" },
  { key: "mystic_forest", emoji: "🌫️", bg: "#D1FAE5", text: "#059669" },
  { key: "thunder_mountain", emoji: "⚡", bg: "#E0E7FF", text: "#4F46E5" },
  { key: "wizard_tower", emoji: "🧙", bg: "#F3E8FF", text: "#9333EA" },
  { key: "starry_sky", emoji: "🌌", bg: "#FAE8FF", text: "#C026D3" },
  { key: "forgotten_island", emoji: "🏝️", bg: "#CCFBF1", text: "#0D9488" },
  { key: "time_gate", emoji: "🚪", bg: "#E7E5E4", text: "#57534E" },
];

export const PALACE_ROOM_BY_KEY: Record<PalaceRoomKey, PalaceRoomMeta> = Object.fromEntries(
  PALACE_ROOMS.map((r) => [r.key, r]),
) as Record<PalaceRoomKey, PalaceRoomMeta>;
