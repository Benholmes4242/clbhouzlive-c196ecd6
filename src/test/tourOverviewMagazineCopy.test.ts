import { describe, expect, it } from 'vitest';

import { courseHeadline, spokenToPar, tournamentHeadline } from '@/features/tourhub/overview/magazineCopy';

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
    courseRankPlayedRating: 'No. {{rank}} in {{list}}, and the {{count}} members who have played it rate it {{rating}}.', courseRankReviewsRating: 'No. {{rank}} in {{list}}, rated {{rating}} from {{count}} member reviews.', courseReviewsRating: 'Members rate it {{rating}} from {{count}} reviews.', courseRankOnly: 'No. {{rank}} in {{list}}.', courseDiscover: 'Discover.'
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
    value = value.replaceAll(`{{${name}}}`, String(replacement));
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
});
