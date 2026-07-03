import { create } from 'zustand';

const SESSION_MUTE_KEY = 'clbhouz-feed-muted';

function getInitialMuted(): boolean {
  try {
    const saved = sessionStorage.getItem(SESSION_MUTE_KEY);
    if (saved !== null) return JSON.parse(saved);
  } catch {}
  // One-time cleanup of orphaned key from removed GlobalAudioContext mute state
  try { sessionStorage.removeItem('globalAudioState'); } catch {}
  return true; // default muted on fresh session
}

// Tracks recent user gesture for autoplay policy compliance
let _userGestureUnmuteTs = 0;

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

  isMuted: boolean;
  userPaused: boolean;
  activeVideoElement: HTMLVideoElement | null;
  activeVideoRef: React.RefObject<HTMLVideoElement> | null;
  isTournamentCardActive: boolean;

  setActiveTab: (tab: TabKey) => void;
  setActiveIndex: (idx: number, tab?: TabKey) => void;
  setCarouselPosition: (feedIdx: number, mediaIdx: number, tab?: TabKey) => void;
  setIsMuted: (v: boolean) => void;
  toggleMute: () => void;
  setUserPaused: (v: boolean) => void;
  setActiveVideoElement: (el: HTMLVideoElement | null, ref: React.RefObject<HTMLVideoElement> | null) => void;
  setIsTournamentCardActive: (v: boolean) => void;
  markUserGestureUnmute: () => void;
  isRecentUserGesture: () => boolean;
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

  isMuted: getInitialMuted(),
  userPaused: false,
  activeVideoElement: null,
  activeVideoRef: null,
  isTournamentCardActive: false,

  setActiveTab: (tab) => set((s) => {
    if (tab !== s.activeTab) {
      // Fire-and-forget telemetry mark (no-op unless FEED_TELEMETRY=1).
      import('@/lib/feedTelemetry').then((m) => m.markTabSwitch(String(s.activeTab), String(tab))).catch(() => {});
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
  setIsTournamentCardActive: (v) => set({ isTournamentCardActive: v }),
  markUserGestureUnmute: () => { _userGestureUnmuteTs = Date.now(); },
  isRecentUserGesture: () => Date.now() - _userGestureUnmuteTs < 2000,
}));
