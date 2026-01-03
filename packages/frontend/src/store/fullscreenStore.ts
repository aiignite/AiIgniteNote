import { create } from "zustand";

interface FullscreenStore {
  isFullscreen: boolean;
  setFullscreen: (fullscreen: boolean) => void;
  toggleFullscreen: () => void;
}

export const useFullscreenStore = create<FullscreenStore>((set) => ({
  isFullscreen: false,
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
}));
