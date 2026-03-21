import { create } from 'zustand';

interface ClubhouseState {
  activeIndex: number;
  isMuted: boolean;
  userPaused: boolean;
  activeVideoElement: HTMLVideoElement | null;
  activeVideoRef: React.RefObject<HTMLVideoElement> | null;
  carouselPositions: Map<number, number>;
  isTournamentCardActive: boolean;

  setActiveIndex: (idx: number) => void;
  setIsMuted: (v: boolean) => void;
  toggleMute: () => void;
  setUserPaused: (v: boolean) => void;
  setActiveVideoElement: (el: HTMLVideoElement | null, ref: React.RefObject<HTMLVideoElement> | null) => void;
  setCarouselPosition: (feedIdx: number, mediaIdx: number) => void;
  setIsTournamentCardActive: (active: boolean) => void;
}

export const useClubhouseStore = create<ClubhouseState>()((set) => ({
  activeIndex: 0,
  isMuted: true,
  userPaused: false,
  activeVideoElement: null,
  activeVideoRef: null,
  carouselPositions: new Map(),
  isTournamentCardActive: false,

  setActiveIndex: (idx) => set({ activeIndex: idx }),
  setIsMuted: (v) => set({ isMuted: v }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setUserPaused: (v) => set({ userPaused: v }),
  setActiveVideoElement: (el, ref) => set({ activeVideoElement: el, activeVideoRef: ref }),
  setCarouselPosition: (feedIdx, mediaIdx) =>
    set((s) => {
      const next = new Map(s.carouselPositions);
      next.set(feedIdx, mediaIdx);
      return { carouselPositions: next };
    }),
  setIsTournamentCardActive: (active) => set({ isTournamentCardActive: active }),
}));
