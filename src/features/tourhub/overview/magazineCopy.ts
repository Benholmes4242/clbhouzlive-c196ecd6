import type { TFunction } from 'i18next';

import type { HeroTournament } from '../hooks/useHeroCarouselData';
import type { HeroState } from '../components/overview-v3/HybridHero.utils';
import { surnameOf } from '../_shared/playerName';

type BoardEntry = {
  score?: number | null;
  total?: number | null;
  position?: number | null;
  position_tied?: boolean | null;
  player?: { full_name?: string | null; first_name?: string | null; last_name?: string | null } | null;
};

/** Surname, matching the board and the picks. */
function playerName(entry: BoardEntry | undefined): string | null {
  if (!entry?.player) return null;
  const full = entry.player.full_name?.trim()
    || [entry.player.first_name, entry.player.last_name].filter(Boolean).join(' ').trim();
  return full ? surnameOf(full) || null : null;
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

/** Prose numbers: one to nine are spelled, ten and above stay numerals. */
export function spokenCount(n: number, t: TFunction): string {
  return Number.isInteger(n) && n >= 1 && n <= 9 ? t(`overview.magazine.number${n}`) : String(n);
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
  /** Results only: the champion's gross final-round score, when known. */
  closingRound?: number | null;
};

/**
 * One sentence, described as a key + values. `figures` names the values that
 * are the sentence's key figures (the leading score, the margin) so the
 * renderer can set them in bold without re-parsing prose.
 */
type HeadlineSpec = {
  key: string;
  values: Record<string, string | number>;
  figures: string[];
};

const spec = (key: string, values: Record<string, string | number> = {}, figures: string[] = []): HeadlineSpec => ({ key, values, figures });

/** Two or three tied leaders are named; four or more become a spelled count. */
function namedTie(leaders: BoardEntry[]) {
  const names = leaders.map(playerName);
  if (names.some((name) => !name)) return null;
  if (leaders.length === 2) return { size: 'Two' as const, values: { first: names[0] as string, second: names[1] as string } };
  if (leaders.length === 3) return { size: 'Three' as const, values: { first: names[0] as string, second: names[1] as string, third: names[2] as string } };
  return null;
}

function headlineSpec({ tournament, state, leaderboard, t, closingRound }: HeadlineArgs): HeadlineSpec | null {
  const facts = marginFacts(leaderboard);
  const leader = playerName(facts.leaders[0]);
  const score = facts.score == null ? null : spokenToPar(facts.score, t);
  const hasMargin = facts.margin != null && facts.margin > 0;
  const margin = hasMargin ? spokenCount(facts.margin as number, t) : '';
  const tieCount = spokenCount(facts.leaders.length, t);
  const tie = facts.leaders.length > 1 ? namedTie(facts.leaders) : null;

  // Suspended — the pill no longer names the round, so this sentence does.
  // No reason exists in the data, so none is ever implied.
  if (state.kind === 'suspended') {
    const round = spokenCount(state.round, t);
    if (facts.leaders.length > 1 && score) {
      if (tie) return spec(`overview.magazine.suspendedTie${tie.size}`, { round, ...tie.values, score }, ['score']);
      return spec('overview.magazine.suspendedTieMany', { round, n: tieCount, score }, ['score']);
    }
    if (leader && score && hasMargin) return spec('overview.magazine.suspendedMargin', { round, leader, margin, score }, ['margin', 'score']);
    if (leader && score) return spec('overview.magazine.suspendedLeader', { round, leader, score }, ['score']);
    return spec('overview.magazine.suspendedPlain', { round });
  }

  // Awaiting playoff — regulation finished level; a playoff decides it.
  if (state.kind === 'results' && state.variant === 'awaiting-playoff') {
    if (facts.leaders.length > 1 && score) {
      if (tie) return spec(`overview.magazine.playoffTie${tie.size}`, { ...tie.values, score }, ['score']);
      return spec('overview.magazine.playoffTieMany', { n: tieCount, score }, ['score']);
    }
    return spec('overview.magazine.playoffPending');
  }

  // Live — the photo band prints venue and round; the board prints the top
  // five. The sentence says neither again.
  if (state.kind === 'live') {
    if (facts.leaders.length > 1) {
      if (tie) return score
        ? spec(`overview.magazine.liveTie${tie.size}Score`, { ...tie.values, score }, ['score'])
        : spec(`overview.magazine.liveTie${tie.size}`, tie.values);
      return score
        ? spec('overview.magazine.liveTieManyScore', { n: tieCount, score }, ['score'])
        : spec('overview.magazine.liveTieMany', { n: tieCount });
    }
    if (leader) {
      if (state.round >= state.totalRounds) {
        return hasMargin
          ? spec('overview.magazine.liveFinalMargin', { leader, margin }, ['margin'])
          : spec('overview.magazine.liveFinal', { leader });
      }
      if (hasMargin && score) return spec('overview.magazine.liveMarginScore', { leader, margin, score }, ['margin', 'score']);
      if (score) return spec('overview.magazine.liveLeaderScore', { leader, score }, ['score']);
      if (hasMargin) return spec('overview.magazine.liveMargin', { leader, margin }, ['margin']);
      return spec('overview.magazine.livePlain', { leader });
    }
    return spec('overview.magazine.liveEvent', { event: tournament.name });
  }

  // Results fallback — renders inside ChampionStrip, which already prints the
  // champion and the winning score, so this names neither. Nothing to add →
  // nothing rendered.
  if (state.kind === 'results') {
    const playoff = state.variant === 'playoff' || facts.leaders.length > 1;
    const closing = closingRound != null && Number.isFinite(closingRound) && closingRound > 0 ? String(closingRound) : null;
    if (playoff) return closing
      ? spec('overview.magazine.completePlayoffClosing', { closingRound: closing }, ['closingRound'])
      : spec('overview.magazine.completePlayoff');
    if (hasMargin) return closing
      ? spec('overview.magazine.completeMarginClosing', { margin, closingRound: closing }, ['margin', 'closingRound'])
      : spec('overview.magazine.completeMargin', { margin }, ['margin']);
    return null;
  }

  // Upcoming — the defending champion is the strongest thing this state has.
  const when = state.countdown || state.meta;
  if (tournament.defendingChampion) {
    return when
      ? spec('overview.magazine.upcomingDefender', { champion: tournament.defendingChampion, event: tournament.name, when })
      : spec('overview.magazine.upcomingDefenderPlain', { champion: tournament.defendingChampion, event: tournament.name });
  }
  if (when) return spec('overview.magazine.upcomingStarts', { event: tournament.name, when });
  return spec('overview.magazine.upcomingNext', { event: tournament.name });
}

export type HeadlineSegment = { text: string; figure: boolean };

// Private-use delimiters; they never occur in names, venues or copy.
const OPEN = '\uE000';
const CLOSE = '\uE001';

/**
 * The single source of the tournament sentence, split so its key figures
 * (score, margin, closing round) can be set apart. Empty when there is
 * nothing true to add (results with no margin and no playoff).
 */
export function tournamentHeadlineSegments(args: HeadlineArgs): HeadlineSegment[] {
  const s = headlineSpec(args);
  if (!s) return [];
  const values: Record<string, string | number> = { ...s.values };
  for (const name of s.figures) {
    if (values[name] != null && values[name] !== '') values[name] = `${OPEN}${values[name]}${CLOSE}`;
  }
  const raw = args.t(s.key, values) as string;
  // A sentence may open on a spelled count ("Five share the lead").
  const text = raw.replace(/^([\uE000]?)(\p{Ll})/u, (_m, mark: string, ch: string) => mark + ch.toLocaleUpperCase('en'));
  const segments: HeadlineSegment[] = [];
  for (const part of text.split(OPEN)) {
    const [inside, rest] = part.includes(CLOSE) ? part.split(CLOSE) : [null, part];
    if (inside) segments.push({ text: inside, figure: true });
    if (rest) segments.push({ text: rest, figure: false });
  }
  return segments;
}

/** The same sentence as plain text — derived from the segments, never chosen separately. */
/* ARCHITECTURE RULE (moved from AGENTS.md): The overview's one tournament sentence comes from tournamentHeadline/tournamentHeadlineSegments: SituationBand prints it on every state but a finished result, and on a finished result it lives only in ChampionStrip's narrative (stored narrative first), so one state never carries two prose blocks. */
export function tournamentHeadline(args: HeadlineArgs): string | null {
  const text = tournamentHeadlineSegments(args).map((segment) => segment.text).join('');
  return text || null;
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
