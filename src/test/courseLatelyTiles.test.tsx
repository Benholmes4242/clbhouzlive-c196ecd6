import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }) }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => null }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import { RoundCard } from '@/features/explore-magazine/watch/RoundCard';
import { latelyNines, latelyTileLine, stablefordPoints, fillTemplate, playedOffLabel } from '@/components/courses/course-detail/about/latelyRules';

type Hole = { holeNo: number; par: number | null; strokes: number | null; sheetStrokes: number | null; strokeIndex?: number | null; strokesAllowed?: number | null };
function shape(strokes: Array<number | null>, pars: number[] = Array(18).fill(4), extra: (i: number) => Partial<Hole> = () => ({})) {
  const holes: Hole[] = strokes
    .map((s, i) => ({ holeNo: i + 1, par: pars[i], strokes: s, sheetStrokes: s, strokeIndex: i + 1, strokesAllowed: null, ...extra(i) }))
    .filter((h) => h.strokes != null);
  return { coursePar: 72, series: [], beads: [], played: holes.length, birdies: 0, holes } as never;
}
function round(extra: Record<string, unknown> = {}) {
  return {
    pos: 1, user_id: 'u1', display_name: 'Golfer', profile_photo_url: null, whs_score_id: 's1', play_date: '2026-11-04',
    course_id: 'c1', course_name: 'Sundridge Park', gross_score: 75, course_par: 72, net_score: 66, course_handicap: 9,
    is_competition: false, prior_n: 0, avg_topar: null, best_topar: null, last_better: null, delta: null, ...extra,
  } as never;
}
function mount(r: unknown, shp: unknown = null, props: Record<string, unknown> = {}) {
  const shapes = new Map(shp ? [['s1', shp]] : []) as never;
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}><MemoryRouter><RoundCard round={r as never} shapes={shapes} locale="en" {...props} /></MemoryRouter></QueryClientProvider>);
}
const cellKeys = () => [...document.querySelectorAll('[data-score-breakdown] [data-score-cell]')].map((c) => c.getAttribute('data-score-cell'));
const lineText = (r: unknown, own = false) => {
  const l = latelyTileLine(r as never, own);
  return l ? fillTemplate(l.defaultValue, { ...l.values, possessive: own ? 'your' : 'their' }).replace(/<\/?b>/g, '') : null;
};

afterEach(cleanup);

describe('Lately tile — facts row source rules', () => {
  it('(a) narrow labels AVG/BEST at ≤340 and no 800 weight in the section', () => {
    const css = readFileSync('src/features/explore-magazine/watch/lately-tile.css', 'utf8');
    expect(css).toMatch(/@media \(max-width: 340px\)[^}]*\.lately-long \{ display: none; \}/);
    const files = ['src/components/courses/course-detail/about/CourseLatelySection.tsx', 'src/features/explore-magazine/watch/RoundCard.tsx'];
    for (const f of [...files, 'src/features/explore-magazine/watch/lately-tile.css']) expect(readFileSync(f, 'utf8')).not.toMatch(/fontWeight: 800|font-weight: 800/);
  });
});

describe('Lately tile — score row', () => {
  const eighteen = shape(Array(18).fill(5));
  it('(b1) nettable with an 18-hole shape: TO PAR, NET, POINTS', () => {
    mount(round({ course_handicap: 18, net_score: 72, gross_score: 90 }), eighteen);
    expect(cellKeys()).toEqual(['topar', 'net', 'points']);
    expect(document.querySelector('[data-score-cell="points"] [data-score-figure]')?.textContent).toBe('36');
    expect(document.querySelector('[data-score-cell="gross"] [data-score-label]')?.textContent).toMatch(/72$/);
  });
  it('(b2) nettable with no shape: no POINTS', () => {
    mount(round());
    expect(cellKeys()).toEqual(['topar', 'net']);
  });
  it('(b3) not nettable: PLAYED OFF', () => {
    mount(round({ net_score: null, course_handicap: -2 }));
    expect(cellKeys()).toEqual(['topar', 'playedoff']);
    expect(document.querySelector('[data-score-cell="playedoff"] [data-score-figure]')?.textContent).toBe('+2');
  });
  it('(b4) no handicap: TO PAR only; under par is red', () => {
    mount(round({ net_score: null, course_handicap: null, gross_score: 70 }));
    expect(cellKeys()).toEqual(['topar']);
    const fig = document.querySelector('[data-score-cell="topar"] [data-score-figure]') as HTMLElement;
    expect(fig.textContent).toBe('−2');
    expect(fig.style.color).toBe('rgb(226, 75, 63)');
  });
  it('(b5) missing par: GROSS label', () => {
    mount(round({ course_par: null }));
    expect(document.querySelector('[data-score-cell="gross"] [data-score-label]')?.textContent).not.toMatch(/\d/);
  });
});

describe('Lately tile — points arithmetic', () => {
  it('(c1) received strokes: CH 18 on all-fives, par 4 = 36', () => {
    expect(stablefordPoints(shape(Array(18).fill(5)), 18)).toBe(36);
  });
  it('(c2) provider allocation is used when present', () => {
    const s = shape(Array(18).fill(6), undefined, () => ({ strokesAllowed: 2 }));
    expect(stablefordPoints(s, 36)).toBe(36);
  });
  it('(c3) plus handicap gives strokes back on the two easiest holes', () => {
    expect(stablefordPoints(shape(Array(18).fill(4)), -2)).toBe(34);
    expect(playedOffLabel(-2)).toBe('+2');
  });
  it('(c4) nine holes or no handicap: no points', () => {
    expect(stablefordPoints(shape([...Array(9).fill(4), ...Array(9).fill(null)]), 10)).toBeNull();
    expect(stablefordPoints(shape(Array(18).fill(4)), null)).toBeNull();
  });
});

describe('Lately tile — the line', () => {
  it('(d) each variant, your/their, Level and null delta', () => {
    expect(lineText(round({ prior_n: 0 }))).toBe('First round here');
    expect(lineText(round({ prior_n: 8, last_better: null, delta: -6.31 }))).toBe('Best of their 9 rounds here · −6.3 against their average here');
    expect(lineText(round({ prior_n: 8, last_better: null, delta: -6.31 }), true)).toBe('Best of your 9 rounds here · −6.3 against your average here');
    expect(lineText(round({ prior_n: 5, last_better: null, delta: null }))).toBe('Best of their 6 rounds here');
    expect(lineText(round({ prior_n: 5, last_better: '2026-03-01', delta: -2 }))).toMatch(/^Best here since .+ · −2\.0 against their average here$/);
    expect(lineText(round({ prior_n: 2, last_better: '2026-10-30', delta: 1 }))).toBe('3rd round here');
    expect(lineText(round({ prior_n: 5, last_better: '2026-10-30', delta: 2.25 }))).toBe('+2.3 against their average here');
    expect(lineText(round({ prior_n: 5, last_better: '2026-10-30', delta: -1.5 }), true)).toBe('−1.5 against your average here');
    expect(lineText(round({ prior_n: 5, last_better: '2026-10-30', delta: 0.3 }))).toBe('+0.3 against their average here');
    expect(lineText(round({ prior_n: 5, last_better: '2026-10-30', delta: 0.04 }))).toBe('Level with their average here');
    expect(lineText(round({ prior_n: 5, last_better: '2026-10-30', delta: null }))).toBeNull();
  });
  it('(d2) bold spans render; the meta line is the date alone for others', () => {
    mount(round({ prior_n: 0 }));
    expect(document.querySelector('[data-lately-line] b')?.textContent).toBe('First round');
    expect(document.querySelector('[data-round-card-meta]')?.textContent).toBe('Nov 4');
  });
});

describe('Lately tile — the nines', () => {
  it('(e) every band, blank unplayed holes and totals', () => {
    const strokes = [3, 4, 5, 6, 7, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, null, null];
    const nines = latelyNines(shape(strokes))!;
    expect(nines[0].cells.map((c) => c.mark)).toEqual(['under', 'par', 'bogey', 'double', 'triple', 'under', 'par', 'par', 'par']);
    expect(nines[0].total).toBe(39);
    expect(nines[1].cells.slice(7).map((c) => c.mark)).toEqual(['blank', 'blank']);
    expect(nines[1].total).toBe(28);
    mount(round(), shape(strokes));
    const out = document.querySelector('[data-lately-nine="OUT"]')!;
    expect(out.querySelectorAll('i[data-mark]').length).toBe(9);
    expect(out.querySelector('[data-lately-nine-total]')?.textContent).toBe('39');
    expect(latelyNines(null)).toBeNull();
  });
  it('(e2) no shape: no nines; name tap opens the profile, tile tap the round', () => {
    const onOpenMember = vi.fn();
    const onOpenRound = vi.fn();
    mount(round(), null, { onOpenMember, onOpenRound });
    expect(document.querySelector('[data-lately-nines]')).toBeNull();
    fireEvent.click(document.querySelector('[data-lately-who]')!);
    expect(onOpenMember).toHaveBeenCalledWith('u1');
    expect(onOpenRound).not.toHaveBeenCalled();
    fireEvent.click(document.querySelector('[data-rounds-shelf-card="round"]')!);
    expect(onOpenRound).toHaveBeenCalledWith('s1', 'u1');
  });
});
