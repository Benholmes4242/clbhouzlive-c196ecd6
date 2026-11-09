import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { render } from '@testing-library/react';

import { holeTypeCells, holeTypeHeading, pathCells, weekCells, topThreeRows, championScoreLabel, type WeekFacts } from '@/features/tourhub/tournament-v2/data/weekFactsRules';
import { championNarrative } from '@/features/tourhub/tournament-v2/data/tournamentRules';
import { CompletedWeekBlock } from '@/features/tourhub/tournament-v2/sections/CompletedWeekBlock';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { TournamentMeta } from '@/features/tourhub/leaderboard/useTournamentMeta';

/* Real payloads, confirmed by Ben against live data. */
const WWT: WeekFacts = {
  champion_player_id: 'brown', champion_surname: 'Brown', rounds: 4, par: 72,
  path: [
    { round: 1, position: 9, tied: true, to_par: -6, back: 3, lead_by: null },
    { round: 2, position: 6, tied: true, to_par: -10, back: 5, lead_by: null },
    { round: 3, position: 9, tied: true, to_par: -14, back: 7, lead_by: null },
    { round: 4, position: 1, tied: false, to_par: -23, back: 0, lead_by: null },
  ],
  playoff: true, margin: 0,
  hole_types: [
    { par: 3, to_par: 0, rank: 52, tied: true, field: 75 },
    { par: 4, to_par: -8, rank: 4, tied: true, field: 75 },
    { par: 5, to_par: -15, rank: 1, tied: false, field: 75 },
  ],
  low_round: { to_par: -9, strokes: 63, players: 5, surname: null },
  most_birdies: { count: 30, players: 1, surname: 'Kim' },
  field_avg: 69.7, field_size: 121, cut: { line: -5, made: 75 },
  hardest: { hole: 4, par: 4, avg_to_par: 0.22 }, easiest: { hole: 1, par: 5, avg_to_par: -0.73 },
};
const ABU: WeekFacts = {
  champion_player_id: 'fleetwood', champion_surname: 'Fleetwood', rounds: 4, par: 72,
  path: [
    { round: 1, position: 2, tied: true, to_par: -7, back: 3, lead_by: null },
    { round: 2, position: 1, tied: true, to_par: -12, back: 0, lead_by: null },
    { round: 3, position: 1, tied: false, to_par: -18, back: 0, lead_by: 1 },
    { round: 4, position: 1, tied: false, to_par: -23, back: 0, lead_by: null },
  ],
  playoff: false, margin: 2,
  hole_types: [
    { par: 3, to_par: -2, rank: 5, tied: true, field: 70 },
    { par: 4, to_par: -9, rank: 4, tied: false, field: 70 },
    { par: 5, to_par: -12, rank: 3, tied: true, field: 70 },
  ],
  low_round: { to_par: -10, strokes: 62, players: 1, surname: 'Laporta' },
  most_birdies: { count: 29, players: 1, surname: 'McIlroy' },
  field_avg: 70.3, field_size: 70, cut: null,
  hardest: { hole: 9, par: 4, avg_to_par: 0.16 }, easiest: { hole: 2, par: 5, avg_to_par: -0.54 },
};

const flat = (cells: ReturnType<typeof pathCells>) => cells.map((c) => [c.pos ?? '', c.value, c.label, c.sub]);

describe('completed state — HOW IT WAS WON', () => {
  it('WWT path', () => {
    expect(flat(pathCells(WWT))).toEqual([
      ['T9', '−6', 'AFTER R1', '3 back'], ['T6', '−10', 'AFTER R2', '5 back'],
      ['T9', '−14', 'AFTER R3', '7 back'], ['', '−23', 'FINAL', 'Won · Playoff'],
    ]);
  });
  it('Abu Dhabi path: Level, Led by and Won by two', () => {
    expect(flat(pathCells(ABU))).toEqual([
      ['T2', '−7', 'AFTER R1', '3 back'], ['T1', '−12', 'AFTER R2', 'Level'],
      ['1', '−18', 'AFTER R3', 'Led by 1'], ['', '−23', 'FINAL', 'Won by two'],
    ]);
  });
  it('three-round event gives AFTER R1, AFTER R2, FINAL', () => {
    const f = { ...ABU, rounds: 3, path: ABU.path.slice(0, 3) };
    expect(pathCells(f).map((c) => c.label)).toEqual(['AFTER R1', 'AFTER R2', 'FINAL']);
  });
});

describe('completed state — HOLE TYPE', () => {
  it('WWT values and ranks', () => {
    expect(holeTypeHeading(WWT)).toBe('BROWN ON EACH HOLE TYPE');
    expect(holeTypeCells(WWT)!.map((c) => [c.value, c.label, c.sub])).toEqual([
      ['E', 'PAR 3s', 'T52 in field'], ['−8', 'PAR 4s', 'T4 in field'], ['−15', 'PAR 5s', 'Best in field'],
    ]);
  });
  it('Abu Dhabi ranks', () => {
    expect(holeTypeCells(ABU)!.map((c) => [c.value, c.sub])).toEqual([['−2', 'T5 in field'], ['−9', '4 in field'], ['−12', 'T3 in field']]);
  });
  it('tied at the top reads T1, and null hole types hide the row', () => {
    expect(holeTypeCells({ ...WWT, hole_types: [{ par: 5, to_par: -15, rank: 1, tied: true, field: 75 }] })![0]!.sub).toBe('T1 in field');
    expect(holeTypeCells({ ...WWT, hole_types: null })).toBeNull();
  });
});

describe('completed state — THE WEEK', () => {
  const week = (f: WeekFacts) => weekCells(f).map((c) => [c.value, c.label, c.sub]);
  it('WWT six cells in order', () => {
    expect(week(WWT)).toEqual([
      ['63', 'LOW ROUND', '5 players'], ['30', 'MOST BIRDIES', 'Kim'], ['69.7', 'FIELD AVG', 'Par 72'],
      ['−5', 'CUT', '75 made it'], ['4th', 'HARDEST', '+0.22 · Par 4'], ['1st', 'EASIEST', '−0.73 · Par 5'],
    ]);
    expect(weekCells(WWT).find((c) => c.key === 'cut')!.under).toBe(true);
  });
  it('Abu Dhabi: no cut becomes FIELD', () => {
    expect(week(ABU)).toEqual([
      ['62', 'LOW ROUND', 'Laporta'], ['29', 'MOST BIRDIES', 'McIlroy'], ['70.3', 'FIELD AVG', 'Par 72'],
      ['70', 'FIELD', 'No cut'], ['9th', 'HARDEST', '+0.16 · Par 4'], ['2nd', 'EASIEST', '−0.54 · Par 5'],
    ]);
  });
  it('missing hole statistics drop HARDEST and EASIEST', () => {
    expect(weekCells({ ...WWT, hardest: null, easiest: null }).map((c) => c.key)).toEqual(['low', 'birdies', 'avg', 'cut']);
  });
  it('sub-lines starting with a word start with a capital', () => {
    const subs = [WWT, ABU].flatMap((f) => [...pathCells(f), ...holeTypeCells(f)!, ...weekCells(f)].map((c) => c.sub)).filter(Boolean);
    for (const s of subs) if (/^[a-z]/i.test(s)) expect(s[0]).toBe(s[0]!.toUpperCase());
  });
});

const row = (id: string, name: string, position: number, tied: boolean, score: number, r4: number, status: string | null = null) =>
  ({ id, player: { id, sr_id: id, full_name: name }, position, position_tied: tied, score, round_1: 0, round_2: 0, round_3: 0, round_4: r4, status }) as unknown as BoardEntry;

describe('completed state — THE TOP THREE and PLAYOFF', () => {
  it('trophy for the champion, blank repeated tie, at most five', () => {
    const rows = [row('brown', 'Blades Brown', 1, false, -23, -9), row('james', 'Benjamin James', 2, false, -23, -2),
      row('kim', 'Michael Kim', 3, true, -22, -8), row('x', 'X', 3, true, -22, -1), row('y', 'Y', 3, true, -22, -1), row('z', 'Z', 3, true, -22, -1), row('w', 'W', 7, false, -20, 0)];
    const top = topThreeRows(rows, 'brown', 4);
    expect(top.map((r) => [r.winner, r.pos, r.last, r.total])).toEqual([[true, '1', -9, -23], [false, '2', -2, -23], [false, 'T3', -8, -22], [false, '', -1, -22], [false, '', -1, -22]]);
  });
  it('PLAYOFF when the top two finish tied, BY words otherwise', () => {
    expect(championScoreLabel(0, false)).toBe('PLAYOFF');
    expect(championScoreLabel(null, true)).toBe('PLAYOFF');
    expect(championScoreLabel(2, false)).toBe('BY TWO');
  });
  it('the block renders the four sections', () => {
    const { container } = render(<CompletedWeekBlock facts={WWT} rows={[row('brown', 'Blades Brown', 1, false, -23, -9)]} onFullBoard={() => {}} />);
    expect(container.querySelectorAll('[data-cw-section="path"] [data-cw-cell]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-cw-section="holes"] [data-cw-cell]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-cw-top-row]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-cw-section="week"] [data-cw-cell]')).toHaveLength(6);
    expect(container.querySelector('[data-hero-full-leaderboard]')).not.toBeNull();
  });
  it('both pages render the same block through the one hook', () => {
    for (const f of ['src/features/tourhub/tournament-v2/TournamentPage.tsx', 'src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx']) {
      const src = readFileSync(f, 'utf8');
      expect(src).toContain('<CompletedWeekBlock');
      expect(src).toContain('useTournamentWeekFacts(');
    }
  });
});

describe('championNarrative — no repeated final round', () => {
  it('drops the closing clause when the clear clause names the final round', () => {
    const W = { id: 'w', player: { id: 'w', sr_id: 'w', full_name: 'Tommy Fleetwood' }, position: 1, score: -17, round_1: -3, round_2: -3, round_3: -6, round_4: -5 } as unknown as BoardEntry;
    const O = { id: 'o', player: { id: 'o', sr_id: 'o', full_name: 'Other Player' }, position: 2, score: -15, round_1: -7, round_2: -1, round_3: -3, round_4: -4 } as unknown as BoardEntry;
    const meta = { winner_id: 'w', venue_par: 72, start_date: '2026-01-15' } as TournamentMeta;
    const text = championNarrative(meta, [W, O]).map((p) => p.text).join('');
    expect(text).toBe('Took the lead on Saturday with a 66, and went two clear with a 67 on Sunday.');
  });
});
