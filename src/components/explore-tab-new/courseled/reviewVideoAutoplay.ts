/**
 * REVIEW TILE AUTOPLAY COORDINATOR (BRIEF_REVIEW_TILE_AUTOPLAY).
 *
 * A deliberately small, NON-LANE-BOUND coordinator for muted looping video
 * covers on review tiles. It is NOT a second video engine:
 *   - it owns no decoder pool, no ABR, no manifest loading, no audio
 *   - it never unmutes, so it cannot collide with sessionAudioStore
 *   - it only answers ONE question per tile: "may you be playing right now?"
 *
 * Why not InlineVideo / VideoEngine: those are bound to three physical feed
 * lanes with role rotation ('feed-active' / 'feed-next' / 'feed-prev'), built
 * for a full-screen vertical feed where exactly one card is active. A
 * two-column grid of review tiles does not map onto that model.
 *
 * RULES ENCODED HERE
 *   - A tile qualifies only when at least IN_VIEW_THRESHOLD of it is visible.
 *   - AT MOST MAX_PLAYING tiles play per group. MAX_PLAYING mirrors
 *     video/lanePolicy.ts MAX_CONCURRENT_LOADS (2) rather than inventing a
 *     second concurrency ceiling.
 *   - When more than MAX_PLAYING qualify, the tiles nearest the VIEWPORT
 *     CENTRE win; the rest hold their poster.
 *   - Tiles that scroll out lose immediately (pause + release happens in the
 *     tile itself).
 *   - document.visibilityState === 'hidden' pauses every group.
 *
 * Groups are independent (the Discover page and the Latest reviews sheet each
 * get their own cap) because they never scroll together: the sheet covers the
 * page, and a covered page tile is out of view by definition.
 */

/**
 * 0.6 — a tile must be MEANINGFULLY in view, not intersecting by a pixel.
 * The tile is 186px tall in a two-column grid, so 0.6 means ~112px of it is on
 * screen: past the point where a member reads it as a tile they are looking at
 * rather than one entering from an edge. Lower (0.25) starts playback for rows
 * still below the fold during a fast flick; higher (0.9) never fires for the
 * partially clipped last row of a 75dvh sheet.
 */
export const IN_VIEW_THRESHOLD = 0.6;

/** Mirrors video/lanePolicy.ts MAX_CONCURRENT_LOADS — one ceiling, not two. */
export const MAX_PLAYING = 2;

/** Observer thresholds: enough granularity to cross 0.6 cleanly. */
const THRESHOLDS = [0, 0.25, 0.4, IN_VIEW_THRESHOLD, 0.8, 1];

type PlayCb = (playing: boolean) => void;

interface Entry {
  cb: PlayCb;
  ratio: number;
  /** Distance from the element centre to the viewport centre, in px. */
  dist: number;
  playing: boolean;
}

class Group {
  constructor(private threshold: number, private maxPlaying: number) {}
  private io: IntersectionObserver | null = null;
  private entries = new Map<Element, Entry>();

  register(el: Element, cb: PlayCb): () => void {
    this.entries.set(el, { cb, ratio: 0, dist: Number.POSITIVE_INFINITY, playing: false });
    this.observer().observe(el);
    return () => {
      this.io?.unobserve(el);
      const e = this.entries.get(el);
      if (e?.playing) e.cb(false);
      this.entries.delete(el);
      if (this.entries.size === 0) {
        this.io?.disconnect();
        this.io = null;
      } else {
        this.settle();
      }
    };
  }

  private observer(): IntersectionObserver {
    if (this.io) return this.io;
    this.io = new IntersectionObserver(
      (records) => {
        const mid = window.innerHeight / 2;
        for (const rec of records) {
          const e = this.entries.get(rec.target);
          if (!e) continue;
          e.ratio = rec.intersectionRatio;
          const r = rec.boundingClientRect;
          e.dist = Math.abs(r.top + r.height / 2 - mid);
        }
        this.settle();
      },
      { threshold: THRESHOLDS },
    );
    return this.io;
  }

  /** Recompute winners and notify only the tiles whose verdict changed. */
  settle(): void {
    const paused = typeof document !== 'undefined' && document.visibilityState === 'hidden';

    const winners = new Set<Element>();
    if (!paused) {
      const eligible = [...this.entries.entries()]
        .filter(([, e]) => e.ratio >= this.threshold)
        // Nearest the viewport centre wins. Ratio breaks a tie so a
        // two-column row resolves deterministically rather than by map order.
        .sort((a, b) => a[1].dist - b[1].dist || b[1].ratio - a[1].ratio)
        .slice(0, this.maxPlaying);
      for (const [el] of eligible) winners.add(el);
    }

    for (const [el, e] of this.entries) {
      const next = winners.has(el);
      if (next !== e.playing) {
        e.playing = next;
        e.cb(next);
      }
    }
  }
}

const groups = new Map<string, Group>();

function groupFor(key: string, options?: { threshold?: number; maxPlaying?: number }): Group {
  let g = groups.get(key);
  if (!g) {
    g = new Group(options?.threshold ?? IN_VIEW_THRESHOLD, options?.maxPlaying ?? MAX_PLAYING);
    groups.set(key, g);
  }
  return g;
}

/** Register a tile element in a group. Returns the unregister function. */
export function registerReviewVideo(
  groupKey: string,
  el: Element,
  cb: PlayCb,
  options?: { threshold?: number; maxPlaying?: number },
): () => void {
  return groupFor(groupKey, options).register(el, cb);
}

// Backgrounding pauses everything; returning re-settles, so only tiles that
// STILL qualify resume.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    for (const g of groups.values()) g.settle();
  });
}

/**
 * Save-Data / reduced motion gate. Poster-only when either is on.
 *
 * navigator.connection.saveData is Chromium-only. The Median WebView on
 * Android is Chromium and DOES expose it; on iOS it is WKWebView, which does
 * not implement the Network Information API at all, so this reads undefined
 * there. We do NOT add a setting for it — undefined simply means "no signal,
 * play normally".
 */
export function autoplayBlocked(reducedMotion: boolean): boolean {
  if (reducedMotion) return true;
  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  return conn?.saveData === true;
}
