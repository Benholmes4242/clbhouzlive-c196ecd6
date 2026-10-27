/** CB105 — golf club profile section 3, "How it plays". */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ClubHowItPlays, pickEasiestHole, pickHardestHole, type BusinessClubCourse } from '@/components/business/ClubHowItPlays';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const mocks = vi.hoisted(() => ({ stats: {} as Record<string, unknown>, holes: {} as Record<string, unknown> }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({
  useCourseStatsDetail: (id: string) => (id in mocks.stats ? { data: mocks.stats[id], isLoading: false } : { data: undefined, isLoading: true }),
}));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: (id: string) => ({ data: mocks.holes[id] }) }));

const east: BusinessClubCourse = { id: 'east', name: 'Sundridge Park Golf Club (East Course)', region: 'Kent', country: 'England' };
const west: BusinessClubCourse = { ...east, id: 'west', name: 'Sundridge Park Golf Club (West Course)' };
const st = (rounds: number, extra: Record<string, unknown> = {}) => ({ rounds_tracked: rounds, avg_over_par: 11.2, harder_than_pct: 81, hardest_hole_no: 4, ...extra });
const hole = (n: number, avg: number, si: number | null = n): CourseHole => ({ hole_no: n, par: 4, yards: null, stroke_index: si, rounds: 10, avg_to_par: avg, avg_gross: 4 + avg, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 0, par: 0, bogey: 0, double: 0 } });
const analysis = (holes: CourseHole[]) => ({ available: true, total_rounds: 10, holes });
const render2 = (courses = [east, west], onOpen = vi.fn(), isClub = true) =>
  render(<ClubHowItPlays isClub={isClub} courses={courses} onOpen={onOpen} />).container;
const block = (c: HTMLElement, id: string) => c.querySelector(`[data-club-plays-course="${id}"]`) as HTMLElement;

afterEach(() => { cleanup(); mocks.stats = {}; mocks.holes = {}; });

describe('CB105 How it plays', () => {
  it('header totals rounds across courses with locale grouping, and is singular at one', () => {
    mocks.stats = { east: st(901), west: st(863) };
    expect(render2().querySelector('[data-club-plays-total]')?.textContent).toBe('1,764 rounds');
    cleanup();
    mocks.stats = { east: st(1) };
    expect(render2([east]).querySelector('[data-club-plays-total]')?.textContent).toBe('1 round');
  });

  it('shows short course names and per-course round counts', () => {
    mocks.stats = { east: st(901), west: st(1) };
    const c = render2();
    expect(block(c, 'east').querySelector('[data-club-plays-name]')?.textContent).toBe('East Course');
    expect(block(c, 'east').querySelector('[data-club-plays-count]')?.textContent).toBe('901 rounds ›');
    expect(block(c, 'west').querySelector('[data-club-plays-count]')?.textContent).toContain('1 round ›');
  });

  it('Early data tag at 1–9 rounds, not at 10', () => {
    mocks.stats = { east: st(9), west: st(10) };
    const c = render2();
    expect(block(c, 'east').querySelector('[data-club-plays-early]')).not.toBeNull();
    expect(block(c, 'west').querySelector('[data-club-plays-early]')).toBeNull();
    cleanup(); mocks.stats = { east: st(1) };
    expect(block(render2([east]), 'east').querySelector('[data-club-plays-early]')).not.toBeNull();
  });

  it('No rounds yet shows nothing else', () => {
    mocks.stats = { east: st(0) };
    mocks.holes = { east: analysis(Array.from({ length: 18 }, (_, i) => hole(i + 1, 0.5))) };
    const b = block(render2([east]), 'east');
    expect(b.querySelector('[data-club-plays-count]')?.textContent).toBe('No rounds yet ›');
    expect(b.querySelector('[data-club-plays-cells]')).toBeNull();
    expect(b.querySelector('[data-club-plays-strip]')).toBeNull();
    expect(b.querySelector('[data-club-plays-early]')).toBeNull();
  });

  it('loading shows the head row name only', () => {
    const b = block(render2([east]), 'east');
    expect(b.querySelector('[data-club-plays-name]')).not.toBeNull();
    expect(b.querySelector('[data-club-plays-count]')).toBeNull();
    expect(b.querySelector('[data-club-plays-cells]')).toBeNull();
  });

  it('cells adapt to two columns when harder_than_pct is null', () => {
    mocks.stats = { east: st(20, { harder_than_pct: null }), west: st(20) };
    const c = render2();
    const e = block(c, 'east').querySelector('[data-club-plays-cells]') as HTMLElement;
    expect(e.querySelectorAll('[data-club-plays-cell]').length).toBe(2);
    expect(e.style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    const w = block(c, 'west').querySelector('[data-club-plays-cells]') as HTMLElement;
    expect(w.querySelectorAll('[data-club-plays-cell]').length).toBe(3);
    expect(w.textContent).toContain('+11.2');
    expect(w.textContent).toContain('81%');
  });

  it('strip has one bar per hole (18 and 9), proportional heights, 8% floor and one red bar', () => {
    mocks.stats = { east: st(20), west: st(20) };
    const eighteen = Array.from({ length: 18 }, (_, i) => hole(i + 1, i === 17 ? 1 : i === 0 ? -0.2 : 0.5));
    mocks.holes = { east: analysis(eighteen), west: analysis(Array.from({ length: 9 }, (_, i) => hole(i + 1, i === 2 ? 2 : 0.1))) };
    const c = render2();
    const bars = block(c, 'east').querySelectorAll<HTMLElement>('[data-club-plays-strip] i');
    expect(bars.length).toBe(18);
    expect(bars[17].style.height).toBe('100%');
    expect(bars[1].style.height).toBe('50%');
    expect(bars[0].style.height).toBe('8%');
    expect(block(c, 'east').querySelectorAll('[data-hardest="true"]').length).toBe(1);
    const nine = block(c, 'west').querySelectorAll<HTMLElement>('[data-club-plays-strip] i');
    expect(nine.length).toBe(9);
    expect(nine[1].style.height).toBe('8%');
    expect(block(c, 'west').textContent).toContain('Over par by hole9');
  });

  it('cell and red bar name the same hole, ties broken by stroke index', () => {
    mocks.stats = { east: st(20, { hardest_hole_no: 18 }) };
    const holes = Array.from({ length: 18 }, (_, i) => hole(i + 1, 0.3, i + 1));
    holes[4] = hole(5, 1.4, 9); holes[11] = hole(12, 1.4, 2);
    mocks.holes = { east: analysis(holes) };
    expect(pickHardestHole(holes)).toBe(12);
    const b = block(render2([east]), 'east');
    expect(b.querySelector('[data-hardest="true"]')?.getAttribute('data-hole')).toBe('12');
    expect(b.querySelector('[data-club-plays-cells]')?.textContent).toContain('12th');
    expect(b.querySelector('[data-club-plays-cells]')?.textContent).not.toContain('18th');
  });

  it('falls back to hardest_hole_no with no strip when analysis is unavailable', () => {
    mocks.stats = { east: st(20, { hardest_hole_no: 8 }) };
    mocks.holes = { east: { available: false, total_rounds: 0, holes: [] } };
    const b = block(render2([east]), 'east');
    expect(b.querySelector('[data-club-plays-cells]')?.textContent).toContain('8th');
    expect(b.querySelector('[data-club-plays-strip]')).toBeNull();
  });

  it('block tap calls the open handler with id and position', () => {
    mocks.stats = { east: st(20), west: st(20) };
    const onOpen = vi.fn();
    fireEvent.click(block(render2([east, west], onOpen), 'west'));
    expect(onOpen).toHaveBeenCalledWith('west', 1);
  });

  it('non-club profiles never render it', () => {
    mocks.stats = { east: st(20) };
    expect(render2([east], vi.fn(), false).querySelector('[data-club-how-it-plays]')).toBeNull();
  });

  it('pickEasiestHole takes the lowest average, ties going to the higher stroke index', () => {
    const holes = [hole(1, 0.5, 7), hole(2, 0.5, 12), hole(3, 0.5, null)];
    expect(pickEasiestHole(holes)).toBe(2);
  });

  it('easiest hole takes the green bar while hardest keeps red and others stay neutral', () => {
    const holes = Array.from({ length: 18 }, (_, i) => hole(i + 1, 0.3));
    holes[3] = hole(4, 1.4);
    holes[16] = hole(17, -0.2);
    mocks.stats = { east: st(20) };
    mocks.holes = { east: analysis(holes) };
    expect(pickEasiestHole(holes)).toBe(17);
    const b = block(render2([east]), 'east');
    const bars = b.querySelectorAll<HTMLElement>('[data-club-plays-strip] i');
    expect(bars[16].style.background).toBe(norm(A.GREEN));
    expect(bars[3].style.background).toBe(norm('#D9473B'));
    expect(bars[0].style.background).not.toBe(norm(A.GREEN));
    expect(bars[0].style.background).not.toBe(norm('#D9473B'));
  });
});

const norm = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};
