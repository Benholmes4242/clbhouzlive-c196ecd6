import { describe, expect, it } from 'vitest';

import { courseHeadline, spokenToPar, tournamentHeadline, tournamentHeadlineSegments } from '@/features/tourhub/overview/magazineCopy';

const resources = {
  overview: { magazine: {
    scoreEven: 'level par', scoreUnder: '{{count}} under par', scoreOver: '{{count}} over par',
    remainingWeekend: 'the weekend', remainingLastDay: 'the last day',
    liveTieTwoVenueScore: '{{first}} and {{second}} share the lead at {{venue}} on {{score}}.',
    liveTieTwoVenue: '{{first}} and {{second}} share the lead at {{venue}}.', liveTieTwoScore: '{{first}} and {{second}} share the lead on {{score}}.', liveTieTwo: '{{first}} and {{second}} share the lead.',
    liveTieManyVenueScore: '{{count}} players share the lead at {{venue}} on {{score}}.', liveTieManyVenue: '{{count}} players share the lead at {{venue}}.', liveTieMany: '{{count}} players share the lead.',
    liveFinalMargin: '{{leader}} takes a {{count}}-shot lead into the last day.', liveFinal: '{{leader}} leads into the last day.', liveMarginVenueRemaining: '{{leader}} leads by {{count}} at {{venue}} with {{remaining}} to come.', liveVenue: '{{leader}} leads at {{venue}}.', liveMargin: '{{leader}} leads by {{count}}.', livePlain: '{{leader}} leads.', liveEventVenue: '{{event}} is live at {{venue}}.', liveEvent: '{{event}} is live.',
    completeEvent: '{{event}} is complete.', completePlayoffVenue: '{{winner}} won in a playoff at {{venue}}.', completePlayoff: '{{winner}} won in a playoff.', completeMarginVenue: '{{winner}} won by {{count}} at {{venue}}.', completeVenue: '{{winner}} won at {{venue}}.', completeMargin: '{{winner}} won by {{count}}.', completeWinnerEvent: '{{winner}} won {{event}}.',
    upcomingDefender: '{{champion}} defends — {{event}} starts {{when}}.', upcomingStarts: '{{event}} starts {{when}}.', upcomingNext: '{{event}} is next.',
    courseRankPlayedRating: 'No. {{rank}} in {{list}}, and the {{count}} members who have played it rate it {{rating}}.', courseRankReviewsRating: 'No. {{rank}} in {{list}}, rated {{rating}} from {{count}} member reviews.', courseReviewsRating: 'Members rate it {{rating}} from {{count}} reviews.', courseRankOnly: 'No. {{rank}} in {{list}}.', courseDiscover: 'Discover.',
    suspendedTieTwo: 'Play is suspended in round {{round}}, with {{first}} and {{second}} sharing the lead at {{score}}.',
    suspendedTieMany: 'Play is suspended in round {{round}}, with {{count}} players sharing the lead at {{score}}.',
    suspendedMargin: 'Play is suspended in round {{round}}, with {{leader}} leading by {{count}} at {{score}}.',
    suspendedLeader: 'Play is suspended in round {{round}}, with {{leader}} leading at {{score}}.',
    suspendedPlain: 'Play is suspended in round {{round}}.',
    playoffTieTwo: '{{first}} and {{second}} finished tied at {{score}}. A playoff decides it.',
    playoffTieMany: '{{count}} players finished tied at {{score}}. A playoff decides it.',
    playoffPending: 'Regulation finished level. A playoff decides it.'
  } },
};

const t = ((key: string, values?: Record<string, unknown>) => {
  const resolved = key.split('.').reduce<unknown>((node, part) => {
    if (!node || typeof node !== 'object') return undefined;
    return (node as Record<string, unknown>)[part];
  }, resources);
  if (typeof resolved !== 'string') return key;
  let value = resolved;
  for (const [name, replacement] of Object.entries(values ?? {})) {
    value = value.split(`{{${name}}}`).join(String(replacement));
  }
  return value;
}) as any;
const tournament = { id: '1', name: 'The Open', venueName: 'Royal Portrush', defendingChampion: null } as any;
const row = (name: string, score: number) => ({ score, player: { full_name: name } });

describe('Tour Overview magazine copy', () => {
  it('uses spoken scores in prose', () => expect(spokenToPar(-8, t)).toBe('8 under par'));
  it('states a truthful unique margin', () => expect(tournamentHeadline({ tournament, state: { kind: 'live', round: 2, totalRounds: 4, thruLabel: '' }, leaderboard: [row('A One', -8), row('B Two', -6)], t })).toContain('leads by 2'));
  it('never turns a tie into a margin', () => expect(tournamentHeadline({ tournament, state: { kind: 'live', round: 2, totalRounds: 4, thruLabel: '' }, leaderboard: [row('A One', -8), row('B Two', -8)], t })).toContain('share the lead'));
  it('uses a playoff result instead of zero shots', () => expect(tournamentHeadline({ tournament: { ...tournament, winnerName: 'A One' }, state: { kind: 'results', variant: 'playoff', finishDate: '', meta: '' }, leaderboard: [row('A One', -8), row('B Two', -8)], t })).toContain('playoff'));
  it('falls back safely for upcoming events', () => expect(tournamentHeadline({ tournament, state: { kind: 'upcoming', variant: 'far', countdown: '', meta: '' }, leaderboard: [], t })).toBe('The Open is next.'));
  it('hides a thin-sample course rating', () => expect(courseHeadline({ rank: 4, list: 'Global', played: 2, rating: 9.4, reviewCount: 2, t })).toBe('No. 4 in Global.'));

  const suspended = { kind: 'suspended', round: 3, totalRounds: 4, reason: null } as any;
  const awaiting = { kind: 'results', variant: 'awaiting-playoff', finishDate: '', meta: 'PLAYOFF' } as any;
  it('suspended: two named leaders', () => expect(tournamentHeadline({ tournament, state: suspended, leaderboard: [row('Wyndham Clark', -13), row('Max Homa', -13), row('C', -10)], t })).toBe('Play is suspended in round 3, with Wyndham Clark and Max Homa sharing the lead at 13 under par.'));
  it('suspended: N tied', () => expect(tournamentHeadline({ tournament, state: suspended, leaderboard: [row('A', -13), row('B', -13), row('C', -13), row('D', -9)], t })).toBe('Play is suspended in round 3, with 3 players sharing the lead at 13 under par.'));
  it('suspended: solo leader with margin', () => expect(tournamentHeadline({ tournament, state: suspended, leaderboard: [row('Keith Mitchell', -15), row('B', -13)], t })).toBe('Play is suspended in round 3, with Keith Mitchell leading by 2 at 15 under par.'));
  it('suspended: never implies a reason', () => {
    const text = tournamentHeadline({ tournament, state: suspended, leaderboard: [row('A', -15), row('B', -13)], t });
    expect(text).not.toMatch(/weather|delay|rain|storm|darkness/i);
  });
  it('suspended: empty leaderboard', () => expect(tournamentHeadline({ tournament, state: suspended, leaderboard: [], t })).toBe('Play is suspended in round 3.'));
  it('awaiting playoff: two named', () => expect(tournamentHeadline({ tournament, state: awaiting, leaderboard: [row('Wesley Bryan', -13), row('Tom Kim', -13), row('C', -11)], t })).toBe('Wesley Bryan and Tom Kim finished tied at 13 under par. A playoff decides it.'));
  it('awaiting playoff: N tied', () => expect(tournamentHeadline({ tournament, state: awaiting, leaderboard: [row('A', -13), row('B', -13), row('C', -13)], t })).toBe('3 players finished tied at 13 under par. A playoff decides it.'));
  it('awaiting playoff: empty leaderboard', () => expect(tournamentHeadline({ tournament, state: awaiting, leaderboard: [], t })).toBe('Regulation finished level. A playoff decides it.'));
  it('marks score and margin as the figures', () => {
    const segs = tournamentHeadlineSegments({ tournament, state: suspended, leaderboard: [row('A', -15), row('B', -13)], t });
    expect(segs.filter((s) => s.figure).map((s) => s.text)).toEqual(['2', '15 under par']);
    expect(segs.map((s) => s.text).join('')).toBe('Play is suspended in round 3, with A leading by 2 at 15 under par.');
  });
});
