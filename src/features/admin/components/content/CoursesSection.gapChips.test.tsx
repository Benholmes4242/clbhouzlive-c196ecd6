/**
 * BRIEF_CONTENT_DESK Stage 3 — fix_next[].gaps carry the display words
 * ("Tee data"), while the chips are keyed by the gap_counts names ("tee").
 * A row must therefore surface under exactly one gap chip.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../hooks/useContentDesk', () => ({
  isPermissionError: () => false,
  useCourseCoverage: () => ({
    data: {
      courses_played: 12,
      coverage: { photo: 80, tee: 40 },
      fix_next: [{ id: 'c1', name: 'Royal St George’s', rounds: 40, views: 120, gaps: ['Tee data'] }],
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

import CoursesSection from './CoursesSection';

const noop = () => {};
const props = {
  stats: { total: 100, geocoded: 90, missingPhoto: 10, top100: 12 },
  search: '',
  onSearch: noop,
  results: [],
  resultsTotal: 0,
  page: 1,
  pageSize: 20,
  onPage: noop,
  searching: false,
  onFix: noop,
  onAdd: noop,
};

describe('Fix next gap chips', () => {
  it('a row whose gaps are ["Tee data"] shows under Tee data and no other chip', () => {
    render(<CoursesSection {...props} />);
    const seen: Record<string, boolean> = {};
    for (const label of ['All gaps', 'Location', 'Description', 'Tee data', 'Photo']) {
      fireEvent.click(screen.getByRole('button', { name: label }));
      seen[label] = screen.queryByText('Royal St George’s') != null;
    }
    expect(seen).toEqual({ 'All gaps': true, Location: false, Description: false, 'Tee data': true, Photo: false });
  });
});
