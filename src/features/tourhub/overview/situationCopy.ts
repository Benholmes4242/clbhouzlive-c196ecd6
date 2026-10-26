/**
 * The ONE "The situation" copy builder (BRIEF_TOUR_PLAYOFF_AND_SHORTENED_EVENTS
 * §4–§6). The overview SituationBand and the tournament page's situation block
 * both read it, so the shortened sentence, the standing sentence and the
 * hand-set note cannot drift between surfaces.
 *
 * - shortenedTo: derived from the board only; applies to results (any variant)
 *   and awaiting-playoff, never while live or suspended.
 * - situation_note: shown only while live, suspended or awaiting-playoff, or
 *   within SITUATION_NOTE_DAYS after end_date.
 */
import type { TFunction } from 'i18next';
import type { HeroState } from '../components/overview-v3/HybridHero.utils';
import type { HeadlineSegment } from './magazineCopy';

export const SITUATION_NOTE_DAYS = 3;

type RoundRow = { round_1?: number | null; round_2?: number | null; round_3?: number | null; round_4?: number | null };

/** Highest round with any non-null score, returned only when below scheduledRounds. */
export function shortenedTo(entries: RoundRow[], scheduledRounds: number): number | null {
  let played = 0;
  for (const row of entries) {
    for (let round = 4; round >= 1; round -= 1) {
      const value = row[`round_${round}` as keyof RoundRow];
      if (typeof value === 'number' && Number.isFinite(value)) { if (round > played) played = round; break; }
    }
  }
  return played > 0 && played < scheduledRounds ? played : null;
}

/** States in which a shortened event may be described. */
export function shortenedApplies(state: HeroState): boolean {
  return state.kind === 'results';
}

/** The shortened sentence as segments (figures set apart), or [] when not shortened. */
export function shortenedSegments(played: number | null, scheduledRounds: number, t: TFunction): HeadlineSegment[] {
  if (played == null || played >= scheduledRounds) return [];
  const holes = played * 18;
  if (scheduledRounds - played === 1) {
    const cancelled = played + 1;
    const text = String(t('overview.situation.roundCancelled', { cancelled: '\uE000', holes: '\uE001' }));
    return fill(text, [String(cancelled), String(holes)]);
  }
  return fill(String(t('overview.situation.cutTo', { holes: '\uE000' })), [String(holes)]);
}

/* Markers U+E000.. stand in for figures so translations may reorder them. */
function fill(text: string, figures: string[]): HeadlineSegment[] {
  const out: HeadlineSegment[] = [];
  let rest = text;
  for (;;) {
    const match = /[\uE000-\uE00F]/.exec(rest);
    if (!match) break;
    if (match.index > 0) out.push({ text: rest.slice(0, match.index), figure: false });
    out.push({ text: figures[match[0].charCodeAt(0) - 0xe000] ?? '', figure: true });
    rest = rest.slice(match.index + 1);
  }
  if (rest) out.push({ text: rest, figure: false });
  return out;
}

/** Shortened sentence first, then the standing sentence. */
export function situationSegments(args: {
  state: HeroState;
  entries: RoundRow[];
  scheduledRounds: number;
  headline: HeadlineSegment[];
  t: TFunction;
}): HeadlineSegment[] {
  const played = shortenedApplies(args.state) ? shortenedTo(args.entries, args.scheduledRounds) : null;
  const lead = shortenedSegments(played, args.scheduledRounds, args.t);
  if (lead.length === 0) return args.headline;
  if (args.headline.length === 0) return lead;
  return [...lead, { text: ' ', figure: false }, ...args.headline];
}

/** Whole days from end_date (UTC calendar) to now; negative before it. */
function daysAfterEnd(endDate: string | null | undefined, now: Date): number | null {
  if (!endDate) return null;
  const end = Date.UTC(+endDate.slice(0, 4), +endDate.slice(5, 7) - 1, +endDate.slice(8, 10));
  if (!Number.isFinite(end)) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((today - end) / 86_400_000);
}

/** The note, trimmed, when its window holds; otherwise null. */
export function visibleSituationNote(
  note: string | null | undefined,
  state: HeroState,
  endDate: string | null | undefined,
  now: Date = new Date(),
): string | null {
  const text = note?.trim();
  if (!text) return null;
  const held = state.kind === 'live' || state.kind === 'suspended'
    || (state.kind === 'results' && state.variant === 'awaiting-playoff');
  if (held) return text;
  const days = daysAfterEnd(endDate, now);
  return days != null && days >= 0 && days <= SITUATION_NOTE_DAYS ? text : null;
}

/**
 * BRIEF_TOUR_CLOSE_ONLY_WHEN_FINAL §3: the finished-result champion narrative,
 * prefixed with the shortened sentence when the event was shortened. Built
 * from situationSegments so the copy lives once; unshortened events return
 * the narrative unchanged.
 */
export function championNarrative(args: {
  state: HeroState;
  entries: RoundRow[];
  scheduledRounds: number;
  narrative: string | null;
  t: TFunction;
}): string | null {
  const headline: HeadlineSegment[] = args.narrative ? [{ text: args.narrative, figure: false }] : [];
  const segs = situationSegments({ state: args.state, entries: args.entries, scheduledRounds: args.scheduledRounds, headline, t: args.t });
  const text = segs.map((s) => s.text).join('');
  return text.length > 0 ? text : args.narrative;
}
