/**
 * MEDIA ENGAGEMENT — the two events that answer "which section earns its
 * position" (BRIEF_MEDIA_TRACKING_MINIMUM).
 *
 *   media_item_impression   it was seen
 *   media_item_opened       it was chosen
 *
 * TAPS ÷ IMPRESSIONS IS THE WHOLE ANSWER, so both events carry the SAME four
 * properties — media_type, surface, section, position — and both are emitted
 * through the ONE pair of helpers below (§5.4). Scattered inline track() calls
 * are how community_moment_tapped ended up with no section field.
 *
 * NO PLAYBACK, DWELL OR COMPLETION EVENTS (§0). Depth is a second question.
 *
 * WHY A SHARED SINGLETON OBSERVER, AND WHAT WAS REUSED (§1.1). The registry
 * shape here is lifted from mediaRailAutoplay: one IntersectionObserver for the
 * whole page, tiles register and unregister an element. Its INSTANCE could not
 * be reused, for two reasons that would both bias the denominator:
 *   - it observes only the video HOST of a tile that actually mounted video, so
 *     photos, reduced-motion sessions and Save-Data sessions register nothing;
 *   - its thresholds are tuned for a 0.6 election, not a 0.5 dwell.
 * Reusing it would have measured impressions for exactly the media type that can
 * autoplay, which is the confound the audit already found.
 */

import { useEffect, useRef, useState } from 'react';

import { analyticsEvents } from './analyticsEvents';
import { getSessionId } from './analyticsSession';

export type MediaTypeTag = 'photo' | 'clip' | 'video';
export type MediaSurface = 'discover' | 'community';
export type MediaSection =
  | 'featured'
  | 'clips'
  | 'videos'
  | 'photos'
  | 'browse_by_club';

/** Everything both events carry. One shape, so the two can be divided. */
export interface MediaTrackTarget {
  mediaType: MediaTypeTag;
  surface: MediaSurface;
  section: MediaSection;
  /** Zero-based index WITHIN the section. -1 means a whole-section "see all". */
  position: number;
  postId: string;
  mediaId: string | null;
}

/** Long form starts at 180s — the same boundary the library pools use. */
const LONG_FORM_SECONDS = 180;

/**
 * media_type from the item, never from the section it happens to sit in: a
 * mis-sorted item must be counted as what it IS, or the ratio measures the sort.
 * An unknown duration reads as 'clip', matching where the library pools put it.
 */
export function deriveMediaType(item: {
  kind?: 'video' | 'photo';
  duration?: number | null;
  durationSeconds?: number | null;
}): MediaTypeTag {
  if (item.kind === 'photo') return 'photo';
  const d = item.duration ?? item.durationSeconds ?? null;
  if (d != null && Number(d) >= LONG_FORM_SECONDS) return 'video';
  return 'clip';
}

/** Build a target from a library/rail item. */
export function mediaTarget(
  item: {
    kind?: 'video' | 'photo';
    duration?: number | null;
    durationSeconds?: number | null;
    postId: string;
    mediaId?: string | null;
  },
  surface: MediaSurface,
  section: MediaSection,
  position: number,
): MediaTrackTarget {
  return {
    mediaType: deriveMediaType(item),
    surface,
    section,
    position,
    postId: item.postId,
    mediaId: item.mediaId ?? null,
  };
}

/* ------------------------------------------------------------------ *
 * IMPRESSION: 50% visible for ONE CONTINUOUS SECOND, ONCE PER TILE
 * PER SESSION.
 *
 * ONCE PER SESSION and not once per scroll-past: a member scrolling a rail up
 * and down must not inflate their own denominator. The seen-set is in memory,
 * so a full page RELOAD inside a 30-minute session can re-fire a tile's
 * impression once. Persisting hundreds of keys to storage to close that gap
 * would cost more than the gap is worth; noted rather than hidden.
 * ------------------------------------------------------------------ */

const DWELL_MS = 1000;
const VISIBLE_RATIO = 0.5;

const seen = new Set<string>();

function seenKey(t: MediaTrackTarget): string {
  return `${getSessionId()}|${t.surface}|${t.section}|${t.mediaId ?? t.postId}`;
}

interface Registration {
  target: MediaTrackTarget;
  timer: ReturnType<typeof setTimeout> | null;
}

const registry = new Map<Element, Registration>();
let io: IntersectionObserver | null = null;

function observer(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;
  if (io) return io;
  io = new IntersectionObserver(
    (records) => {
      for (const rec of records) {
        const reg = registry.get(rec.target);
        if (!reg) continue;
        const visible = rec.intersectionRatio >= VISIBLE_RATIO;
        if (visible && !reg.timer) {
          const el = rec.target;
          reg.timer = setTimeout(() => {
            const live = registry.get(el);
            if (!live) return;
            live.timer = null;
            const key = seenKey(live.target);
            if (seen.has(key)) return;
            seen.add(key);
            analyticsEvents.media.impression(live.target);
          }, DWELL_MS);
        } else if (!visible && reg.timer) {
          // CONTINUOUS second: leaving view restarts the clock.
          clearTimeout(reg.timer);
          reg.timer = null;
        }
      }
    },
    { threshold: [0, VISIBLE_RATIO, 1] },
  );
  return io;
}

/** Register a tile element. Returns the unregister function. */
export function registerMediaImpression(
  el: Element,
  target: MediaTrackTarget,
): () => void {
  const key = seenKey(target);
  if (seen.has(key)) return () => {};
  const obs = observer();
  if (!obs) return () => {};
  registry.set(el, { target, timer: null });
  obs.observe(el);
  return () => {
    const reg = registry.get(el);
    if (reg?.timer) clearTimeout(reg.timer);
    registry.delete(el);
    obs.unobserve(el);
  };
}

/**
 * Callback ref for a tile root. Pass undefined to opt a surface out entirely
 * (the tiles are shared, and a surface that has not been wired must not throw).
 */
export function useMediaImpression(target?: MediaTrackTarget) {
  const [node, setNode] = useState<Element | null>(null);
  // The target is an object literal at every call site, so it is compared by its
  // fields — otherwise every render would unregister and re-register the tile
  // and the one-second clock would never finish.
  const keyed = target
    ? `${target.surface}|${target.section}|${target.position}|${target.postId}|${target.mediaId ?? ''}|${target.mediaType}`
    : null;
  const latest = useRef(target);
  latest.current = target;

  useEffect(() => {
    const t = latest.current;
    if (!node || !t) return;
    return registerMediaImpression(node, t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, keyed]);

  return setNode;
}
