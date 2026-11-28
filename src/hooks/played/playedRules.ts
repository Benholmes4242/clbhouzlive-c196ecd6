/** Brief 50 — pure rules for the member's played state. The database owns
 * "played" (rated OR tracked round OR ticked); the client only reads
 * get_my_played_courses and never re-derives it. */
export interface PlayedEntry {
  course_id: string;
  via_rating: boolean;
  via_round: boolean;
  via_tick: boolean;
  rating: number | null;
  ticked_at: string | null;
  can_untick: boolean;
  rounds: number;
}

export type TickSource = 'courses_list' | 'top100_list' | 'tick_sheet' | 'course_page' | 'undo';

export const isPlayed = (e: PlayedEntry | null | undefined) =>
  Boolean(e && (e.via_rating || e.via_round || e.via_tick));
export const isRated = (e: PlayedEntry | null | undefined) => Boolean(e?.via_rating);

/** RATED outranks PLAYED: a rating implies a visit. */
export function viewerPill(e: PlayedEntry | null | undefined): 'rated' | 'played' | null {
  if (isRated(e)) return 'rated';
  return isPlayed(e) ? 'played' : null;
}

/** A locked tick never changes on tap; the toast says why. */
export function lockedReason(e: PlayedEntry | null | undefined): string | null {
  if (!isPlayed(e) || e!.can_untick) return null;
  return e!.via_rating ? "You've rated this course" : 'You have rounds here';
}

export function formatRating(r: number | null | undefined) {
  return r == null ? '' : Number(r).toFixed(1);
}

/** The card you-line. Null when not played. */
export function youLine(e: PlayedEntry | null | undefined):
  | { kind: 'rated'; rating: string }
  | { kind: 'unrated'; text: string }
  | null {
  if (!isPlayed(e)) return null;
  if (e!.via_rating) return { kind: 'rated', rating: formatRating(e!.rating) };
  if (!e!.via_tick && e!.rounds > 0) {
    return { kind: 'unrated', text: e!.rounds === 1 ? '1 round tracked here · not rated yet' : `${e!.rounds} rounds tracked here · not rated yet` };
  }
  return { kind: 'unrated', text: 'You played it · not rated yet' };
}

/** The optimistic entry after a tick / untick. */
export function optimisticEntry(prev: PlayedEntry | undefined, courseId: string, played: boolean, now = new Date()): PlayedEntry | null {
  if (played) {
    return {
      course_id: courseId,
      via_rating: prev?.via_rating ?? false,
      via_round: prev?.via_round ?? false,
      via_tick: true,
      rating: prev?.rating ?? null,
      ticked_at: prev?.ticked_at ?? now.toISOString(),
      can_untick: !(prev?.via_rating || prev?.via_round),
      rounds: prev?.rounds ?? 0,
    };
  }
  if (!prev) return null;
  if (prev.via_rating || prev.via_round) return { ...prev, via_tick: false, ticked_at: null };
  return null;
}

const DAY = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Waiting-for-rating sub-line. */
export function waitingSubLine(e: PlayedEntry, now = new Date()): string {
  if (e.via_tick && e.ticked_at) {
    const t = new Date(e.ticked_at);
    const startOf = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const days = Math.round((startOf(now) - startOf(t)) / DAY);
    if (days <= 0) return 'Ticked today';
    if (days === 1) return 'Ticked 1 day ago';
    if (days <= 30) return `Ticked ${days} days ago`;
    return `Ticked on ${t.getDate()} ${MONTHS[t.getMonth()]}`;
  }
  return e.rounds === 1 ? '1 round tracked' : `${e.rounds} rounds tracked`;
}

/** Played-but-unrated, ticked first (newest tick first), then rounds-only (most rounds first). */
export function waitingForRating(entries: PlayedEntry[], inList?: (id: string) => boolean): PlayedEntry[] {
  const pool = entries.filter(e => isPlayed(e) && !e.via_rating && (!inList || inList(e.course_id)));
  const ticked = pool.filter(e => e.via_tick).sort((a, b) => (b.ticked_at ?? '').localeCompare(a.ticked_at ?? ''));
  const rounds = pool.filter(e => !e.via_tick).sort((a, b) => b.rounds - a.rounds);
  return [...ticked, ...rounds];
}
