import { create } from 'zustand';

interface MediaStore {
  activeIndex: number;
  isMuted: boolean;
  setActiveIndex: (index: number) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
}

export const useMediaStore = create<MediaStore>((set) => ({
  activeIndex: 0,
  isMuted: true, // Required for autoplay
  setActiveIndex: (index) => set({ activeIndex: index }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setMuted: (muted) => set({ isMuted: muted }),
}));
