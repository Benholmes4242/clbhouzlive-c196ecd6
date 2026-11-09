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

const flat = (cells: ReturnType<typeof pathCells>) => cells.map((c) => [c.pos ?? '', c.value, c.label]);

describe('completed state — HOW IT WAS WON', () => {
  it('WWT path', () => {
    expect(flat(pathCells(WWT))).toEqual([
      ['T9', '−6', 'R1 · 3 BACK'], ['T6', '−10', 'R2 · 5 BACK'],
      ['T9', '−14', 'R3 · 7 BACK'], ['', '−23', 'FINAL'],
    ]);
  });
  it('Abu Dhabi path: Level, Led by and Won by two', () => {
    expect(flat(pathCells(ABU))).toEqual([
      ['T2', '−7', 'R1 · 3 BACK'], ['T1', '−12', 'R2 · LEVEL'],
      ['1', '−18', 'R3 · LED BY 1'], ['', '−23', 'FINAL'],
    ]);
  });
  it('three-round event gives AFTER R1, AFTER R2, FINAL', () => {
    const f = { ...ABU, rounds: 3, path: ABU.path.slice(0, 3) };
    expect(pathCells(f).map((c) => c.label)).toEqual(['R1 · 3 BACK', 'R2 · LEVEL', 'FINAL']);
  });
});

describe('completed state — HOLE TYPE', () => {
  it('WWT values and ranks', () => {
    expect(holeTypeHeading(WWT)).toBe('BROWN ON EACH HOLE TYPE');
    expect(holeTypeCells(WWT)?.map((c) => [c.value, c.label])).toEqual([
      ['E', 'PAR 3s · T52'], ['−8', 'PAR 4s · T4'], ['−15', 'PAR 5s · BEST'],
    ]);
  });
  it('Abu Dhabi ranks', () => {
    expect(holeTypeCells(ABU)?.map((c) => [c.value, c.label])).toEqual([['−2', 'PAR 3s · T5'], ['−9', 'PAR 4s · 4'], ['−12', 'PAR 5s · T3']]);
  });
  it('tied at the top reads T1, and null hole types hide the row', () => {
    expect(holeTypeCells({ ...WWT, hole_types: [{ par: 5, to_par: -15, rank: 1, tied: true, field: 75 }] })?.[0]?.label).toBe('PAR 5s · T1');
    expect(holeTypeCells({ ...WWT, hole_types: null })).toBeNull();
  });
});

describe('completed state — THE WEEK', () => {
  const week = (f: WeekFacts) => weekCells(f).map((c) => [c.pos ? `${c.pos} ${c.value}` : c.value, c.label]);
  it('WWT six cells in order', () => {
    expect(week(WWT)).toEqual([
      ['63', 'LOW · 5 PLAYERS'], ['30', 'BIRDIES · KIM'], ['69.7', 'AVG · PAR 72'],
      ['−5', 'CUT · 75 MADE IT'], ['4th +0.22', 'HARDEST'], ['1st −0.73', 'EASIEST'],
    ]);
    expect(weekCells(WWT).find((c) => c.key === 'cut')?.under).toBe(true);
  });
  it('Abu Dhabi: no cut becomes FIELD', () => {
    expect(week(ABU)).toEqual([
      ['62', 'LOW · LAPORTA'], ['29', 'BIRDIES · MCILROY'], ['70.3', 'AVG · PAR 72'],
      ['70', 'FIELD · NO CUT'], ['9th +0.16', 'HARDEST'], ['2nd −0.54', 'EASIEST'],
    ]);
  });
  it('missing hole statistics drop HARDEST and EASIEST', () => {
    expect(weekCells({ ...WWT, hardest: null, easiest: null }).map((c) => c.key)).toEqual(['low', 'birdies', 'avg', 'cut']);
  });
  it('sub-lines starting with a word start with a capital', () => {
    const labels = [WWT, ABU].flatMap((f) => [...pathCells(f), ...(holeTypeCells(f) ?? []), ...weekCells(f)].map((c) => c.label));
    for (const s of labels) if (/^[a-z]/i.test(s)) expect(s[0]).toBe(s[0]?.toUpperCase());
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

describe('two-line completed figures', () => {
  it('contains no separate sub-line or 11.5px style', () => {
    const { container } = render(<CompletedWeekBlock facts={WWT} rows={[]} />);
    expect(container.querySelectorAll('[data-cw-cell] em')).toHaveLength(0);
    expect(readFileSync('src/features/tourhub/tournament-v2/sections/completedWeek.css', 'utf8')).not.toContain('11.5px');
    for (const cell of container.querySelectorAll('[data-cw-cell]')) expect(cell.children).toHaveLength(2);
  });
  it('uses the shared score helper for negative, even and positive top-three values', async () => {
    const { getScoreColor } = await import('@/features/tourhub/_shared/scoreColor');
    const { container } = render(<CompletedWeekBlock facts={WWT} rows={[row('brown', 'Brown', 1, false, -23, -9), row('even', 'Even', 2, false, 0, 0), row('over', 'Over', 3, false, 2, 1)]} />);
    const rows = container.querySelectorAll('[data-cw-top-row]');
    for (const [index, score] of [-23, 0, 2].entries()) {
      expect(rows[index]?.querySelector('.cw-v')).toHaveStyle({ color: getScoreColor(score, 'dark', 'ink-neutral') });
    }
  });
});
