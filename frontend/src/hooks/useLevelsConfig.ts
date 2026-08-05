"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { LevelConfig } from "@/lib/types";

export function useLevelsConfig() {
  const [config, setConfig] = useState<LevelConfig | null>(null);

  useEffect(() => {
    apiFetch<{ levels: LevelConfig }>("/config/levels", { skipAuth: true })
      .then((res) => setConfig(res.levels))
      .catch(() => setConfig(null));
  }, []);

  return config;
}
