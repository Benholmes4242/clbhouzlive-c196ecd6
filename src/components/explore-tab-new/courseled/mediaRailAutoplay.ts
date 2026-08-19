/**
 * MEDIA RAIL AUTOPLAY — ONE tile plays per PAGE, not per rail
 * (BRIEF_DISCOVER_MEDIA_RAILS §3.2).
 *
 * Why this is not reviewVideoAutoplay: that coordinator's cap is MAX_PLAYING = 2
 * PER GROUP, which is right for the mosaic and the reviews sheet. Discover now
 * carries TWO video rails, and a per-rail coordinator with a cap of two would
 * run up to four streams on a Median WebView. This module holds ONE registry for
 * the whole page and elects exactly ONE winner across both rails.
 *
 * THE WINNER is the registered tile nearest the CENTRE OF THE VIEWPORT that is
 * at least IN_VIEW_THRESHOLD visible. Everything else shows its poster frame,
 * which is the resting state — autoplay is the enhancement.
 *
 * Off-screen rails contribute nothing: their tiles are out of view by definition
 * so their ratio is 0, and the rails additionally stop mounting video at all
 * (see the rail's own IntersectionObserver).
 */

/** A tile must be meaningfully in view, not intersecting by a pixel. */
export const IN_VIEW_THRESHOLD = 0.6;

/** ONE stream at a time across the whole page. */
export const MAX_PLAYING = 1;

const THRESHOLDS = [0, 0.25, 0.4, IN_VIEW_THRESHOLD, 0.8, 1];

type PlayCb = (playing: boolean) => void;

interface Entry {
  cb: PlayCb;
  ratio: number;
  /** Distance from the element centre to the viewport centre, in px. */
  dist: number;
  playing: boolean;
}

const entries = new Map<Element, Entry>();
let io: IntersectionObserver | null = null;

function settle(): void {
  const paused = typeof document !== 'undefined' && document.visibilityState === 'hidden';

  const winners = new Set<Element>();
  if (!paused) {
    const eligible = [...entries.entries()]
      .filter(([, e]) => e.ratio >= IN_VIEW_THRESHOLD)
      // Nearest the viewport centre wins; ratio breaks ties deterministically.
      .sort((a, b) => a[1].dist - b[1].dist || b[1].ratio - a[1].ratio)
      .slice(0, MAX_PLAYING);
    for (const [el] of eligible) winners.add(el);
  }

  for (const [el, e] of entries) {
    const next = winners.has(el);
    if (next !== e.playing) {
      e.playing = next;
      e.cb(next);
    }
  }
}

function observer(): IntersectionObserver {
  if (io) return io;
  io = new IntersectionObserver(
    (records) => {
      const mid = window.innerHeight / 2;
      for (const rec of records) {
        const e = entries.get(rec.target);
        if (!e) continue;
        e.ratio = rec.intersectionRatio;
        const r = rec.boundingClientRect;
        e.dist = Math.abs(r.top + r.height / 2 - mid);
      }
      settle();
    },
    { threshold: THRESHOLDS },
  );
  return io;
}

/** Register a rail tile. Returns the unregister function. */
export function registerRailVideo(el: Element, cb: PlayCb): () => void {
  entries.set(el, { cb, ratio: 0, dist: Number.POSITIVE_INFINITY, playing: false });
  observer().observe(el);
  return () => {
    io?.unobserve(el);
    const e = entries.get(el);
    if (e?.playing) e.cb(false);
    entries.delete(el);
    if (entries.size === 0) {
      io?.disconnect();
      io = null;
    } else {
      settle();
    }
  };
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => settle());
}
