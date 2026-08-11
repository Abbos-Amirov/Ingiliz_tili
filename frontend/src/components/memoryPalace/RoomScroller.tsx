"use client";

import { useT } from "@/hooks/useT";
import { PALACE_ROOMS } from "@/lib/palaceRooms";
import type { PalaceRoomKey } from "@/lib/types";

// Horizontal scroll-snap chip row for picking (or filtering by) a Memory
// Palace room — reused by the create flow's room-picker step and the recall
// page's room filter. `noneLabel` renders a leading "All / no room" chip.
export function RoomScroller({
  selectedKey,
  onSelect,
  noneLabel,
  countByRoomKey,
}: {
  selectedKey: PalaceRoomKey | null;
  onSelect: (key: PalaceRoomKey | null) => void;
  noneLabel?: string;
  countByRoomKey?: Partial<Record<PalaceRoomKey, number>>;
}) {
  const rooms = useT("palaceRooms");

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
    >
      {noneLabel && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          style={{ scrollSnapAlign: "start" }}
          className={`shrink-0 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
            selectedKey === null ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-foreground/70 hover:border-primary/40"
          }`}
        >
          {noneLabel}
        </button>
      )}
      {PALACE_ROOMS.map((room) => {
        const count = countByRoomKey?.[room.key];
        return (
          <button
            key={room.key}
            type="button"
            onClick={() => onSelect(room.key)}
            style={{
              scrollSnapAlign: "start",
              borderColor: selectedKey === room.key ? room.text : undefined,
              backgroundColor: selectedKey === room.key ? room.bg : undefined,
            }}
            className={`shrink-0 px-3.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              selectedKey === room.key ? "" : "border-border bg-surface text-foreground/70 hover:border-primary/40"
            }`}
          >
            <span>{room.emoji}</span>
            <span style={{ color: selectedKey === room.key ? room.text : undefined }}>{rooms[room.key].name}</span>
            {count !== undefined && <span className="text-xs opacity-60">({count})</span>}
          </button>
        );
      })}
    </div>
  );
}
