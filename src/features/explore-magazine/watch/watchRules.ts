/**
 * THE WATCH RULES (BRIEF_WATCH_PAGE). Pure, so every rule is tested.
 *
 * K.0 — the one rule everything hangs off: a video UNDER three minutes is a
 * Quick Hit (portrait 9:16, horizontal rail); three minutes or more is
 * long-form (full width 16:9, vertical column). Never inline 180 anywhere else.
 */
import type { HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';

export const QUICK_HIT_MAX = 180; // seconds
/** Past this fraction a video counts as watched: no bar, out of Continue watching. */
export const NEARLY_DONE = 0.95;
/** Below this fraction a video has not really been started. */
export const STARTED_MIN = 0.02;
/** The community rail is injected after this many long-form cards. */
export const RAIL_EVERY = 3;

export interface SavedProgress {
  position: number;
  duration: number | null;
}

/** Unknown duration is treated as long-form: we never shrink what we cannot measure. */
export function isQuickHit(durationSeconds: number | null | undefined): boolean {
  return typeof durationSeconds === 'number' && durationSeconds > 0 && durationSeconds < QUICK_HIT_MAX;
}

/**
 * L.3 — duration decides the rail; the SOURCE decides the frame. True only when
 * both dimensions are known and height > width. Unknown shape is not guessed.
 */
export function isPortraitSource(row: { width?: number | null; height?: number | null }): boolean {
  const w = Number(row.width ?? 0);
  const h = Number(row.height ?? 0);
  return w > 0 && h > 0 && h > w;
}

function durationOf(row: Pick<HubRpcRow, 'duration_seconds'>, saved: SavedProgress | undefined): number {
  const d = Number(row.duration_seconds ?? 0) || Number(saved?.duration ?? 0);
  return d > 0 ? d : 0;
}

export function progressFraction(row: Pick<HubRpcRow, 'duration_seconds'>, saved: SavedProgress | undefined): number {
  if (!saved) return 0;
  const d = durationOf(row, saved);
  if (d <= 0) return 0;
  return Math.max(0, Math.min(1, saved.position / d));
}

/** Above 2% and below 95%: draws a bar and belongs in Continue watching. */
export function isPartWatched(row: Pick<HubRpcRow, 'duration_seconds'>, saved: SavedProgress | undefined): boolean {
  const f = progressFraction(row, saved);
  return f > STARTED_MIN && f < NEARLY_DONE;
}

/** "19 min left" at or above a minute, "45s left" below. Never a percentage. */
export function remainingLabel(row: Pick<HubRpcRow, 'duration_seconds'>, saved: SavedProgress | undefined): string {
  const left = Math.max(0, durationOf(row, saved) - (saved?.position ?? 0));
  return left >= 60 ? `${Math.round(left / 60)} min left` : `${Math.max(1, Math.round(left))}s left`;
}

export function viewsLabel(n: number | null | undefined): string | null {
  if (n == null) return null;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k views`;
  return `${n} ${n === 1 ? 'view' : 'views'}`;
}

export interface ReasonLine {
  text: string;
  hot: boolean;
}

/**
 * K.4 line two — the reason it is in front of you, one line, in priority.
 * Returns null for "none of the above": no dash, no placeholder.
 */
export function reasonLine(input: {
  partWatched: boolean;
  remaining: string;
  courseName: string | null | undefined;
  onYourCourse: boolean;
  fromFollowed: boolean;
}): ReasonLine | null {
  if (input.partWatched) return { text: `\u25CF ${input.remaining}`, hot: true };
  const course = input.courseName?.trim();
  if (course && input.onYourCourse) return { text: `Filmed at ${course}`, hot: true };
  if (course) return { text: `Filmed at ${course}`, hot: false };
  if (input.fromFollowed) return { text: 'From someone you follow', hot: false };
  return null;
}

/**
 * K.5 — never two consecutive cards from the same creator WHERE AN ALTERNATIVE
 * EXISTS. Greedy and stable; nothing is dropped, so a dominant creator clumps
 * only at the tail when nothing else is left.
 */
export function spreadByCreator<T>(list: T[], creatorOf: (item: T) => string): T[] {
  const out: T[] = [];
  const pool = list.slice();
  while (pool.length) {
    let i = 0;
    if (out.length) {
      const last = creatorOf(out[out.length - 1]);
      if (creatorOf(pool[0]) === last) {
        const j = pool.findIndex((item) => creatorOf(item) !== last);
        if (j > 0) i = j;
      }
    }
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

/** K.6 — one entry per MEMBER, first appearance wins, with their item count. */
export function groupByMember<T>(list: T[], memberOf: (item: T) => string | null | undefined): { lead: T; count: number }[] {
  const order: string[] = [];
  const groups = new Map<string, { lead: T; count: number }>();
  for (const item of list) {
    const key = memberOf(item);
    if (!key) continue;
    const g = groups.get(key);
    if (g) g.count += 1;
    else {
      groups.set(key, { lead: item, count: 1 });
      order.push(key);
    }
  }
  return order.map((k) => groups.get(k)!);
}

export function photosCaption(courseName: string | null | undefined, count: number): string {
  const course = courseName?.trim() ?? '';
  const tail = count > 1 ? `${count} photos` : '';
  return [course, tail].filter(Boolean).join(' \u00B7 ');
}
