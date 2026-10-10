/**
 * VideoEngine — Stage 0 lane policy (gates centralised here).
 *
 * Everything the engine needs to decide "can I load / play / unmute right
 * now?" lives here so the engine stays dumb. No React, no DOM.
 */

export type LaneId =
  | 'feed-active'
  | 'feed-next'
  | 'feed-prev'
  | 'fullscreen'
  | 'fullscreen-next'
  | 'rail-0'
  | 'rail-1'
  | 'rail-2';

export const DEFAULT_LANE_IDS: LaneId[] = [
  'feed-active',
  'feed-next',
  'feed-prev',
  'fullscreen',
  'rail-0',
  'rail-1',
  'rail-2',
];

/** Budgeted rail-lane pool size (decoder ceiling — NOT one lane per rail). */
export const RAIL_LANE_BUDGET = 3;
/** BRIEF_FULLSCREEN_PAGER_NEIGHBOUR_WARM §1 — lanes created LAZILY on first
 *  use rather than at boot, so a single-media fullscreen open never allocates
 *  them. 'fullscreen-next' holds the multi-media pager's likely next page
 *  decoded; it is configured like 'fullscreen' but is NEVER the speaker. */
export const LAZY_LANE_IDS: LaneId[] = ['fullscreen-next'];

/** 'fullscreen' and its pager neighbour share the viewport-sized config. */
export function isFullscreenLane(id: LaneId): boolean {
  return id === 'fullscreen' || id === 'fullscreen-next';
}

export const RAIL_LANE_IDS: LaneId[] = ['rail-0', 'rail-1', 'rail-2'];

/** Max concurrent lanes actively loading a manifest. */
export const MAX_CONCURRENT_LOADS = 2;


/** ABR ceiling (kbps) applied to every lane. */
export const ABR_MAX_KBPS = 5000;

/** Only one lane may be unmuted at any time. */
export const ONE_UNMUTED_LANE = true;

/** Pause every lane on tab hidden. */
export const PAUSE_ON_HIDDEN = true;

/**
 * Save-data / 2g gate. When true the engine refuses to auto-load and only
 * loads on explicit user intent. Read once at boot (users don't toggle
 * connections mid-session).
 */
export function shouldGateForSaveData(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as any).connection;
  if (!conn) return false;
  if (conn.saveData === true) return true;
  const t = conn.effectiveType as string | undefined;
  return t === 'slow-2g' || t === '2g';
}

export const HLS_CONFIG = {
  // Startup: let the engine seek to startPosition on manifest-parsed.
  startPosition: -1,
  // Small back buffer keeps memory in check across 4 lanes.
  backBufferLength: 30,
  // Modest forward buffer — enough for a snappy seek, not enough to hog data.
  maxBufferLength: 20,
  maxMaxBufferLength: 40,
  maxBufferSize: 30 * 1024 * 1024,
  // NOTE: capLevelToPlayerSize is applied per-lane in VideoEngine (rail and
  // feed lanes). Feed lanes render inside a card, rails inside small tiles;
  // only the fullscreen lane renders at viewport size and stays uncapped.
  // Don't let hls thrash when tabs backgrounded.
  enableWorker: true,
  lowLatencyMode: false,
  // CRISP FIRST FRAME: hls.js's built-in "bandwidth test" loads the first
  // fragment at the LOWEST rung to measure throughput. With 4s segments that
  // means several seconds of visibly blurry video on every open. We seed ABR
  // from bandwidth memory and pick the opening rung ourselves instead.
  testBandwidth: false,
  // Fetch the first fragment while the level playlist is still being parsed.
  startFragPrefetch: true,
  // Don't sit on a stalled fragment for 4s before switching down.
  maxStarvationDelay: 2,
  maxLoadingDelay: 2,
  fragLoadingMaxRetry: 4,
  manifestLoadingMaxRetry: 3,
} as const;

/** Rail-only overrides applied on top of HLS_CONFIG for lanes with id
 *  prefix `rail-`. Keeps cold-start segment fetch small (lowest rung) and
 *  caps subsequent levels to the tile's rendered size — the Instagram-grid
 *  approach; capLevelToPlayerSize auto-upshifts on element grow, so borrowed
 *  rail lanes re-parented into fullscreen scale up naturally. */
export const RAIL_HLS_OVERRIDES = {
  capLevelToPlayerSize: true,
} as const;


/** Feed-lane overrides (feed-active / feed-next / feed-prev): cap ABR to the
 *  card's rendered size. The fullscreen lane is deliberately NOT capped. */
export const FEED_HLS_OVERRIDES = {
  capLevelToPlayerSize: true,
} as const;

/** Forward buffer (s) for the playing feed lane — equals HLS_CONFIG.maxBufferLength. */
export const FEED_ACTIVE_MAX_BUFFER_S = 20;
/** Forward buffer (s) for paused, preloaded neighbour lanes. */
export const FEED_PRELOAD_MAX_BUFFER_S = 6;

/** Fullscreen-only overrides: a longer back buffer so the JS loop's seek to 0
 *  on long clips does not refetch evicted segments. maxBufferSize still caps
 *  memory. Feed and rail lanes keep HLS_CONFIG's 30s. */
export const FULLSCREEN_HLS_OVERRIDES = {
  backBufferLength: 90,
} as const;
