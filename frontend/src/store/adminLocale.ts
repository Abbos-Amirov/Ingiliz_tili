import { create } from "zustand";
import { persist } from "zustand/middleware";

// The admin panel has its own UI language (English by default, or Uzbek),
// separate from the learner-facing locale switcher.
export type AdminLocale = "en" | "uz";

interface AdminLocaleState {
  locale: AdminLocale;
  setLocale: (locale: AdminLocale) => void;
}

export const useAdminLocaleStore = create<AdminLocaleState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "ingiliztili_admin_locale" },
  ),
);
