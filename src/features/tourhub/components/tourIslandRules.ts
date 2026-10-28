/**
 * tourIslandRules — the Tour island's sentence-case display map and caption
 * rules (BRIEF_TOUR_ISLAND §1). Pure and render-free so the island, the tile
 * and the tests share one definition.
 *
 * The sentence-case TOUR_DISPLAY map is NEW here on purpose: useTourShortLabel
 * (uppercase) still serves other surfaces and is unchanged.
 */
import type { TourPickerRow, TourPickerRowStatus } from '../hooks/useTourPickerRows';

/** Sentence-case island labels — never uppercase. */
export const TOUR_DISPLAY: Record<string, string> = {
  all: 'All tours',
  major: 'Majors',
  pga: 'PGA Tour',
  lpga: 'LPGA',
  euro: 'DP World Tour',
  pgad: 'Korn Ferry',
  champ: 'Champions',
  liv: 'LIV Golf',
};

export function tourDisplayLabel(slug: string): string {
  return TOUR_DISPLAY[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

/** 'YYYY-MM-DD' → 'Thu'. UTC noon pins the weekday against date-line drift. */
export function shortWeekday(startDate: string): string {
  const d = new Date(startDate.length === 10 ? `${startDate}T12:00:00Z` : startDate);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
}

export interface TourCaption {
  /** Sentence case; the island uppercases it with textTransform. */
  text: string;
  live: boolean;
}

/** A single tour (or the active major): live / final / starts / season / none. */
export function singleTourCaption(
  status: TourPickerRowStatus,
  currentRound: number | null,
  startDate: string | null,
): TourCaption {
  switch (status) {
    case 'live':
      return { text: currentRound != null ? `Live · Round ${currentRound}` : 'Live', live: true };
    case 'completed':
      return { text: 'Final', live: false };
    case 'upcoming':
      return { text: `Starts ${startDate ? shortWeekday(startDate) : ''}`.trim(), live: false };
    case 'season':
      return { text: 'Season complete', live: false };
    default:
      return { text: 'No event this week', live: false };
  }
}

/**
 * All tours: "{n} live" when any tour row this week is live, otherwise
 * "{n} events this week" over rows with a live, completed or upcoming slide.
 */
export function allToursCaption(rows: TourPickerRow[]): TourCaption {
  const liveCount = rows.filter(r => r.status === 'live').length;
  if (liveCount > 0) return { text: `${liveCount} live`, live: true };
  const events = rows.filter(r => r.status === 'completed' || r.status === 'upcoming').length;
  return { text: `${events} events this week`, live: false };
}

export interface IslandDescriptor {
  label: string;
  caption: string;
  captionLive: boolean;
  /** Tour slug for the white logo chip; null when a glyph chip shows. */
  logoSlug: string | null;
  glyph: 'globe' | 'trophy' | null;
}

/**
 * What the island shows, given the tab and the tour in view. The Leaderboards
 * tab ('live') is deliberately cross-tour: the island reads "Leaderboards"
 * with the trophy glyph and a green live count. Majors apply the single-tour
 * rules to the active major.
 */
export function islandDescriptor(args: {
  activeTab: string;
  activeTourSlug: string;
  rows: TourPickerRow[];
  /** In-progress tournament count (the Leaderboards caption). */
  liveCount: number;
  major: { id: string; name: string; startDate: string; status: 'live' | 'upcoming' } | null;
  /** Live round by tournament id (useLiveTournaments); null when unknown. */
  liveRound: (tournamentId: string | null) => number | null;
}): IslandDescriptor {
  const { activeTab, activeTourSlug, rows, liveCount, major, liveRound } = args;

  if (activeTab === 'live') {
    return { label: 'Leaderboards', caption: `${liveCount} live`, captionLive: liveCount > 0, logoSlug: null, glyph: 'trophy' };
  }
  if (activeTourSlug === 'all') {
    const c = allToursCaption(rows);
    return { label: TOUR_DISPLAY.all, caption: c.text, captionLive: c.live, logoSlug: null, glyph: 'globe' };
  }
  if (activeTourSlug === 'major') {
    const c = major
      ? singleTourCaption(major.status, major.status === 'live' ? liveRound(major.id) : null, major.startDate)
      : singleTourCaption('none', null, null);
    return { label: TOUR_DISPLAY.major, caption: c.text, captionLive: c.live, logoSlug: null, glyph: 'trophy' };
  }
  const row = rows.find(r => r.slug === activeTourSlug);
  const status = row && row.status !== 'all' ? row.status : 'none';
  const c = singleTourCaption(
    status,
    status === 'live' ? liveRound(row?.tournamentId ?? null) ?? row?.currentRound ?? null : null,
    row?.startDate ?? null,
  );
  return { label: tourDisplayLabel(activeTourSlug), caption: c.text, captionLive: c.live, logoSlug: activeTourSlug, glyph: null };
}
