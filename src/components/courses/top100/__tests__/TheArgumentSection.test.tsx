import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

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
      ratedCount={19}
      onOpenCourse={vi.fn()}
      {...props}

    />,
  );

afterEach(cleanup);

describe('TheArgumentSection', () => {
  it('a riser reads "Golfers rank it 2nd of the 19 rated" with an up arrow and 9', () => {
    const { container } = renderSection({ higher: [row({ memberRank: 2, listRank: 11, divergence: 9 })] });
    expect(
      screen.getByText((_, el) => el?.textContent === 'Golfers rank it 2nd of the 19 rated'),
    ).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === 'Officially ranked 1st')).toBeInTheDocument();
    expect(container.querySelector('.lucide-arrow-up')).not.toBeNull();
    expect(container.querySelector('.lucide-arrow-down')).toBeNull();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('a faller reads "Golfers rank it 11th of the 19 rated" with a down arrow and 9', () => {
    const { container } = renderSection({ lower: [row({ memberRank: 11, listRank: 2, divergence: -9 })] });
    expect(
      screen.getByText((_, el) => el?.textContent === 'Golfers rank it 11th of the 19 rated'),
    ).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === 'Officially ranked 1st')).toBeInTheDocument();
    expect(container.querySelector('.lucide-arrow-down')).not.toBeNull();
    expect(container.querySelector('.lucide-arrow-up')).toBeNull();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('the lede is one sentence and prints no qualifying count', () => {
    const { container } = renderSection({ higher: [row({})] });
    expect(
      screen.getByText("The courses that vary the most between the golfers' ratings and the official rankings."),
    ).toBeInTheDocument();
    expect(container.textContent).not.toContain('19 courses');
    expect(container.textContent).not.toContain('courses on this list');
  });

  it('group labels are eyebrows with no coloured dot', () => {
    renderSection({
      higher: [row({})],
      lower: [row({ id: 'c2', memberRank: 5, listRank: 2, divergence: -3 })],
    });
    for (const label of ['Golfers rate higher', 'Golfers rate lower']) {
      const el = screen.getByText(label);
      expect(el).toHaveStyle({
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: A.MUTE,
      });
      // The dot element is gone: the label holds its text and nothing else.
      expect(el.children).toHaveLength(0);
      expect(el.querySelector('span')).toBeNull();
    }
    // Spacing kept: 18 before each group, 10 before its rows.
    const group = screen.getByText('Golfers rate higher').parentElement as HTMLElement;
    expect(group).toHaveStyle({ marginTop: '18px' });
    const rows = group.querySelector('div[style*="grid-template-columns"]') as HTMLElement;
    expect(rows).toHaveStyle({ marginTop: '10px' });
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

  it('renders no golfers-list link', () => {
    const { container } = renderSection({
      higher: [row({})],
      lower: [row({ id: 'c2', memberRank: 5, listRank: 2, divergence: -3 })],
    });
    expect(container.textContent).not.toContain("See the golfers' list");
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

/* BRIEF_TOP100_OFFICIAL_RANK_AND_TAP */
describe('TheArgumentSection — official ranks and taps', () => {
  it('prints published rank 71, never listRank as an official rank', () => {
    renderSection({ higher: [row({ publishedRank: 71, listRank: 15, memberRank: 7, divergence: 8 })] });
    expect(screen.getByText((_, el) => el?.textContent === 'Officially ranked 71st')).toBeInTheDocument();
    expect(screen.queryByText(/15th/)).toBeNull();
  });

  it('uses the supplied rated count of 12', () => {
    renderSection({ higher: [row({ memberRank: 2 })], ratedCount: 12 });
    expect(screen.getByText((_, el) => el?.textContent === 'Golfers rank it 2nd of the 12 rated')).toBeInTheDocument();
  });

  it('tapping a row opens its course id', () => {
    const onOpenCourse = vi.fn();
    renderSection({ higher: [row({ id: 'queenwood', name: 'Queenwood' })], onOpenCourse });
    fireEvent.click(screen.getByRole('button', { name: 'Queenwood, open course' }));
    expect(onOpenCourse).toHaveBeenCalledExactlyOnceWith('queenwood');
  });

  it('every row is a named course button', () => {
    renderSection({ higher: [row({})], lower: [row({ id: 'c2', name: 'Course Two', divergence: -1 })] });
    expect(screen.getAllByRole('button')).toHaveLength(2);
    for (const name of ['Course One', 'Course Two']) {
      expect(screen.getByRole('button', { name: `${name}, open course` })).toHaveAttribute('type', 'button');
    }
  });

  it('each course button has an aria-hidden chevron', () => {
    renderSection({ higher: [row({})] });
    const chevron = screen.getByRole('button').querySelector('.lucide-chevron-right');
    expect(chevron).toHaveAttribute('aria-hidden', 'true');
    expect(chevron).toHaveAttribute('width', '14');
    expect(chevron).toHaveAttribute('stroke-width', '2.5');
  });
});
