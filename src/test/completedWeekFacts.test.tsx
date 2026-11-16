import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fireEvent, render } from '@testing-library/react';

import { holeTypeCells, holeTypeHeading, pathCells, wonChart, weekCells, topThreeRows, championScoreLabel, type WeekFacts } from '@/features/tourhub/tournament-v2/data/weekFactsRules';
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
  const week = (f: WeekFacts) => weekCells(f).map((c) => [c.value, c.label, c.detail]);
  it('WWT four figures in order', () => {
    expect(week(WWT)).toEqual([['63', 'Low round', '5 players'], ['30', 'Most birdies', 'Kim'], ['+0.22', 'Hardest', '4th hole'], ['−0.73', 'Easiest', '1st hole']]);
    expect(weekCells(WWT).map(c => c.key)).toEqual(['low', 'birdies', 'hardest', 'easiest']);
  });
  it('Abu Dhabi omits field and average even without a cut', () => {
    expect(week(ABU)).toEqual([['62', 'Low round', 'Laporta'], ['29', 'Most birdies', 'McIlroy'], ['+0.16', 'Hardest', '9th hole'], ['−0.54', 'Easiest', '2nd hole']]);
  });
  it('missing hole statistics drop HARDEST and EASIEST', () => {
    expect(weekCells({ ...WWT, hardest: null, easiest: null }).map((c) => c.key)).toEqual(['low', 'birdies']);
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
    expect(container.querySelectorAll('[data-cw-section="path"] circle')).toHaveLength(4);
    expect(container.querySelectorAll('[data-cw-section="holes"] [data-cw-cell]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-cw-top-row]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-cw-section="week"] [data-cw-cell]')).toHaveLength(4);
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
  it('hole cells retain two lines while week cells have the supplied detail', () => {
    const { container } = render(<CompletedWeekBlock facts={WWT} rows={[]} />);
    for (const cell of container.querySelectorAll('[data-cw-section="holes"] [data-cw-cell]')) expect(cell.children).toHaveLength(2);
    expect(container.querySelectorAll('[data-cw-section="week"] em')).toHaveLength(4);
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


describe('finished week chart', () => {
  const field = () => [row('brown', 'Blades Brown', 1, true, -23, -9), row('a', 'First Runner', 2, true, -22, -8), row('b', 'Second Runner', 2, true, -22, -8), row('c', 'Third Player', 4, false, -20, -6)];
  it('champion plus next two retain board order on ties and cumulative values', () => {
    const chart = wonChart(WWT, field(), 335);
    expect(chart?.lines.map(p => p.id)).toEqual(['brown', 'a', 'b']);
    expect(chart?.lines[0]?.values).toEqual([0, 0, 0, -9]);
    expect(chart?.lines[0]?.points.map(p => p.x)).toEqual([14, 86.33333333333333, 158.66666666666666, 231]);
    expect(chart?.lines[0]?.points[3]?.y).toBeLessThan(chart?.lines[0]?.points[0]?.y ?? 0);
  });
  it('labels with equal finish scores are at least 13px apart', () => {
    const labels = wonChart(WWT, field(), 335)?.lines.map(p => p.labelY).sort((a,b)=>a-b) ?? [];
    expect(labels).toHaveLength(3);
    expect(labels[1] - labels[0]).toBeGreaterThanOrEqual(13);
    expect(labels[2] - labels[1]).toBeGreaterThanOrEqual(13);
  });
  it.each(['MC', 'CUT', 'WD', 'DQ'])('never selects %s finishers', status => {
    const rows=field(); rows[1]={...rows[1],status};
    expect(wonChart(WWT, rows, 335)?.lines.map(p=>p.id)).toEqual(['brown','b','c']);
  });
  it('drops an incomplete selected player without substituting a fourth', () => {
    const rows=field(); rows[1]={...rows[1],round_2:null};
    expect(wonChart(WWT, rows, 335)?.lines.map(p=>p.id)).toEqual(['brown','b']);
  });
  it('three rounds use three cumulative values and path positions', () => {
    const chart=wonChart({...WWT,rounds:3,path:WWT.path.slice(0,3)},field(),335);
    expect(chart?.lines[0]?.values).toEqual([0,0,0]);
    expect(chart?.rounds.map(r=>r.label)).toEqual(['R1','R2','R3']);
    expect(chart?.lines[0]?.points.map(p=>p.position?.position)).toEqual([9,6,9]);
  });
  it('hides for one round, no path or incomplete champion', () => {
    expect(wonChart({...WWT,rounds:1},field(),335)).toBeNull();
    expect(wonChart({...WWT,path:[]},field(),335)).toBeNull();
    const rows=field(); rows[0]={...rows[0],round_1:null};
    expect(wonChart(WWT,rows,335)).toBeNull();
  });
  it('full board row counts undisplayed rows and opens the existing board', () => {
    const tap=vi.fn(); const {container}=render(<CompletedWeekBlock facts={WWT} rows={field()} onFullBoard={tap}/>);
    const button=container.querySelector('[data-hero-full-leaderboard]');
    expect(button).toHaveAttribute('data-field-size','4');
    expect(button).toHaveAttribute('aria-label','Full leaderboard, 4 players');
    expect(button?.querySelector('.cw-n')?.textContent).toBe('1 more players');
    if(!button)throw new Error('Missing full board row');fireEvent.click(button);expect(tap).toHaveBeenCalledOnce();
  });
});
