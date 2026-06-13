import { create } from "zustand";
import type { Driver } from "../../shared/types";

interface AppState {
  currentDriver: Driver | null;
  setCurrentDriver: (d: Driver | null) => void;
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentDriver: null,
  setCurrentDriver: (d) => set({ currentDriver: d }),
  toast: null,
  showToast: (message, type = "info") => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  clearToast: () => set({ toast: null }),
}));
