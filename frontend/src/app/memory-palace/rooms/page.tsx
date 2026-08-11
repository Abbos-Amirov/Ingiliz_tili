"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { useMemoryPalace } from "@/hooks/useMemoryPalace";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { PALACE_ROOMS } from "@/lib/palaceRooms";
import type { PalaceRoomKey } from "@/lib/types";

export default function MemoryPalaceRoomsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useT("memoryPalace");
  const rooms = useT("palaceRooms");
  const { fetchRoomCounts } = useMemoryPalace();

  const [countByRoomKey, setCountByRoomKey] = useState<Partial<Record<PalaceRoomKey, number>> | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    fetchRoomCounts().then((res) => setCountByRoomKey(res.countByRoomKey));
  }, [ready, user, fetchRoomCounts]);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return null;

  return (
    <div className="flex-1 px-4 sm:px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/memory-palace" className="inline-block mb-4 text-sm font-medium text-foreground/50 hover:text-primary">
          {t.backToHub}
        </Link>
        <PageHeader title={t.roomsPageTitle} subtitle={t.roomsPageSubtitle} />

        {countByRoomKey === null ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PALACE_ROOMS.map((room, i) => {
              const count = countByRoomKey[room.key] ?? 0;
              return (
                <motion.div key={room.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <Link href={`/memory-palace/rooms/${room.key}`}>
                    <Card
                      className={`p-4 h-full flex flex-col items-center text-center gap-1.5 transition-transform hover:-translate-y-0.5 ${
                        count === 0 ? "opacity-55" : ""
                      }`}
                      style={{ backgroundColor: room.bg, borderColor: `${room.text}30` }}
                    >
                      <span className="text-3xl">{room.emoji}</span>
                      <p className="font-bold text-sm leading-snug" style={{ color: room.text }}>
                        {rooms[room.key].name}
                      </p>
                      <p className="text-xs font-semibold" style={{ color: room.text }}>
                        {count > 0 ? `${count} ${t.roomWordsSuffix}` : t.roomEmptyBadge}
                      </p>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
