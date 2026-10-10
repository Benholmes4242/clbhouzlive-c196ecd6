import type { TFunction } from 'i18next';

import type { HeroTournament } from '../hooks/useHeroCarouselData';
import type { HeroState } from '../components/overview-v3/HybridHero.utils';

type BoardEntry = {
  score?: number | null;
  total?: number | null;
  position?: number | null;
  position_tied?: boolean | null;
  player?: { full_name?: string | null; first_name?: string | null; last_name?: string | null } | null;
};

function playerName(entry: BoardEntry | undefined): string | null {
  if (!entry?.player) return null;
  const full = entry.player.full_name?.trim();
  if (full) return full;
  const joined = [entry.player.first_name, entry.player.last_name].filter(Boolean).join(' ').trim();
  return joined || null;
}

function scoreOf(entry: BoardEntry | undefined): number | null {
  const value = entry?.score ?? entry?.total;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function spokenToPar(score: number, t: TFunction): string {
  if (score === 0) return t('overview.magazine.scoreEven');
  return score < 0
    ? t('overview.magazine.scoreUnder', { count: Math.abs(score) })
    : t('overview.magazine.scoreOver', { count: score });
}

function venueOf(tournament: HeroTournament): string | null {
  return tournament.venueName || tournament.venueCourseName || tournament.venueCity || null;
}

function marginFacts(entries: BoardEntry[]) {
  const sorted = [...entries]
    .filter((entry) => scoreOf(entry) != null)
    .sort((a, b) => (scoreOf(a) as number) - (scoreOf(b) as number));
  const leaderScore = scoreOf(sorted[0]);
  if (leaderScore == null) return { leaders: [] as BoardEntry[], margin: null, score: null };
  const leaders = sorted.filter((entry) => scoreOf(entry) === leaderScore);
  const runner = sorted.find((entry) => scoreOf(entry) !== leaderScore);
  const runnerScore = scoreOf(runner);
  return {
    leaders,
    margin: leaders.length === 1 && runnerScore != null ? runnerScore - leaderScore : null,
    score: leaderScore,
  };
}

type HeadlineArgs = {
  tournament: HeroTournament;
  state: HeroState;
  leaderboard: BoardEntry[];
  t: TFunction;
};

/**
 * One sentence, described as a key + values. `figures` names the values that
 * are the sentence's key figures (the leading score, the margin) so the
 * renderer can set them in bold without re-parsing prose.
 */
type HeadlineSpec = {
  key: string;
  values: Record<string, string | number>;
  figures: Array<'score' | 'count'>;
};

const spec = (key: string, values: Record<string, string | number> = {}, figures: HeadlineSpec['figures'] = []): HeadlineSpec => ({ key, values, figures });

function headlineSpec({ tournament, state, leaderboard, t }: HeadlineArgs): HeadlineSpec {
  const venue = venueOf(tournament);
  const facts = marginFacts(leaderboard);
  const leader = playerName(facts.leaders[0]);
  const first = playerName(facts.leaders[0]);
  const second = playerName(facts.leaders[1]);
  const score = facts.score == null ? null : spokenToPar(facts.score, t);
  const hasMargin = facts.margin != null && facts.margin > 0;

  // Suspended — play has stopped; say where it stands in the live branch's
  // own grammar. No reason exists in the data, so none is ever implied.
  if (state.kind === 'suspended') {
    const round = state.round;
    if (facts.leaders.length > 1 && score) {
      if (facts.leaders.length === 2 && first && second) return spec('overview.magazine.suspendedTieTwo', { round, first, second, score }, ['score']);
      return spec('overview.magazine.suspendedTieMany', { round, count: facts.leaders.length, score }, ['score']);
    }
    if (leader && score && hasMargin) return spec('overview.magazine.suspendedMargin', { round, leader, count: facts.margin as number, score }, ['count', 'score']);
    if (leader && score) return spec('overview.magazine.suspendedLeader', { round, leader, score }, ['score']);
    return spec('overview.magazine.suspendedPlain', { round });
  }

  // Awaiting playoff — regulation finished level; a playoff decides it.
  if (state.kind === 'results' && state.variant === 'awaiting-playoff') {
    if (facts.leaders.length > 1 && score) {
      if (facts.leaders.length === 2 && first && second) return spec('overview.magazine.playoffTieTwo', { first, second, score }, ['score']);
      return spec('overview.magazine.playoffTieMany', { count: facts.leaders.length, score }, ['score']);
    }
    return spec('overview.magazine.playoffPending');
  }

  if (state.kind === 'live') {
    if (facts.leaders.length > 1) {
      if (facts.leaders.length === 2 && first && second) {
        if (venue && score) return spec('overview.magazine.liveTieTwoVenueScore', { first, second, venue, score }, ['score']);
        if (venue) return spec('overview.magazine.liveTieTwoVenue', { first, second, venue });
        if (score) return spec('overview.magazine.liveTieTwoScore', { first, second, score }, ['score']);
        return spec('overview.magazine.liveTieTwo', { first, second });
      }
      if (venue && score) return spec('overview.magazine.liveTieManyVenueScore', { count: facts.leaders.length, venue, score }, ['score']);
      if (venue) return spec('overview.magazine.liveTieManyVenue', { count: facts.leaders.length, venue });
      return spec('overview.magazine.liveTieMany', { count: facts.leaders.length });
    }
    if (leader) {
      const isFinalRound = state.round >= state.totalRounds;
      if (isFinalRound && hasMargin) return spec('overview.magazine.liveFinalMargin', { leader, count: facts.margin as number }, ['count']);
      if (isFinalRound) return spec('overview.magazine.liveFinal', { leader });
      const remaining = state.round < state.totalRounds - 1
        ? t('overview.magazine.remainingWeekend')
        : t('overview.magazine.remainingLastDay');
      if (hasMargin && venue) return spec('overview.magazine.liveMarginVenueRemaining', { leader, count: facts.margin as number, venue, remaining }, ['count']);
      if (venue) return spec('overview.magazine.liveVenue', { leader, venue });
      if (hasMargin) return spec('overview.magazine.liveMargin', { leader, count: facts.margin as number }, ['count']);
      return spec('overview.magazine.livePlain', { leader });
    }
    return venue
      ? spec('overview.magazine.liveEventVenue', { event: tournament.name, venue })
      : spec('overview.magazine.liveEvent', { event: tournament.name });
  }

  if (state.kind === 'results') {
    const winner = tournament.winnerName || leader;
    if (!winner) return spec('overview.magazine.completeEvent', { event: tournament.name });
    const playoff = state.variant === 'playoff' || facts.leaders.length > 1;
    if (playoff && venue) return spec('overview.magazine.completePlayoffVenue', { winner, venue });
    if (playoff) return spec('overview.magazine.completePlayoff', { winner });
    if (hasMargin && venue) return spec('overview.magazine.completeMarginVenue', { winner, count: facts.margin as number, venue }, ['count']);
    if (venue) return spec('overview.magazine.completeVenue', { winner, venue });
    if (hasMargin) return spec('overview.magazine.completeMargin', { winner, count: facts.margin as number }, ['count']);
    return spec('overview.magazine.completeWinnerEvent', { winner, event: tournament.name });
  }

  const when = state.countdown || state.meta;
  if (tournament.defendingChampion && when) {
    return spec('overview.magazine.upcomingDefender', { champion: tournament.defendingChampion, event: tournament.name, when });
  }
  if (when) return spec('overview.magazine.upcomingStarts', { event: tournament.name, when });
  return spec('overview.magazine.upcomingNext', { event: tournament.name });
}

/** The tournament's one sentence. Every branch ends in a keyed sentence, so it is never empty. */
export function tournamentHeadline(args: HeadlineArgs): string {
  const s = headlineSpec(args);
  return args.t(s.key, s.values);
}

export type HeadlineSegment = { text: string; figure: boolean };

// Private-use delimiters; they never occur in names, venues or copy.
const OPEN = '\uE000';
const CLOSE = '\uE001';
// `count` also drives plural selection, so it cannot carry a string marker.
// It is interpolated as this sentinel (plural category "other" in en) and
// swapped for the marked real figure afterwards.
const COUNT_SENTINEL = 987654321;

/** The same sentence split so its key figures (score, margin) can be set apart. */
export function tournamentHeadlineSegments(args: HeadlineArgs): HeadlineSegment[] {
  const s = headlineSpec(args);
  const values = { ...s.values };
  if (s.figures.includes('score') && values.score != null) values.score = `${OPEN}${values.score}${CLOSE}`;
  const markCount = s.figures.includes('count') && values.count != null;
  const realCount = values.count;
  if (markCount) values.count = COUNT_SENTINEL;
  let text = args.t(s.key, values) as string;
  if (markCount) text = text.split(String(COUNT_SENTINEL)).join(`${OPEN}${realCount}${CLOSE}`);
  const segments: HeadlineSegment[] = [];
  for (const part of text.split(OPEN)) {
    const [inside, rest] = part.includes(CLOSE) ? part.split(CLOSE) : [null, part];
    if (inside) segments.push({ text: inside, figure: true });
    if (rest) segments.push({ text: rest, figure: false });
  }
  return segments;
}

export function courseHeadline({
  rank,
  list,
  played,
  rating,
  reviewCount,
  t,
}: {
  rank: number | null;
  list: string | null;
  played: number | null;
  rating: number | null;
  reviewCount: number;
  t: TFunction;
}): string {
  const hasRating = rating != null && reviewCount >= 3;
  if (rank != null && list && hasRating && played != null) {
    return t('overview.magazine.courseRankPlayedRating', { rank, list, count: played, rating: rating.toFixed(1) });
  }
  if (rank != null && list && hasRating) {
    return t('overview.magazine.courseRankReviewsRating', { rank, list, count: reviewCount, rating: rating.toFixed(1) });
  }
  if (hasRating) return t('overview.magazine.courseReviewsRating', { count: reviewCount, rating: rating.toFixed(1) });
  if (rank != null && list) return t('overview.magazine.courseRankOnly', { rank, list });
  return t('overview.magazine.courseDiscover');
}
