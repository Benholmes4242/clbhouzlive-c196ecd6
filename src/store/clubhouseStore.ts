import { create } from 'zustand';

const SESSION_MUTE_KEY = 'clbhouz-feed-muted';

function getInitialMuted(): boolean {
  try {
    const saved = sessionStorage.getItem(SESSION_MUTE_KEY);
    if (saved !== null) return JSON.parse(saved);
  } catch {}
  return true; // default muted on fresh session
}

interface ClubhouseState {
  activeIndex: number;
  isMuted: boolean;
  userPaused: boolean;
  activeVideoElement: HTMLVideoElement | null;
  activeVideoRef: React.RefObject<HTMLVideoElement> | null;
  carouselPositions: Map<number, number>;

  setActiveIndex: (idx: number) => void;
  setIsMuted: (v: boolean) => void;
  toggleMute: () => void;
  setUserPaused: (v: boolean) => void;
  setActiveVideoElement: (el: HTMLVideoElement | null, ref: React.RefObject<HTMLVideoElement> | null) => void;
  setCarouselPosition: (feedIdx: number, mediaIdx: number) => void;
}

export const useClubhouseStore = create<ClubhouseState>()((set) => ({
  activeIndex: 0,
  isMuted: getInitialMuted(),
  userPaused: false,
  activeVideoElement: null,
  activeVideoRef: null,
  carouselPositions: new Map(),

  setActiveIndex: (idx) => {
    set({ activeIndex: idx });
  },
  setIsMuted: (v) => {
    try { sessionStorage.setItem(SESSION_MUTE_KEY, JSON.stringify(v)); } catch {}
    set({ isMuted: v });
  },
  toggleMute: () => set((s) => {
    const next = !s.isMuted;
    try { sessionStorage.setItem(SESSION_MUTE_KEY, JSON.stringify(next)); } catch {}
    return { isMuted: next };
  }),
  setUserPaused: (v) => set({ userPaused: v }),
  setActiveVideoElement: (el, ref) => set({ activeVideoElement: el, activeVideoRef: ref }),
  setCarouselPosition: (feedIdx, mediaIdx) =>
    set((s) => {
      const next = new Map(s.carouselPositions);
      next.set(feedIdx, mediaIdx);
      return { carouselPositions: next };
    }),
}));
