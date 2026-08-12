"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { useMemoryPalace } from "@/hooks/useMemoryPalace";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PALACE_ROOMS } from "@/lib/palaceRooms";
import type { MemoryAnchor, PalaceRoomKey } from "@/lib/types";

export default function MemoryPalaceRoomDetailPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const params = useParams<{ roomKey: string }>();
  const t = useT("memoryPalace");
  const rooms = useT("palaceRooms");
  const { fetchAnchors, deleteAnchor } = useMemoryPalace();

  const room = PALACE_ROOMS.find((r) => r.key === params.roomKey);
  const roomKey = room?.key as PalaceRoomKey | undefined;

  const [anchors, setAnchors] = useState<MemoryAnchor[] | null>(null);

  useEffect(() => {
    if (!ready || !user || !roomKey) return;
    fetchAnchors({ roomKey }).then((res) => setAnchors(res.anchors));
  }, [ready, user, roomKey, fetchAnchors]);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!room) router.replace("/memory-palace/rooms");
  }, [room, router]);

  async function handleDelete(id: string) {
    if (!confirm(t.deleteAnchorConfirm)) return;
    await deleteAnchor(id);
    setAnchors((prev) => (prev ? prev.filter((a) => a._id !== id) : prev));
  }

  if (!ready || !user) return null;
  if (!room || !roomKey) return null;

  const content = rooms[roomKey];

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/memory-palace/rooms" className="inline-block mb-2 text-sm font-medium text-foreground/50 hover:text-primary">
          {t.roomBackLink}
        </Link>

        <div className="rounded-2xl p-3.5 mb-4 text-center" style={{ backgroundColor: room.bg }}>
          <span className="text-3xl">{room.emoji}</span>
          <h1 className="text-lg font-extrabold mt-1" style={{ color: room.text }}>
            {content.name}
          </h1>
          <p className="text-xs mt-1 max-w-md mx-auto" style={{ color: room.text }}>
            {content.introStory}
          </p>
        </div>

        <div className="flex justify-center mb-4">
          <Link href={`/memory-palace/create?roomKey=${roomKey}`}>
            <Button>{t.roomAddWordBtn}</Button>
          </Link>
        </div>

        {anchors === null ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : anchors.length === 0 ? (
          <Card className="p-8 text-center text-sm text-foreground/50">{t.roomDetailEmpty}</Card>
        ) : (
          <div className="grid gap-3">
            {anchors.map((a) => (
              <Card key={a._id} className="p-4 flex items-center gap-4">
                {a.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.imageUrl}
                    alt=""
                    title={a.imageAttribution ? `Photo: ${a.imageAttribution.photographerName} (Unsplash)` : undefined}
                    className="h-14 w-14 object-cover rounded-lg shrink-0"
                  />
                ) : (
                  <span className="h-14 w-14 rounded-lg bg-surface-muted flex items-center justify-center text-2xl shrink-0">📝</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{a.wordId.english}</p>
                  <p className="text-xs text-foreground/50 truncate">{a.wordId.korean}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(a._id)}
                  aria-label="delete"
                  className="text-foreground/30 hover:text-danger text-lg leading-none p-2 shrink-0"
                >
                  🗑
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
