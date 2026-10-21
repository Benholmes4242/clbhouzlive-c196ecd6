import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { StatBrowseRow } from '../../useStatBrowse';

const mockRows: { current: Partial<StatBrowseRow>[] } = { current: [] };
vi.mock('../../useStatBrowse', () => ({
  useStatBrowseList: () => ({ rows: mockRows.current, isLoading: false }),
}));
vi.mock('../PageLoadGate', () => ({ useSectionReady: () => {} }));

import { pickToughFour, HardestSection } from '../HardestSection';

const row = (i: number): StatBrowseRow =>
  ({ course_id: `c${i}`, name: `Course ${i}`, image_url: null, avg_to_par: i * 0.5 } as unknown as StatBrowseRow);
const pool = (n: number) => Array.from({ length: n }, (_, i) => row(i + 1));
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

describe('pickToughFour', () => {
  it('returns four rows sorted by avg_to_par descending', () => {
    const out = pickToughFour(pool(10), [], seeded(42));
    expect(out).toHaveLength(4);
    const vals = out.map((r) => r.avg_to_par as number);
    expect(vals).toEqual([...vals].sort((a, b) => b - a));
  });
  it('excludes previously shown ids when enough unseen rows exist', () => {
    const prev = ['c1', 'c2', 'c3', 'c4'];
    const out = pickToughFour(pool(10), prev, seeded(7));
    expect(out).toHaveLength(4);
    out.forEach((r) => expect(prev).not.toContain(r.course_id));
  });
  it('pool of 6 with 4 seen returns the 2 unseen plus 2 seen', () => {
    const prev = ['c1', 'c2', 'c3', 'c4'];
    const out = pickToughFour(pool(6), prev, seeded(3));
    expect(out).toHaveLength(4);
    const ids = out.map((r) => r.course_id);
    expect(ids).toContain('c5');
    expect(ids).toContain('c6');
    expect(ids.filter((id) => prev.includes(id))).toHaveLength(2);
  });
  it('pool of 3 returns all 3', () => {
    expect(pickToughFour(pool(3), [], seeded(1))).toHaveLength(3);
  });
});

describe('HardestSection render', () => {
  it('reads Tough tracks and renders no position numbers', () => {
    mockRows.current = pool(8);
    const { container } = render(createElement(MemoryRouter, null, createElement(HardestSection)));
    expect(container.textContent).toContain('Tough tracks');
    expect(container.textContent).not.toContain('Toughest tracks');
    expect(container.querySelectorAll('button')).toHaveLength(4);
    expect(container.textContent).not.toMatch(/\b0[1-4]\b/);
  });
});
