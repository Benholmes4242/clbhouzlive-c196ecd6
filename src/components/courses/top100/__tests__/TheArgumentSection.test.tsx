import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { TheArgumentSection } from '../TheArgumentSection';
import type { ArgumentRow } from '../theArgument';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const row = (over: Partial<ArgumentRow>): ArgumentRow => ({
  id: 'c1',
  name: 'Course One',
  imageUrl: null,
  publishedRank: 1,
  rating: 8,
  ratingCount: 5,
  memberRank: 1,
  listRank: 1,
  divergence: 1,
  ...over,
});

const renderSection = (props: Partial<React.ComponentProps<typeof TheArgumentSection>> = {}) =>
  render(
    <TheArgumentSection
      higher={[]}
      lower={[]}
      qualifying={7}
      showGolfersLink
      onSeeGolfersList={vi.fn()}
      {...props}
    />,
  );

afterEach(cleanup);

describe('TheArgumentSection', () => {
  it('a riser reads "Golfers rank it 2nd versus 11th on the official list" with an up arrow and 9', () => {
    const { container } = renderSection({ higher: [row({ memberRank: 2, listRank: 11, divergence: 9 })] });
    expect(
      screen.getByText((_, el) => el?.textContent === 'Golfers rank it 2nd versus 11th on the official list'),
    ).toBeInTheDocument();
    expect(container.querySelector('.lucide-arrow-up')).not.toBeNull();
    expect(container.querySelector('.lucide-arrow-down')).toBeNull();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('a faller reads "Golfers rank it 11th versus 2nd on the official list" with a down arrow and 9', () => {
    const { container } = renderSection({ lower: [row({ memberRank: 11, listRank: 2, divergence: -9 })] });
    expect(
      screen.getByText((_, el) => el?.textContent === 'Golfers rank it 11th versus 2nd on the official list'),
    ).toBeInTheDocument();
    expect(container.querySelector('.lucide-arrow-down')).not.toBeNull();
    expect(container.querySelector('.lucide-arrow-up')).toBeNull();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('the lede prints the qualifying count', () => {
    renderSection({ higher: [row({})], qualifying: 14 });
    expect(
      screen.getByText(/Positions are out of the 14 courses on this list that golfers have rated\./),
    ).toBeInTheDocument();
  });

  it('a group with no rows renders no head', () => {
    renderSection({ higher: [row({})], lower: [] });
    expect(screen.getByText('Golfers rate higher')).toBeInTheDocument();
    expect(screen.queryByText('Golfers rate lower')).toBeNull();
  });

  it('renders nothing when both groups are empty', () => {
    const { container } = renderSection({ higher: [], lower: [] });
    expect(container.firstChild).toBeNull();
  });

  it('the golfers-link button shows only when showGolfersLink and calls onSeeGolfersList', () => {
    const onSeeGolfersList = vi.fn();
    const { unmount } = renderSection({ higher: [row({})], showGolfersLink: true, onSeeGolfersList });
    screen.getByRole('button', { name: /See the golfers' list/ }).click();
    expect(onSeeGolfersList).toHaveBeenCalledTimes(1);
    unmount();
    renderSection({ higher: [row({})], showGolfersLink: false });
    expect(screen.queryByRole('button', { name: /See the golfers' list/ })).toBeNull();
  });
});

/* BRIEF_TOP100_MONTHLY_MOVE — the four-week trend line under each arrow. */
describe('TheArgumentSection — monthly move', () => {
  it('an empty baseline renders no trend line (today’s output)', () => {
    renderSection({ higher: [row({ memberRank: 2, listRank: 11, divergence: 9 })], baseline: new Map() });
    expect(screen.queryByText(/this month/)).toBeNull();
    expect(screen.queryByText('No change')).toBeNull();
  });

  it('no baseline prop at all renders no trend line', () => {
    renderSection({ higher: [row({})] });
    expect(screen.queryByText(/this month/)).toBeNull();
    expect(screen.queryByText('No change')).toBeNull();
  });

  it('baseline 5 against memberRank 2 reads "↑3 this month" in green', () => {
    renderSection({ higher: [row({ id: 'c1', memberRank: 2, listRank: 11, divergence: 9 })], baseline: new Map([['c1', 5]]) });
    const trend = screen.getByText('↑3 this month');
    expect(trend).toHaveStyle({ color: A.GREEN });
  });

  it('baseline 8 against memberRank 11 reads "↓3 this month" in red', () => {
    renderSection({ lower: [row({ id: 'c1', memberRank: 11, listRank: 2, divergence: -9 })], baseline: new Map([['c1', 8]]) });
    const trend = screen.getByText('↓3 this month');
    expect(trend).toHaveStyle({ color: A.RED });
  });

  it('a baseline equal to the member rank reads "No change" in dim', () => {
    renderSection({ higher: [row({ id: 'c1', memberRank: 2, listRank: 11, divergence: 9 })], baseline: new Map([['c1', 2]]) });
    const trend = screen.getByText('No change');
    expect(trend).toHaveStyle({ color: A.DIM });
  });

  it('a course missing from the baseline shows nothing', () => {
    renderSection({ higher: [row({ id: 'c1', memberRank: 2, listRank: 11, divergence: 9 })], baseline: new Map([['other', 5]]) });
    expect(screen.queryByText(/this month/)).toBeNull();
    expect(screen.queryByText('No change')).toBeNull();
  });

  it('a long course name with a trend line keeps the delta fully visible (right column not clipped)', () => {
    const { container } = renderSection({
      higher: [row({ id: 'c1', name: 'Royal County Down (Championship)', memberRank: 2, listRank: 11, divergence: 9 })],
      baseline: new Map([['c1', 5]]),
    });
    const trend = screen.getByText('↑3 this month');
    const rightColumn = trend.parentElement as HTMLElement;
    expect(rightColumn).toHaveStyle({ flexShrink: '0', textAlign: 'right' });
    // The delta is the right column's first child and stays on screen.
    const delta = rightColumn.firstElementChild as HTMLElement;
    expect(delta.textContent).toBe('9');
    // The rows container is a single minmax(0, 1fr) grid so the name ellipsises
    // instead of pushing the right column off the edge.
    const rows = container.querySelector('section')?.querySelectorAll('div[style*="grid-template-columns"]');
    expect(rows?.length).toBeGreaterThan(0);
  });
});
