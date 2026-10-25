import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { TheArgumentSection } from '../TheArgumentSection';
import type { ArgumentRow } from '../theArgument';

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
