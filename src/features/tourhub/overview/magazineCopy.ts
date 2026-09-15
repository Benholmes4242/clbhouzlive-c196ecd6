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

export function tournamentHeadline({
  tournament,
  state,
  leaderboard,
  t,
}: {
  tournament: HeroTournament;
  state: HeroState;
  leaderboard: BoardEntry[];
  t: TFunction;
}): string {
  const venue = venueOf(tournament);
  const facts = marginFacts(leaderboard);
  const leader = playerName(facts.leaders[0]);

  if (state.kind === 'live') {
    if (facts.leaders.length > 1) {
      const first = playerName(facts.leaders[0]);
      const second = playerName(facts.leaders[1]);
      const score = facts.score == null ? null : spokenToPar(facts.score, t);
      if (facts.leaders.length === 2 && first && second) {
        if (venue && score) return t('overview.magazine.liveTieTwoVenueScore', { first, second, venue, score });
        if (venue) return t('overview.magazine.liveTieTwoVenue', { first, second, venue });
        if (score) return t('overview.magazine.liveTieTwoScore', { first, second, score });
        return t('overview.magazine.liveTieTwo', { first, second });
      }
      if (venue && score) return t('overview.magazine.liveTieManyVenueScore', { count: facts.leaders.length, venue, score });
      if (venue) return t('overview.magazine.liveTieManyVenue', { count: facts.leaders.length, venue });
      return t('overview.magazine.liveTieMany', { count: facts.leaders.length });
    }
    if (leader) {
      const isFinalRound = state.round >= state.totalRounds;
      if (isFinalRound && facts.margin != null && facts.margin > 0) {
        return t('overview.magazine.liveFinalMargin', { leader, count: facts.margin });
      }
      if (isFinalRound) return t('overview.magazine.liveFinal', { leader });
      const remaining = state.round < state.totalRounds - 1
        ? t('overview.magazine.remainingWeekend')
        : t('overview.magazine.remainingLastDay');
      if (facts.margin != null && facts.margin > 0 && venue) {
        return t('overview.magazine.liveMarginVenueRemaining', { leader, count: facts.margin, venue, remaining });
      }
      if (facts.margin != null && facts.margin > 0 && venue) {
        return t('overview.magazine.liveMarginVenue', { leader, count: facts.margin, venue });
      }
      if (venue) return t('overview.magazine.liveVenue', { leader, venue });
      if (facts.margin != null && facts.margin > 0) return t('overview.magazine.liveMargin', { leader, count: facts.margin });
      return t('overview.magazine.livePlain', { leader });
    }
    return venue
      ? t('overview.magazine.liveEventVenue', { event: tournament.name, venue })
      : t('overview.magazine.liveEvent', { event: tournament.name });
  }

  if (state.kind === 'results') {
    const winner = tournament.winnerName || leader;
    if (!winner) return t('overview.magazine.completeEvent', { event: tournament.name });
    const playoff = state.variant === 'playoff' || state.variant === 'awaiting-playoff' || facts.leaders.length > 1;
    if (playoff && venue) return t('overview.magazine.completePlayoffVenue', { winner, venue });
    if (playoff) return t('overview.magazine.completePlayoff', { winner });
    if (facts.margin != null && facts.margin > 0 && venue) return t('overview.magazine.completeMarginVenue', { winner, count: facts.margin, venue });
    if (venue) return t('overview.magazine.completeVenue', { winner, venue });
    if (facts.margin != null && facts.margin > 0) return t('overview.magazine.completeMargin', { winner, count: facts.margin });
    return t('overview.magazine.completeWinnerEvent', { winner, event: tournament.name });
  }

  const when = state.countdown || state.meta;
  if (tournament.defendingChampion && when) {
    return t('overview.magazine.upcomingDefender', { champion: tournament.defendingChampion, event: tournament.name, when });
  }
  if (when) return t('overview.magazine.upcomingStarts', { event: tournament.name, when });
  return t('overview.magazine.upcomingNext', { event: tournament.name });
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
