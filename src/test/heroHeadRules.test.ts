/* Brief 16: hero band head titles — every rule and branch, plus the mock's fixtures. */
import { describe, expect, it } from 'vitest';
import { createInstance } from 'i18next';
import en from '../../src/locales/en/tourhub.json';
import {
  cardsTitle, courseLeadTitle, finishedPicksTitle, holeTypeTitle, leaderboardTitle, leadersGroupTitle, liveCourseTitle, livePicksEyebrow,
  livePicksTitle, moversTitle, numericScore, par5Sentence, picksEyebrowState, pointsTitle, runnerUpTitle, seasonPicksTitle, seasonTitle,
  teeTimesTitle, upcomingPicksTitle, weekTitle, wonTitle, yourPlayersTitle,
} from '@/features/tourhub/components/overview-v3/heroHeadRules';
import { fmtPoints } from '@/features/tourhub/components/overview-v3/seasonRecapRules';
import { score } from '@/features/tourhub/tournament-v2/data/tournamentRules';

const i18n = createInstance();
void i18n.init({ lng: 'en', initAsync: false, interpolation: { escapeValue: false }, resources: { en: { tourhub: en } } });
const t = i18n.getFixedT('en', 'tourhub') as unknown as (k: string, o?: Record<string, unknown>) => string;

describe('a) biggest movers', () => {
  it('mock: largest gain', () => expect(moversTitle(t, [{ name: 'Smylie', delta: 14 }, { name: 'Herbert', delta: 11 }, { name: 'Davis', delta: 9 }])).toBe('Smylie up 14 places'));
  it('two level the same way', () => expect(moversTitle(t, [{ name: 'Smylie', delta: 11 }, { name: 'Herbert', delta: 11 }])).toBe('Smylie and Herbert up 11 places'));
  it('level but opposite directions name one', () => expect(moversTitle(t, [{ name: 'Smylie', delta: 5 }, { name: 'Herbert', delta: -5 }])).toBe('Smylie up five places'));
  it('down', () => expect(moversTitle(t, [{ name: 'Lee', delta: -7 }, { name: 'Ko', delta: 2 }])).toBe('Lee down seven places'));
  it('one place', () => expect(moversTitle(t, [{ name: 'Lee', delta: 1 }])).toBe('Lee up one place'));
});

describe('b) leaderboard', () => {
  const r = (name: string, s: number, status: string | null = null) => ({ name, score: s, status });
  it('mock: four within three', () => expect(leaderboardTitle(t, [r('Lee', -14), r('Smith', -12), r('Scott', -11), r('Day', -11), r('Ko', -12), r('Fox', -9)])).toBe('Four within three of the lead'));
  it('two share', () => expect(leaderboardTitle(t, [r('Lee', -10), r('Smith', -10), r('Ko', -9)])).toBe('Lee and Smith share the lead'));
  it('three share', () => expect(leaderboardTitle(t, [r('Lee', -10), r('Smith', -10), r('Ko', -10)])).toBe('Three share the lead'));
  it('one within', () => expect(leaderboardTitle(t, [r('Lee', -10), r('Smith', -8), r('Ko', -2)])).toBe('Smith within three of the lead'));
  it('nobody', () => expect(leaderboardTitle(t, [r('Lee', -10), r('Smith', -6)])).toBe('Nobody within three of Lee'));
  it('drops MC/CUT/WD/DQ', () => expect(leaderboardTitle(t, [r('Lee', -10), r('Smith', -10, 'WD'), r('Ko', -9, 'MC')])).toBe('Nobody within three of Lee'));
  it('ten and above are numerals', () => expect(leaderboardTitle(t, [r('Lee', -10), ...Array.from({ length: 12 }, (_, i) => r(`P${i}`, -8))])).toBe('12 within three of the lead'));
});

describe("c) leaders' group", () => {
  const base = { leaderName: 'Lee', thru: 14 as number | null, tee: { day: null as string | null, time: '13:40' } };
  it('mock: on course', () => expect(leadersGroupTitle(t, { ...base, names: ['Lee', 'Smith'], state: 'onCourse' })).toBe('Lee and Smith, through 14'));
  it('suspended', () => expect(leadersGroupTitle(t, { ...base, names: ['Lee', 'Smith'], state: 'suspended' })).toBe('Lee and Smith, stopped on 14'));
  it('before, today', () => expect(leadersGroupTitle(t, { ...base, names: ['Lee', 'Smith'], state: 'before' })).toBe('Lee and Smith tee off at 13:40'));
  it('before, another day', () => expect(leadersGroupTitle(t, { ...base, names: ['Lee', 'Smith'], state: 'before', tee: { day: 'Sat', time: '13:40' } })).toBe('Lee and Smith tee off Sat 13:40'));
  it('delayed', () => expect(leadersGroupTitle(t, { ...base, names: ['Lee', 'Smith'], state: 'delayed' })).toBe('Lee and Smith, delayed'));
  it('finished, pair', () => expect(leadersGroupTitle(t, { ...base, names: ['Lee', 'Smith'], state: 'finished' })).toBe('Lee and Smith have finished'));
  it('three or more: the leader’s group', () => {
    expect(leadersGroupTitle(t, { ...base, names: ['Ko', 'Lee', 'Smith'], state: 'onCourse' })).toBe("Lee's group, through 14");
    expect(leadersGroupTitle(t, { ...base, names: ['Ko', 'Lee', 'Smith'], state: 'finished' })).toBe("Lee's group has finished");
  });
  it.each([
    [['Lee'], 'before', null, 'Lee tees off at 13:40'],
    [['Lee'], 'before', 'Sat', 'Lee tees off Sat 13:40'],
    [['Lee'], 'finished', null, 'Lee has finished'],
    [['Lee', 'Smith'], 'before', null, 'Lee and Smith tee off at 13:40'],
    [['Lee', 'Smith'], 'before', 'Sat', 'Lee and Smith tee off Sat 13:40'],
    [['Lee', 'Smith'], 'finished', null, 'Lee and Smith have finished'],
    [['Ko', 'Lee', 'Smith'], 'before', null, "Lee's group tees off at 13:40"],
    [['Ko', 'Lee', 'Smith'], 'before', 'Sat', "Lee's group tees off Sat 13:40"],
    [['Ko', 'Lee', 'Smith'], 'finished', null, "Lee's group has finished"],
  ] as const)('agreement: %j %s %s', (names, state, day, expected) =>
    expect(leadersGroupTitle(t, { ...base, names: [...names], state, tee: { day, time: '13:40' } })).toBe(expected));
});

describe('d) course, live', () => {
  it('mock: playing under', () => expect(liveCourseTitle(t, -0.42, false)).toEqual({ title: 'Playing 0.42 under par', level: false }));
  it('played over between rounds', () => expect(liveCourseTitle(t, 0.31, true).title).toBe('Played 0.31 over par'));
  it('rounds to 0.00: level, no line', () => expect(liveCourseTitle(t, 0.004, false)).toEqual({ title: 'Playing level with par', level: true }));
  it('line beneath keeps the rest', () => expect(t('overview.heroHead.course.linePlaying', { hard: '17th', easy: '5th' })).toBe('The <b>17th</b> is the hardest hole today, the <b>5th</b> the easiest.'));
});

describe('e) our picks, live', () => {
  it('mock: behind', () => expect(livePicksTitle(t, { kind: 'behind', name: 'Scott', pos: 'T4', gap: 3 })).toBe('Scott is T4, three shots back'));
  it('one shot back', () => expect(livePicksTitle(t, { kind: 'behind', name: 'Scott', pos: 'T4', gap: 1 })).toBe('Scott is T4, one shot back'));
  it('leads', () => expect(livePicksTitle(t, { kind: 'leads', name: 'Lee' })).toBe('Lee leads for us'));
  it('level', () => expect(livePicksTitle(t, { kind: 'level', name: 'Scott', pos: 'T2' })).toBe('Scott is T2, level with the lead'));
  it('eyebrows by state', () => {
    expect(livePicksEyebrow(t, picksEyebrowState('inPlay'), 3)).toEqual({ text: 'OUR TOURNAMENT PICKS · ROUND 3', live: true });
    expect(livePicksEyebrow(t, picksEyebrowState('final'), 4)).toEqual({ text: 'OUR TOURNAMENT PICKS · FINAL ROUND', live: true });
    expect(livePicksEyebrow(t, picksEyebrowState('suspended'), 3)).toEqual({ text: 'OUR TOURNAMENT PICKS · SUSPENDED', live: false });
    expect(livePicksEyebrow(t, picksEyebrowState('inPlay', { delayedRound: 3 }), 3)).toEqual({ text: 'OUR TOURNAMENT PICKS · DELAYED', live: false });
    for (const s of [picksEyebrowState('between'), picksEyebrowState('beforeTee'), picksEyebrowState('inPlay', { afterRound: 2 }), picksEyebrowState('inPlay', { notStarted: true })])
      expect(livePicksEyebrow(t, s, 3)).toEqual({ text: 'OUR TOURNAMENT PICKS', live: false });
  });
});

describe('f) tee times', () => {
  const g = (h: number) => ({ startingHole: h });
  it('mock: both tees', () => expect(teeTimesTitle(t, [...Array(26)].map(() => g(1)).concat([...Array(26)].map(() => g(10))))).toBe('52 groups, off the 1st and 10th'));
  it('only 1st', () => expect(teeTimesTitle(t, [g(1), g(1), g(1)])).toBe('Three groups, all off the 1st'));
  it('only 10th', () => expect(teeTimesTitle(t, [g(10), g(10)])).toBe('Two groups, all off the 10th'));
  it('one group', () => expect(teeTimesTitle(t, [g(1)])).toBe('One group, off the 1st'));
});

describe('g) how it was won', () => {
  const champ = (values: number[]) => ({ name: 'Smylie', champion: true, values });
  it('mock: got within one after round three', () => expect(wonTitle(t, [champ([-4, -8, -12, -16]), { name: 'Herbert', champion: false, values: [-2, -6, -11, -14] }, { name: 'Davis', champion: false, values: [-1, -5, -9, -13] }], 4)).toBe('Herbert got within one after round three'));
  it('a chaser led: the latest such round', () => expect(wonTitle(t, [champ([-2, -5, -9, -14]), { name: 'Lee', champion: false, values: [-4, -7, -8, -12] }], 4)).toBe('Lee led after round two'));
  it('level, ties go to the latest round', () => expect(wonTitle(t, [champ([-2, -5, -9, -14]), { name: 'Lee', champion: false, values: [-2, -5, -8, -12] }], 4)).toBe('Lee was level after round two'));
  it('final round excluded', () => expect(wonTitle(t, [champ([-6, -12, -18, -20]), { name: 'Lee', champion: false, values: [-1, -6, -13, -21] }], 4)).toBe('Nobody got closer than five'));
  it('four or more: nobody', () => expect(wonTitle(t, [champ([-6, -12, -18, -22]), { name: 'Lee', champion: false, values: [-2, -7, -12, -16] }], 4)).toBe('Nobody got closer than four'));
});

describe('h) hole type', () => {
  const h = (par: number, rank: number, tied = false, to_par = 0) => ({ par, rank, tied, to_par });
  it('mock: best untied', () => expect(holeTypeTitle(t, [h(3, 14, false, 1), h(4, 6, false, -3), h(5, 1, false, -9)])).toBe('Best in the field on the par 5s'));
  it('rank 1 tied', () => expect(holeTypeTitle(t, [h(4, 1, true, -5), h(5, 3)])).toBe('Joint best on the par 4s'));
  it('ties: lower to_par, then higher par', () => {
    expect(holeTypeTitle(t, [h(4, 2, false, -2), h(5, 2, false, -6)])).toBe('Second-best on the par 5s');
    expect(holeTypeTitle(t, [h(4, 2, false, -2), h(5, 2, false, -2)])).toBe('Second-best on the par 5s');
  });
  it('joint ranks 2–9', () => expect(holeTypeTitle(t, [h(3, 4, true)])).toBe('Joint fourth-best on the par 3s'));
  it('10 and above', () => expect(holeTypeTitle(t, [h(3, 12)])).toBe('12th-best on the par 3s'));
});

describe('i) runner-up (top three, last-year list)', () => {
  const c = { name: 'Smylie', total: -18, champion: true };
  it('mock: second, two back', () => expect(runnerUpTitle(t, [c, { name: 'Herbert', total: -16, champion: false }, { name: 'Davis', total: -14, champion: false }], false)).toBe('Herbert second, two back'));
  it('one back', () => expect(runnerUpTitle(t, [c, { name: 'Herbert', total: -17, champion: false }], false)).toBe('Herbert second, one back'));
  it('two tie', () => expect(runnerUpTitle(t, [c, { name: 'A', total: -15, champion: false }, { name: 'B', total: -15, champion: false }], false)).toBe('A and B tie for second'));
  it('three tie', () => expect(runnerUpTitle(t, [c, ...['A', 'B', 'C'].map(name => ({ name, total: -15, champion: false }))], false)).toBe('Three tie for second'));
  it('playoff: one, two, many', () => {
    expect(runnerUpTitle(t, [c, { name: 'A', total: -18, champion: false }], true)).toBe('A lost the playoff');
    expect(runnerUpTitle(t, [c, { name: 'A', total: -18, champion: false }, { name: 'B', total: -18, champion: false }], true)).toBe('A and B lost the playoff');
    expect(runnerUpTitle(t, [c, ...['A', 'B', 'C'].map(name => ({ name, total: -18, champion: false }))], true)).toBe('Three lost the playoff');
  });
  it('numericScore reads board strings', () => expect([numericScore('−12'), numericScore('-3'), numericScore('+2'), numericScore('E'), numericScore('')]).toEqual([-12, -3, 2, 0, null]));
});

describe('j) the week', () => {
  it('mock: cut', () => expect(weekTitle(t, { line: 1, made: 68 }, 144, score)).toBe('68 made the cut, at +1'));
  it('no cut with field size', () => expect(weekTitle(t, null, 72, score)).toBe('72 players, no cut'));
  it('neither', () => expect(weekTitle(t, null, null, score)).toBe('How the field played'));
});

describe('k) our picks, finished', () => {
  it('mock: bold without its stop', () => expect(finishedPicksTitle('Smylie won it.')).toBe('Smylie won it'));
});

describe('l) your players', () => {
  it('mock: three', () => expect(yourPlayersTitle(t, 3)).toBe('Three of your players are in the field'));
  it('one', () => expect(yourPlayersTitle(t, 1)).toBe('One of your players is in the field'));
  it('twelve', () => expect(yourPlayersTitle(t, 12)).toBe('12 of your players are in the field'));
});

describe('m) last year, chart', () => {
  it('mock: rule (g) on the prior edition', () => expect(wonTitle(t, [{ name: 'Smylie', champion: true, values: [-3, -7, -11, -15] }, { name: 'Fleetwood', champion: false, values: [-1, -4, -9, -13] }], 4)).toBe('Fleetwood got within two after round three'));
});

describe('n) course, upcoming', () => {
  it('mock: course lead', () => expect(courseLeadTitle(t, 72, 7449)).toBe('Par 72, 7,449 yards'));
  it('par 5 sentence', () => {
    expect(par5Sentence(t, 4)).toBe('Four par 5s.');
    expect(par5Sentence(t, 1)).toBe('One par 5.');
    expect(par5Sentence(t, 0)).toBe('No par 5s.');
  });
});

describe('o) our picks, upcoming', () => {
  it('mock: earliest tee', () => expect(upcomingPicksTitle(t, 3, { name: 'Åberg', weekday: 'Thursday', time: '11:42' })).toBe('Åberg off first, Thursday at 11:42'));
  it('before the draw', () => {
    expect(upcomingPicksTitle(t, 3, null)).toBe('Three picks, tee times to come');
    expect(upcomingPicksTitle(t, 1, null)).toBe('One pick, tee time to come');
  });
});

describe('p–s) season over', () => {
  it('mock: season', () => expect(seasonTitle(t, 23, 39)).toBe('23 different winners in 39 events'));
  it('season, small counts', () => expect(seasonTitle(t, 3, 4)).toBe('Three different winners in four events'));
  it('mock: points clear', () => expect(pointsTitle(t, [{ name: 'Scheffler', points: 5204 }, { name: 'McIlroy', points: 4000 }], fmtPoints)).toBe('Scheffler finished 1,204 points clear'));
  it('points level / one row', () => {
    expect(pointsTitle(t, [{ name: 'A', points: 10 }, { name: 'B', points: 10 }], fmtPoints)).toBe('A and B finished level');
    expect(pointsTitle(t, [{ name: 'A', points: 10 }], fmtPoints)).toBe('A topped the list');
  });
  it('mock: youngest of the 100', () => expect(cardsTitle(t, 100, { name: 'Åberg', age: 22 })).toBe('Åberg, 22, is the youngest of the 100'));
  it('no youngest', () => { expect(cardsTitle(t, 20, null)).toBe('20 cards decided'); expect(cardsTitle(t, 5, null)).toBe('Five cards decided'); });
  it('mock: we picked three winners', () => expect(seasonPicksTitle(t, 3, 9)).toBe('We picked three winners'));
  it('record branches', () => {
    expect(seasonPicksTitle(t, 1, 4)).toBe('We picked one winner');
    expect(seasonPicksTitle(t, 0, 3)).toBe('No winners, three in the top 10');
    expect(seasonPicksTitle(t, 0, 0)).toBe('No winners or top 10s yet');
  });
});
