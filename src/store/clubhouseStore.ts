import { create } from 'zustand';

export type TabKey = string; // 'foryou' | 'friends' | other surfaces (LightCardFeed etc use 'default')

const DEFAULT_TAB: TabKey = 'foryou';

interface ClubhouseState {
  /** Tab whose slot is mirrored to the legacy `activeIndex` / `carouselPositions`. */
  activeTab: TabKey;
  activeIndexByTab: Record<TabKey, number>;
  carouselPositionsByTab: Record<TabKey, Map<number, number>>;

  // Legacy mirrors of the active tab's slot (kept for back-compat with the
  // many consumers that read these directly — FeedOverlayLayer, FeedSlide,
  // FullscreenCarouselOverlay, LightCardFeed, FeedImageCarousel, etc.).
  activeIndex: number;
  carouselPositions: Map<number, number>;
  userPaused: boolean;
  // [VIDEO-TEARDOWN] activeVideoElement / activeVideoRef removed — poster-only chassis.
  isTournamentCardActive: boolean;

  setActiveTab: (tab: TabKey) => void;
  setActiveIndex: (idx: number, tab?: TabKey) => void;
  setCarouselPosition: (feedIdx: number, mediaIdx: number, tab?: TabKey) => void;
  setUserPaused: (v: boolean) => void;
  // [VIDEO-TEARDOWN] setActiveVideoElement removed — engine severed.
  setIsTournamentCardActive: (v: boolean) => void;
  /** Per-tab warmer — CardFeed registers a callback that prefetches the tab's
   *  active-index HLS first segment. Fired on setActiveTab so tab-restore
   *  doesn't stall on the cold segment fetch (manifest is already pooled). */
  registerTabWarmer: (tab: TabKey, fn: (() => void) | null) => void;
}

// Kept outside the state so callers don't retrigger React re-renders when
// registering/unregistering warmers.
const _tabWarmers = new Map<TabKey, () => void>();

function isSaveDataOn(): boolean {
  try {
    const c: any = (navigator as any).connection;
    return !!c?.saveData;
  } catch { return false; }
}

function isVisible(): boolean {
  try { return document.visibilityState === 'visible'; } catch { return true; }
}

function trimMap(map: Map<number, number>, cap = 20) {
  while (map.size > cap) {
    const firstKey = map.keys().next().value;
    if (firstKey === undefined) break;
    map.delete(firstKey);
  }
}

export const useClubhouseStore = create<ClubhouseState>()((set) => ({
  activeTab: DEFAULT_TAB,
  activeIndexByTab: { [DEFAULT_TAB]: 0 },
  carouselPositionsByTab: { [DEFAULT_TAB]: new Map() },

  activeIndex: 0,
  carouselPositions: new Map(),

  userPaused: false,
  // [VIDEO-TEARDOWN] activeVideoElement / activeVideoRef initial values removed.
  isTournamentCardActive: false,

  setActiveTab: (tab) => set((s) => {
    if (tab !== s.activeTab) {
      // Warm the restored tab's active-index HLS first segment. The manifest
      // is typically already pooled; this closes the cold-segment gap that
      // makes tab-restore first-frame noticeably slower than steady-state.
      // Gated on visibility + Save-Data.
      if (isVisible() && !isSaveDataOn()) {
        const warm = _tabWarmers.get(tab);
        if (warm) {
          // Defer so the tab-switch render commits first.
          queueMicrotask(() => { try { warm(); } catch {} });
        }
      }
    }
    const idx = s.activeIndexByTab[tab] ?? 0;
    const positions = s.carouselPositionsByTab[tab] ?? new Map<number, number>();
    return {
      activeTab: tab,
      activeIndexByTab: tab in s.activeIndexByTab ? s.activeIndexByTab : { ...s.activeIndexByTab, [tab]: 0 },
      carouselPositionsByTab: tab in s.carouselPositionsByTab ? s.carouselPositionsByTab : { ...s.carouselPositionsByTab, [tab]: positions },
      activeIndex: idx,
      carouselPositions: positions,
    };
  }),

  setActiveIndex: (idx, tab) => set((s) => {
    const target = tab ?? s.activeTab;
    const nextByTab = { ...s.activeIndexByTab, [target]: idx };
    const mirror = target === s.activeTab ? { activeIndex: idx } : {};
    return { activeIndexByTab: nextByTab, ...mirror };
  }),

  setCarouselPosition: (feedIdx, mediaIdx, tab) => set((s) => {
    const target = tab ?? s.activeTab;
    const prev = s.carouselPositionsByTab[target] ?? new Map<number, number>();
    const next = new Map(prev);
    next.set(feedIdx, mediaIdx);
    trimMap(next, 20);
    const nextByTab = { ...s.carouselPositionsByTab, [target]: next };
    const mirror = target === s.activeTab ? { carouselPositions: next } : {};
    return { carouselPositionsByTab: nextByTab, ...mirror };
  }),
  setUserPaused: (v) => set({ userPaused: v }),
  // [VIDEO-TEARDOWN] setActiveVideoElement setter removed.
  setIsTournamentCardActive: (v) => set({ isTournamentCardActive: v }),
  registerTabWarmer: (tab, fn) => {
    if (fn) _tabWarmers.set(tab, fn);
    else _tabWarmers.delete(tab);
  },
}));
