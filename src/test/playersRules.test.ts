import { describe, expect, it } from 'vitest';
import {
  displayPlayerName, gapLineFor, heroHeadline, legacyTabRedirect, averageFinish, rankByForm, rankStat, qualifies,
  seasonStatsRedirect, situationSentence, statSentence, STAT_DEFS, type StandingRow, type Stake, type Start,
} from '@/features/tourhub/players-v2/playersRules';

const row = (rank: number, points: number, name = `P${rank}`): StandingRow => ({ key: name, playerId: name, rank, name, points, wins: null, top10s: null, events: null });
const stake = (after: number, extra: Partial<Stake> = {}): Stake => ({ after_position: after, explainer: null, featured: true, foot: null, kicker: null, line_label: `Line ${after}`, pill_label: null, side: null, sort: 0, ...extra });
const start = (label: string): Start => {
  const missed = /^(MC|WD|DQ)$/.test(label);
  return { label, position: missed ? null : Number(label.replace('T', '')), missed, date: null, eventName: null };
};
const text = (r: Array<{ text: string }> | null) => (r ?? []).map((x) => x.text).join('');

describe('heroHeadline thresholds', () => {
  it('1.3 or more runs away', () => {
    expect(heroHeadline({ status: 'live', leaderPts: 1300, secondPts: 1000, leaderName: 'Scottie Scheffler' })).toBe('Scheffler has run away with it');
  });
  it('1.1 up to 1.3 is out in front', () => {
    expect(heroHeadline({ status: 'live', leaderPts: 1100, secondPts: 1000, leaderName: 'Scottie Scheffler' })).toBe('Scheffler is out in front');
    expect(heroHeadline({ status: 'live', leaderPts: 1299, secondPts: 1000, leaderName: 'Scottie Scheffler' })).toBe('Scheffler is out in front');
  });
  it('below 1.1 is tight', () => {
    expect(heroHeadline({ status: 'live', leaderPts: 1099, secondPts: 1000, leaderName: 'Scottie Scheffler' })).toBe("It's tight at the top");
  });
  it('a final race finished on top', () => {
    expect(heroHeadline({ status: 'final', leaderPts: 1000, secondPts: 999, leaderName: 'Scottie Scheffler' })).toBe('Scheffler finished on top');
  });
});

describe('gap lines within three places of a line', () => {
  const rows = Array.from({ length: 110 }, (_, i) => row(i + 1, 1000 - i * 5));
  const lines = [stake(100)];
  it('inside: ranks 98, 99 and 100 are clear of 101st', () => {
    for (const r of [98, 99, 100]) expect(gapLineFor(r, rows[r - 1].points, rows, lines)).toMatchObject({ kind: 'clear', other: '101st' });
    expect(gapLineFor(100, rows[99].points, rows, lines)?.pts).toBe(5);
  });
  it('outside: ranks 101, 102 and 103 are short of 100th', () => {
    for (const r of [101, 102, 103]) expect(gapLineFor(r, rows[r - 1].points, rows, lines)).toMatchObject({ kind: 'short', other: '100th' });
    expect(gapLineFor(103, rows[102].points, rows, lines)?.pts).toBe(15);
  });
  it('not beyond three places on either side', () => {
    expect(gapLineFor(97, rows[96].points, rows, lines)).toBeNull();
    expect(gapLineFor(104, rows[103].points, rows, lines)).toBeNull();
  });
});

describe('form ranking', () => {
  it('a missed cut counts as 70th', () => {
    expect(averageFinish([start('1'), start('MC'), start('9')])).toBeCloseTo(80 / 3);
  });
  it('needs at least three starts', () => {
    expect(averageFinish([start('1'), start('2')])).toBeNull();
    const ranked = rankByForm([{ rank: 1, s: [start('1'), start('2')] }, { rank: 2, s: [start('5'), start('5'), start('5')] }], (r) => r.s);
    expect(ranked.map((e) => e.row.rank)).toEqual([2]);
  });
  it('ties are broken by standings rank', () => {
    const ranked = rankByForm([{ rank: 7, s: [start('3'), start('3'), start('3')] }, { rank: 2, s: [start('3'), start('3'), start('3')] }], (r) => r.s);
    expect(ranked.map((e) => e.row.rank)).toEqual([2, 7]);
  });
});

describe('stat ties and qualification', () => {
  it('four players on 3 wins all read T1', () => {
    const items = [3, 3, 3, 3, 2].map((value, i) => ({ row: { name: `P${i}` }, value }));
    const out = rankStat(STAT_DEFS.wins, items);
    expect(out.slice(0, 4).map((e) => e.rankLabel)).toEqual(['T1', 'T1', 'T1', 'T1']);
    expect(out[4].rankLabel).toBe('5');
  });
  it('rate stats need 15 starts on PGA', () => {
    expect(qualifies(STAT_DEFS.scoring_avg, { value: 70, starts: 15, rounds: null }, true)).toBe(true);
    expect(qualifies(STAT_DEFS.scoring_avg, { value: 70, starts: 14, rounds: null }, true)).toBe(false);
  });
  it('rate stats need 30 full rounds on other tours', () => {
    expect(qualifies(STAT_DEFS.scoring_avg, { value: 70, starts: null, rounds: 30 }, false)).toBe(true);
    expect(qualifies(STAT_DEFS.scoring_avg, { value: 70, starts: null, rounds: 29 }, false)).toBe(false);
  });
  it('count stats exclude zero', () => {
    expect(qualifies(STAT_DEFS.wins, { value: 0, starts: 20, rounds: 80 }, true)).toBe(false);
    expect(qualifies(STAT_DEFS.earnings, { value: 1, starts: 1, rounds: 0 }, true)).toBe(true);
  });
});

describe('displayPlayerName', () => {
  it.each([
    ['Eugenio CHACARRA', 'Eugenio Chacarra'],
    ['MCILROY', 'McIlroy'],
    ['J.J. SPAUN', 'J.J. Spaun'],
    ['VAN ROOYEN', 'Van Rooyen'],
    ['Davis Love III', 'Davis Love III'],
  ])('%s → %s', (raw, out) => expect(displayPlayerName(raw)).toBe(out));
});

describe('situation sentence', () => {
  const events = [
    { id: 'a', name: 'Bermuda Championship', startDate: '2026-10-01', finished: true },
    { id: 'b', name: 'World Wide Technology Championship', startDate: '2026-11-05', finished: false },
    { id: 'c', name: 'Butterfield', startDate: '2026-11-12', finished: false },
    { id: 'd', name: 'RSM Classic', startDate: '2026-11-19', finished: false },
  ];
  it('two lines', () => {
    const s = situationSentence({ status: 'live', hasPhase: true, events, lines: [{ stake: stake(100, { pill_label: 'The card line' }), gap: 6 }, { stake: stake(60, { pill_label: 'Next 10' }), gap: 2 }] });
    expect(text(s)).toBe('Three events left before the standings close after the RSM Classic, and the fight is at the edges: 6 points across the card line, 2 across the Next 10.');
    expect(s?.filter((r) => r.bold).map((r) => r.text)).toEqual(['6', '2']);
  });
  it('one line', () => {
    const s = situationSentence({ status: 'live', hasPhase: true, events, lines: [{ stake: stake(100, { pill_label: 'The 100 line' }), gap: 6 }] });
    expect(text(s)).toBe('Three events left before the standings close after the RSM Classic, and the fight is at the edges: 6 points across the 100 line.');
  });
  it('a final race', () => {
    const s = situationSentence({ status: 'final', hasPhase: true, events, lines: [{ stake: stake(100, { explainer: 'Full card for 2027.' }), gap: 6 }] });
    expect(text(s)).toBe('The season is over. Full card for 2027.');
  });
});

describe('stat sentence gap phrases', () => {
  const two = (key: string, a: number, b: number) => rankStat(STAT_DEFS[key], [{ row: { name: 'Scottie Scheffler' }, value: a }, { row: { name: 'Matt Fitzpatrick' }, value: b }]);
  it.each([
    ['scoring_avg', 68.62, 69.03, 'Scheffler leads scoring at 68.62, 0.41 a round better than Matt Fitzpatrick.'],
    ['strokes_gained_putting', 0.76, 0.5, 'Scheffler leads sg putting at +0.76, 0.26 clear of Matt Fitzpatrick.'],
    ['drive_avg', 330.3, 325.1, 'Scheffler leads driving distance at 330.3, 5.2 yards longer than Matt Fitzpatrick.'],
    ['gir_pct', 74.1, 72.6, 'Scheffler leads greens hit at 74.1%, 1.5 points ahead of Matt Fitzpatrick.'],
    ['earnings', 30_900_000, 20_000_000, 'Scheffler leads earnings at $30.9m, $10.9m ahead of Matt Fitzpatrick.'],
    ['par5', -0.52, -0.4, 'Scheffler leads par 5s at −0.52, 0.12 a hole better than Matt Fitzpatrick.'],
    ['bogey_rate', 12.0, 13.5, 'Scheffler leads dropped shots at 12.0%, 1.5 points fewer than Matt Fitzpatrick.'],
  ])('%s', (key, a, b, out) => expect(statSentence(STAT_DEFS[key], two(key, a, b))).toBe(out));
  it('a shared count lead lists everyone', () => {
    const out = rankStat(STAT_DEFS.wins, ['A', 'B', 'C', 'D'].map((name) => ({ row: { name }, value: 3 })));
    expect(statSentence(STAT_DEFS.wins, out)).toBe('4 players share the lead on 3 wins: A, B, C and D.');
  });
  it('world ranking', () => {
    const out = rankStat(STAT_DEFS.world_rank, [{ row: { name: 'Scottie Scheffler' }, value: 1 }, { row: { name: 'B' }, value: 3 }]);
    expect(statSentence(STAT_DEFS.world_rank, out)).toBe('Scheffler is the highest-ranked player here, at No. 1.');
  });
});

describe('legacy redirects', () => {
  it('?tab=leaderboards → players full field, Stats lens', () => {
    expect(legacyTabRedirect(new URLSearchParams('tab=leaderboards'))?.toString()).toBe('tab=players&view=all&lens=stats');
  });
  it('/tourhub/season-stats?tour=X keeps the tour', () => {
    expect(seasonStatsRedirect('?tour=euro')).toBe('/tourhub?tab=players&tour=euro&view=all&lens=stats');
  });
  it('other tabs are untouched', () => {
    expect(legacyTabRedirect(new URLSearchParams('tab=players'))).toBeNull();
  });
});
