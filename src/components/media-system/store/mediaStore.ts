import type React from 'react';
import { create } from 'zustand';

interface MediaStore {
  // Feed State
  activeIndex: number;
  scrollDirection: 'up' | 'down' | null;
  isTransitioning: boolean;

  // Audio State
  isMuted: boolean;
  volume: number;

  // Pause State
  userPaused: boolean;

  // Carousel State
  carouselPositions: Map<number, number>; // feedIndex → mediaIndex

  // Active Video Element (for page-level scrubber)
  activeVideoElement: HTMLVideoElement | null;
  activeVideoRef: React.RefObject<HTMLVideoElement | null> | null;

  // Error State
  errorItems: Set<number>;
  retryingItems: Set<number>;

  // Actions
  setActiveIndex: (index: number) => void;
  setScrollDirection: (dir: 'up' | 'down' | null) => void;
  setIsTransitioning: (v: boolean) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  setVolume: (v: number) => void;
  setUserPaused: (paused: boolean) => void;
  setCarouselPosition: (feedIndex: number, mediaIndex: number) => void;
  markError: (feedIndex: number) => void;
  clearError: (feedIndex: number) => void;
  markRetrying: (feedIndex: number) => void;
  clearRetrying: (feedIndex: number) => void;
  setActiveVideoElement: (el: HTMLVideoElement | null, ref: React.RefObject<HTMLVideoElement | null> | null) => void;
}

export const useMediaStore = create<MediaStore>((set) => ({
  activeIndex: 0,
  scrollDirection: null,
  isTransitioning: false,

  isMuted: true,
  volume: 1,

  userPaused: false,

  carouselPositions: new Map(),

  errorItems: new Set(),
  retryingItems: new Set(),

  activeVideoElement: null,
  activeVideoRef: null,

  setActiveIndex: (index) => set((s) => ({
    activeIndex: index,
    scrollDirection: index > s.activeIndex ? 'down' : index < s.activeIndex ? 'up' : s.scrollDirection,
  })),
  setScrollDirection: (dir) => set({ scrollDirection: dir }),
  setIsTransitioning: (v) => set({ isTransitioning: v }),

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setMuted: (muted) => set({ isMuted: muted }),
  setVolume: (v) => set({ volume: v }),
  setUserPaused: (paused) => set({ userPaused: paused }),

  setCarouselPosition: (feedIndex, mediaIndex) =>
    set((s) => {
      const next = new Map(s.carouselPositions);
      next.set(feedIndex, mediaIndex);
      return { carouselPositions: next };
    }),

  markError: (feedIndex) =>
    set((s) => {
      const next = new Set(s.errorItems);
      next.add(feedIndex);
      return { errorItems: next };
    }),
  clearError: (feedIndex) =>
    set((s) => {
      const next = new Set(s.errorItems);
      next.delete(feedIndex);
      const r = new Set(s.retryingItems);
      r.delete(feedIndex);
      return { errorItems: next, retryingItems: r };
    }),
  markRetrying: (feedIndex) =>
    set((s) => {
      const next = new Set(s.retryingItems);
      next.add(feedIndex);
      return { retryingItems: next };
    }),
  clearRetrying: (feedIndex) =>
    set((s) => {
      const next = new Set(s.retryingItems);
      next.delete(feedIndex);
      return { retryingItems: next };
    }),
}));
