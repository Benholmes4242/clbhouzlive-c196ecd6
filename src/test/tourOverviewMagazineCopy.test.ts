import { describe, expect, it } from 'vitest';

import en from '../../public/locales/en/tourhub.json';
import { courseHeadline, spokenToPar, tournamentHeadline, tournamentHeadlineSegments } from '@/features/tourhub/overview/magazineCopy';

// The real English strings, so the tests follow the copy rather than a copy of it.
const resources = { overview: { magazine: { ...en.overview.magazine, courseDiscover: 'Discover.' } } };

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

const live = { kind: 'live', round: 2, totalRounds: 4 } as any;
const result = (variant = 'final') => ({ kind: 'results', variant, finishDate: '', meta: '' }) as any;
const venue = 'Royal Portrush';

describe('Tour Overview magazine copy', () => {
  it('uses spoken scores in prose', () => expect(spokenToPar(-8, t)).toBe('8 under par'));
  it('states a truthful unique margin, spelled', () => expect(tournamentHeadline({ tournament, state: live, leaderboard: [row('A One', -8), row('B Two', -6)], t })).toBe('One leads by two at 8 under par.'));
  it('never turns a tie into a margin', () => expect(tournamentHeadline({ tournament, state: live, leaderboard: [row('A One', -8), row('B Two', -8)], t })).toBe('One and Two share the lead at 8 under par.'));
  it('names three tied leaders', () => expect(tournamentHeadline({ tournament, state: live, leaderboard: [row('Si Woo Kim', -13), row('Jake Knapp', -13), row('Ben Griffin', -13), row('D', -9)], t })).toBe('Kim, Knapp and Griffin share the lead at 13 under par.'));
  it('counts four or more tied, spelled', () => expect(tournamentHeadline({ tournament, state: live, leaderboard: ['A', 'B', 'C', 'D', 'E'].map((n) => row(n, -13)), t })).toBe('Five share the lead at 13 under par.'));
  it('keeps ten and above as numerals', () => expect(tournamentHeadline({ tournament, state: live, leaderboard: Array.from({ length: 10 }, (_, i) => row(`P${i}`, -3)), t })).toBe('10 share the lead at 3 under par.'));
  it('solo leader without margin', () => expect(tournamentHeadline({ tournament, state: live, leaderboard: [row('Keith Mitchell', -4)], t })).toBe('Mitchell leads at 4 under par.'));
  it('no live or results sentence contains the venue', () => {
    const boards = [[row('A One', -8), row('B Two', -6)], [row('A One', -8), row('B Two', -8)], ['A', 'B', 'C', 'D'].map((n) => row(n, -2)), [row('A One', -8)]];
    const states = [live, { ...live, round: 4 }, result('final'), result('playoff')];
    for (const state of states) for (const leaderboard of boards) {
      expect(tournamentHeadline({ tournament: { ...tournament, winnerName: 'A One' }, state, leaderboard, t, closingRound: 66 }) ?? '').not.toContain(venue);
    }
  });
  it('spells a player count under ten', () => {
    const text = tournamentHeadline({ tournament, state: awaitingState(), leaderboard: ['A', 'B', 'C', 'D'].map((n) => row(n, -13)), t }) as string;
    expect(text).toBe('Four finished tied at 13 under par. A playoff decides it.');
    expect(text).not.toMatch(/^\d/);
  });
  it('results fallback states margin and closing round', () => expect(tournamentHeadline({ tournament: { ...tournament, winnerName: 'Keith Mitchell' }, state: result(), leaderboard: [row('Keith Mitchell', -17), row('B Two', -15)], t, closingRound: 66 })).toBe('Won by two, with a closing 66.'));
  it('results fallback omits an absent closing round', () => expect(tournamentHeadline({ tournament: { ...tournament, winnerName: 'Keith Mitchell' }, state: result(), leaderboard: [row('Keith Mitchell', -17), row('B Two', -15)], t })).toBe('Won by two.'));
  it('results fallback never names the champion or restates the score', () => {
    for (const state of [result(), result('playoff')]) {
      const text = tournamentHeadline({ tournament: { ...tournament, winnerName: 'Keith Mitchell' }, state, leaderboard: [row('Keith Mitchell', -17), row('B Two', state.variant === 'playoff' ? -17 : -15)], t, closingRound: 68 }) as string;
      expect(text).not.toContain('Mitchell');
      expect(text).not.toContain('17 under');
    }
  });
  it('uses a playoff result instead of zero shots', () => expect(tournamentHeadline({ tournament: { ...tournament, winnerName: 'A One' }, state: result('playoff'), leaderboard: [row('A One', -8), row('B Two', -8)], t, closingRound: 67 })).toBe('Won a playoff, after a closing 67.'));
  it('no margin and no playoff returns nothing at all', () => {
    const args = { tournament: { ...tournament, winnerName: 'A One' }, state: result(), leaderboard: [row('A One', -8)], t };
    expect(tournamentHeadline(args)).toBeNull();
    expect(tournamentHeadlineSegments(args)).toEqual([]);
  });
  it('falls back safely for upcoming events', () => expect(tournamentHeadline({ tournament, state: { kind: 'upcoming', variant: 'far', countdown: '', meta: '' }, leaderboard: [], t })).toBe('The Open is next.'));
  it('prefers the defending champion over the bare countdown', () => expect(tournamentHeadline({ tournament: { ...tournament, defendingChampion: 'Scottie Scheffler' }, state: { kind: 'upcoming', variant: 'far', countdown: '', meta: '' }, leaderboard: [], t })).toBe('Scottie Scheffler defends The Open.'));
  it('hides a thin-sample course rating', () => expect(courseHeadline({ rank: 4, list: 'Global', played: 2, rating: 9.4, reviewCount: 2, t })).toBe('No. 4 in Global.'));

  const suspended = { kind: 'suspended', round: 3, totalRounds: 4, reason: null } as any;
  const awaiting = awaitingState();
  it('suspended: two named leaders', () => expect(tournamentHeadline({ tournament, state: suspended, leaderboard: [row('Wyndham Clark', -13), row('Max Homa', -13), row('C', -10)], t })).toBe('Play is suspended in round three, with Clark and Homa sharing the lead at 13 under par.'));
  it('suspended: N tied', () => expect(tournamentHeadline({ tournament, state: suspended, leaderboard: [row('A', -13), row('B', -13), row('C', -13), row('D', -13), row('E', -9)], t })).toBe('Play is suspended in round three, with four sharing the lead at 13 under par.'));
  it('suspended: solo leader with margin', () => expect(tournamentHeadline({ tournament, state: suspended, leaderboard: [row('Keith Mitchell', -15), row('B', -13)], t })).toBe('Play is suspended in round three, with Mitchell leading by two at 15 under par.'));
  it('suspended: never implies a reason', () => {
    const text = tournamentHeadline({ tournament, state: suspended, leaderboard: [row('A', -15), row('B', -13)], t });
    expect(text).not.toMatch(/weather|delay|rain|storm|darkness/i);
  });
  it('suspended: empty leaderboard', () => expect(tournamentHeadline({ tournament, state: suspended, leaderboard: [], t })).toBe('Play is suspended in round three.'));
  it('awaiting playoff: two named', () => expect(tournamentHeadline({ tournament, state: awaiting, leaderboard: [row('Jacob Bridgeman', -13), row('Michael Brennan', -13), row('C', -11)], t })).toBe('Bridgeman and Brennan finished tied at 13 under par. A playoff decides it.'));
  it('awaiting playoff: three named', () => expect(tournamentHeadline({ tournament, state: awaiting, leaderboard: [row('A A', -13), row('B B', -13), row('C C', -13)], t })).toBe('A, B and C finished tied at 13 under par. A playoff decides it.'));
  it('awaiting playoff: empty leaderboard', () => expect(tournamentHeadline({ tournament, state: awaiting, leaderboard: [], t })).toBe('Regulation finished level. A playoff decides it.'));
  it('marks score and margin as the figures; plain text is the joined segments', () => {
    const args = { tournament, state: suspended, leaderboard: [row('A', -15), row('B', -13)], t };
    const segs = tournamentHeadlineSegments(args);
    expect(segs.filter((s) => s.figure).map((s) => s.text)).toEqual(['two', '15 under par']);
    expect(segs.map((s) => s.text).join('')).toBe(tournamentHeadline(args));
  });
});

function awaitingState() {
  return { kind: 'results', variant: 'awaiting-playoff', finishDate: '', meta: 'PLAYOFF' } as any;
}
