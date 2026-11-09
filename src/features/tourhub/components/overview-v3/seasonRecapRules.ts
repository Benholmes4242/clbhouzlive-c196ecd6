/**
 * SEASON RECAP RULES (BUILD Season recap, signed-off mock season-recap.html).
 *
 * A tour in OVERVIEW_TOUR_ORDER is BETWEEN SEASONS when
 *   (its most recent completed event ended more than RECAP_AFTER_DAYS ago
 *    OR its tour_races row for that season has status 'final')
 *   AND it has no event starting within RECAP_NEXT_EVENT_WINDOW_DAYS.
 * From 1 January of the following year, ANY loaded next event (at any
 * distance) ends the recap and that event's upcoming slide shows; with no next
 * event loaded the recap stays.
 *
 * FRESH STANDINGS ONLY: the race winner, the final board, the card list and the
 * CARDS / YOUNGEST cells read a standings source only when that source's own
 * date (scraped_at / snapshot_date) is on or after the final event's end date.
 * Otherwise the recap falls back to the winners sentence and the EVENTS /
 * WINNERS / MOST WINS facts. A stale list is never shown as FINAL.
 */
import type { TourId } from '../../hooks/useOverviewData';

export const RECAP_AFTER_DAYS = 7;
export const RECAP_NEXT_EVENT_WINDOW_DAYS = 21;
const DAY = 86_400_000;

export interface BetweenSeasonsInput {
  /** End date of the tour's most recent completed event. */
  lastEnd: string | null;
  /** Season year of that event. */
  seasonYear: number | null;
  /** Earliest scheduled next event start, any distance; null when none is loaded. */
  nextStart: string | null;
  raceFinal: boolean;
  now: Date;
}

const dayStart = (iso: string) => Date.parse(iso.length <= 10 ? `${iso}T00:00:00Z` : iso);

export function isBetweenSeasons({ lastEnd, seasonYear, nextStart, raceFinal, now }: BetweenSeasonsInput): boolean {
  if (!lastEnd) return false;
  const t = now.getTime();
  const next = nextStart ? dayStart(nextStart) : NaN;
  if (Number.isFinite(next)) {
    if (seasonYear != null && now.getUTCFullYear() > seasonYear) return false;
    if (next - t <= RECAP_NEXT_EVENT_WINDOW_DAYS * DAY) return false;
  }
  const end = dayStart(lastEnd);
  const stale = Number.isFinite(end) && t - end > RECAP_AFTER_DAYS * DAY;
  return stale || raceFinal;
}

/** Standings source date (scraped_at / snapshot_date) on or after the final event's end date. */
export function isFreshStandings(sourceDate: string | null | undefined, finalEnd: string | null | undefined): boolean {
  if (!sourceDate || !finalEnd) return false;
  return sourceDate.slice(0, 10) >= finalEnd.slice(0, 10);
}

/** Per-tour card/status line, picked by after_position (never by label text). DP World and Champions have none. */
export const RECAP_CARD_LINE: Partial<Record<TourId, { afterPosition: number; pronoun: 'his' | 'her' }>> = {
  pgad: { afterPosition: 20, pronoun: 'his' },
  lpga: { afterPosition: 80, pronoun: 'her' },
  pga: { afterPosition: 100, pronoun: 'his' },
};
export const RECAP_CARD_LIST_MAX = 20;

export function recapPronoun(tour: TourId): 'his' | 'her' {
  return tour === 'lpga' ? 'her' : 'his';
}

export function surname(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

/** "STEELMAN, Ross" → "Ross Steelman"; other names unchanged. */
export function displayName(raw: string): string {
  const m = raw.match(/^\s*([^,]+),\s*(.+)$/);
  if (!m) return raw.trim();
  const cap = (s: string) => s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_x, a, b) => a + b.toUpperCase());
  return `${m[2].trim()} ${cap(m[1].trim())}`;
}

export function fmtPoints(points: number): string {
  return Math.round(points).toLocaleString('en-US');
}

/** Whole years between birth and the reference date. */
export function ageAt(birth: string, at: string): number | null {
  const b = new Date(`${birth.slice(0, 10)}T00:00:00Z`);
  const a = new Date(`${at.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(b.getTime()) || Number.isNaN(a.getTime())) return null;
  let age = a.getUTCFullYear() - b.getUTCFullYear();
  if (a.getUTCMonth() < b.getUTCMonth() || (a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

export interface SeasonEvent { id: string; winnerId: string | null; endDate: string }

export function seasonWinnerFacts(events: SeasonEvent[]) {
  const wins = new Map<string, number>();
  for (const e of events) if (e.winnerId) wins.set(e.winnerId, (wins.get(e.winnerId) ?? 0) + 1);
  const max = Math.max(0, ...wins.values());
  const leaders = [...wins.entries()].filter(([, n]) => n === max).map(([id]) => id);
  return { events: events.length, winners: wins.size, maxWins: max, leaders };
}

export interface StandingRow { position: number; name: string; points: number | null; playerId: string | null }
export interface CardEarner { name: string; age: number | null }

export interface RecapFactCell { key: 'events' | 'winners' | 'cards' | 'youngest' | 'mostWins'; value: string; small?: string }

export function recapFactCells(args: {
  events: number; winners: number; maxWins: number; mostWinsSurname: string | null; tiedLeaders: number;
  cards: number | null; youngest: number | null;
  tiedLabel: (count: number) => string;
}): RecapFactCell[] {
  const out: RecapFactCell[] = [];
  if (args.events > 0) out.push({ key: 'events', value: String(args.events) });
  if (args.winners > 0) out.push({ key: 'winners', value: String(args.winners) });
  if (args.cards != null && args.cards <= RECAP_CARD_LIST_MAX) {
    out.push({ key: 'cards', value: String(args.cards) });
    if (args.youngest != null) out.push({ key: 'youngest', value: String(args.youngest) });
  } else if (args.maxWins > 0) {
    out.push(args.tiedLeaders > 1
      ? { key: 'mostWins', value: String(args.maxWins), small: args.tiedLabel(args.tiedLeaders) }
      : { key: 'mostWins', value: String(args.maxWins), small: args.mostWinsSurname ?? undefined });
  }
  return out;
}

/** Column-major two-column order: 1–10 left, 11–20 right, rendered row by row. */
export function columnMajor<T>(items: T[]): T[] {
  const half = Math.ceil(items.length / 2);
  const out: T[] = [];
  for (let i = 0; i < half; i++) {
    out.push(items[i]);
    if (items[i + half] !== undefined) out.push(items[i + half]);
  }
  return out;
}

/** The youngest card earner with a birth date; ties keep the higher finisher. */
export function youngestEarner(earners: CardEarner[]): CardEarner | null {
  let best: CardEarner | null = null;
  for (const e of earners) if (e.age != null && (best == null || e.age < (best.age as number))) best = e;
  return best;
}
