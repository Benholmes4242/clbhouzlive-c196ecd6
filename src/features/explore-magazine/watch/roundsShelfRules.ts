import { playDateAtLocalNoon } from '@/components/explore-tab-new/courseled/discoverWhen';
import type { StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';

/**
 * RECENT ROUNDS SHELF — the pure rules (RR1).
 *
 * The shelf reads get_recent_rounds ('circle' / '14', ten a page) and shows
 * every round newest first; feats no longer appear here (they stay on the
 * /rounds page). Everything here is pure: no hooks, no locale, no DOM.
 */

/** Calendar-day arithmetic, independent of daylight-saving transitions. */
function calendarDay(iso: string): number {
  const date = playDateAtLocalNoon(iso);
  return date ? Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000 : NaN;
}

/** English ordinal for the small ordinals this shelf can reach (2nd, 3rd). */
function ordinal(n: number): string {
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

export type RecentSentence = {
  key: string;
  defaultValue: string;
  course: string;
  month?: string;
  n?: number;
  ordinal?: string;
};

/**
 * The line under every card (RR1 §5), evaluated in this order; null = no line.
 * Keeps the standout keys and wording for the cases they already covered.
 */
export function recentSentenceParts(row: StandoutRound, locale = 'en'): RecentSentence | null {
  const course = row.course_name ?? '';
  /* (1) no course, or gross/par missing: no line. "Missing" means the round
     carries no comparison figures at all and the par is not a plausible
     18-hole par (60–80). */
  if (!course) return null;
  const parOutOfRange = row.course_par == null || row.course_par < 60 || row.course_par > 80;
  if (row.avg_topar == null && row.delta == null && row.prior_n === 0 && parOutOfRange) return null;
  /* (2) first recorded round at the course. */
  if (row.prior_n === 0) {
    return { key: 'amateur.standout.firstRound', defaultValue: 'First round at {{course}}', course };
  }
  /* (3) nothing better on record. */
  if (row.last_better == null) {
    return { key: 'amateur.standout.bestEver', defaultValue: 'Best ever at {{course}}', course };
  }
  const delta = row.delta ?? 0;
  /* (4) better than the last better round, at least 60 days ago. */
  const play = playDateAtLocalNoon(row.play_date);
  const better = playDateAtLocalNoon(row.last_better);
  if (delta < 0 && play && better && calendarDay(row.play_date) - calendarDay(row.last_better) >= 60) {
    const month = better.toLocaleDateString(locale, {
      month: 'long',
      ...(better.getFullYear() !== play.getFullYear() ? { year: 'numeric' as const } : {}),
    });
    return { key: 'amateur.standout.bestSince', defaultValue: 'Best at {{course}} since {{month}}', course, month };
  }
  /* (5) second or third recorded round. */
  if (row.prior_n < 3) {
    return {
      key: 'amateur.standout.ordinalRound',
      defaultValue: '{{ordinal}} round at {{course}}',
      course,
      ordinal: ordinal(row.prior_n + 1),
    };
  }
  /* (6) clearly better than the member's average. */
  if (delta <= -1) {
    return {
      key: 'amateur.standout.betterAverage',
      defaultValue: '{{n}} shots better than average at {{course}}',
      course,
      n: Math.round(Math.abs(delta)),
    };
  }
  /* (7) clearly worse than the member's average. */
  if (delta >= 1) {
    return {
      key: 'amateur.standout.aboveAverage',
      defaultValue: '{{n}} shots above average at {{course}}',
      course,
      n: Math.round(Math.abs(delta)),
    };
  }
  /* (8) within a shot of the average either way. */
  return { key: 'amateur.standout.rightOnAverage', defaultValue: 'Right on average at {{course}}', course };
}

/** Net to par, from the round's own figures; null when either is missing. */
export function roundToPar(round: StandoutRound): number | null {
  if (round.net_score == null || round.course_par == null) return null;
  return round.net_score - round.course_par;
}

/** "−1" / "E" / "+2" (U+2212 minus, as the mock); null when unknowable. */
export function toParLabel(toPar: number | null): string | null {
  if (toPar == null) return null;
  if (toPar === 0) return 'E';
  return toPar < 0 ? `−${Math.abs(toPar)}` : `+${toPar}`;
}

/** Under par is the surface's red; level and over are mute. */
export const TO_PAR_UNDER = '#E24B3F';

/** The strip's scorecard palette, per the signed-off mock. */
export const STRIP_COLORS = {
  eagle: '#E8C766',
  birdie: '#E24B3F',
  par: 'rgba(255,255,255,0.14)',
  bogey: '#A6C2F0',
  double: '#7AA6EC',
} as const;

/** One bar's colour from the hole's actual gross against par. */
export function stripColor(strokes: number | null, par: number | null): string {
  if (strokes == null || par == null) return STRIP_COLORS.par;
  const diff = strokes - par;
  if (diff <= -2) return STRIP_COLORS.eagle;
  if (diff === -1) return STRIP_COLORS.birdie;
  if (diff === 0) return STRIP_COLORS.par;
  if (diff === 1) return STRIP_COLORS.bogey;
  return STRIP_COLORS.double;
}

/** Card geometry and paint, named once (RS §3, mock A/C; unchanged by RR1). */
export const SHELF_CARD = {
  width: 232,
  height: 214,
  background: '#17171B',
  border: 'rgba(255,255,255,0.08)',
  radius: 18,
  padding: 14,
  gap: 10,
} as const;

/** The end tile (RR1 §4, mock B). */
export const SHELF_END = {
  width: 150,
  height: 214,
  background: '#17171B',
  border: 'rgba(255,255,255,0.08)',
  radius: 18,
  padding: 16,
  gap: 10,
} as const;

/** The skeleton card shown while a page loads (RR1 §4). */
export const SHELF_SKELETON = { width: 232, height: 214, radius: 18, background: '#141417' } as const;
