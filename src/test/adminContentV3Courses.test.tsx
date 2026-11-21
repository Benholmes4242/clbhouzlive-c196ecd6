/**
 * CONTENT_V3_2_COURSES — admin Content Courses tab in the v3 grammar.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let data: any = null;
vi.mock('@/features/admin/hooks/useContentDesk', () => ({
  isPermissionError: () => false,
  useCourseCoverage: () => ({ data, isLoading: false, isError: false, error: null, refetch: vi.fn() }),
}));

import CoursesSection from '@/features/admin/components/content/CoursesSection';

const base = {
  stats: { total: 23322, geocoded: 413, missingPhoto: 32, top100: 329 },
  search: '', onSearch: () => {}, results: [], resultsTotal: 0, page: 1, pageSize: 20,
  onPage: () => {}, searching: false, onFix: () => {}, onAdd: () => {},
};
const rows = [
  { id: 'a', name: 'Hanbury Manor Golf Club', rounds: 223, views: 1, gaps: ['Location'] },
  { id: 'b', name: 'Farleigh Golf Club', rounds: 86, views: 6, gaps: ['Location', 'Tee data'] },
];

beforeEach(() => {
  data = {
    courses_played: 365,
    coverage: { photo: 87, tee: 60, location: 26 },
    gap_counts: { location: 270, tee: 47, description: 0, photo: 0 },
    fix_next: rows,
  };
});

describe('CONTENT_V3_2 Courses tab', () => {
  it('orders the sections Where members play, Directory, chips, Fix next', () => {
    const { container } = render(<CoursesSection {...base} />);
    const order = Array.from(container.querySelectorAll('[data-section]')).map((e) => e.getAttribute('data-section'));
    expect(order).toEqual(['coverage', 'directory', 'gaps', 'fix-next']);
  });

  it('marks coverage values ink at 87, mute at 60 and bad at 26', () => {
    render(<CoursesSection {...base} />);
    expect(screen.getByText('87%').getAttribute('data-tone')).toBe('ink');
    expect(screen.getByText('60%').getAttribute('data-tone')).toBe('mute');
    expect(screen.getByText('26%').getAttribute('data-tone')).toBe('bad');
  });

  it('shows gap counts, dims zero chips and falls back to fix_next length for All gaps', () => {
    render(<CoursesSection {...base} />);
    expect(screen.getByRole('button', { name: 'Location 270' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tee data 47' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Description 0' }) as HTMLElement).style.opacity).toBe('0.45');
    expect((screen.getByRole('button', { name: 'Photo 0' }) as HTMLElement).style.opacity).toBe('0.45');
    expect(screen.getByRole('button', { name: 'All gaps 2' })).toBeTruthy();
  });

  it('reads 500+ for All gaps at exactly 500 rows without a total key', () => {
    data.fix_next = Array.from({ length: 500 }, (_, i) => ({ id: `c${i}`, name: `Course ${i}`, rounds: 1, views: 0, gaps: ['Photo'] }));
    render(<CoursesSection {...base} />);
    expect(screen.getByRole('button', { name: 'All gaps 500+' })).toBeTruthy();
  });

  it('a Fix next row is one button calling onFix with its id, with no separate Fix button', () => {
    const onFix = vi.fn();
    render(<CoursesSection {...base} onFix={onFix} />);
    expect(screen.queryByRole('button', { name: 'Fix' })).toBeNull();
    fireEvent.click(screen.getByText('Farleigh Golf Club').closest('button')!);
    expect(onFix).toHaveBeenCalledWith('b');
  });

  it('pluralises views by count', () => {
    render(<CoursesSection {...base} />);
    expect(screen.getByText('1 view in 30d')).toBeTruthy();
    expect(screen.getByText('6 views in 30d')).toBeTruthy();
  });

  it('on the Location chip rows omit the Location chip but keep Tee data', () => {
    render(<CoursesSection {...base} />);
    fireEvent.click(screen.getByRole('button', { name: 'Location 270' }));
    const row = screen.getByText('Farleigh Golf Club').closest('button')!;
    expect(within(row).queryByText('Location')).toBeNull();
    expect(within(row).getByText('Tee data')).toBeTruthy();
  });

  it('source has no heavy weights, tiny sizes, amber or ellipsis', () => {
    const src = readFileSync(resolve(__dirname, '../features/admin/components/content/CoursesSection.tsx'), 'utf8');
    for (const m of src.matchAll(/fontWeight:\s*(\d+)/g)) expect(Number(m[1])).toBeLessThanOrEqual(700);
    for (const m of src.matchAll(/fontSize:\s*([\d.]+)/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(10);
    for (const bad of ['warnText', 't.warn', 'brandText', 'brandSoft', "chip('warn')", 'ellipsis', 't.brand']) expect(src).not.toContain(bad);
  });

  it('reads the Directory caption without a search term', () => {
    render(<CoursesSection {...base} />);
    expect(screen.getByText('The full A to Z list opens from search.')).toBeTruthy();
  });
});
