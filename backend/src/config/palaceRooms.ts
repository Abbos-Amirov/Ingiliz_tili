// The Memory Palace's 15 fixed "fairy tale rooms" a placed word can belong
// to. Fixed, code-owned taxonomy (like GRAMMAR_ROLES/FUNCTION_WORD_CATEGORIES
// in ../config) rather than a Mongo collection — there's no admin CRUD for
// rooms, so a DB round-trip per request would buy nothing. Display text
// (name/description/story, trilingual) lives in the frontend's
// translations.ts, matching how ROLE_COLORS keeps backend enum values and
// frontend-owned display text separate.
export const PALACE_ROOM_KEYS = [
  "princess_room",
  "knights_hall",
  "wise_tower",
  "feast_hall",
  "mask_gallery",
  "treasure_room",
  "dragon_cave",
  "unicorn_valley",
  "mermaid_lake",
  "mystic_forest",
  "thunder_mountain",
  "wizard_tower",
  "starry_sky",
  "forgotten_island",
  "time_gate",
] as const;

export type PalaceRoomKey = (typeof PALACE_ROOM_KEYS)[number];

export const ROOM_ASSIGNED_BY = ["ai", "user"] as const;
export type RoomAssignedBy = (typeof ROOM_ASSIGNED_BY)[number];
