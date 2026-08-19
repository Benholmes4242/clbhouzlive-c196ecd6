import { describe, it, expect, vi } from 'vitest';
import { render as rtlRender, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_k: string, d?: unknown) =>
      typeof d === 'string' ? d : ((d as { defaultValue?: string })?.defaultValue ?? _k),
  }),
}));

import { LatestReviews } from '@/components/explore-tab-new/courseled/LatestReviews';
import { REVIEW_TILE_HEIGHT, REVIEW_TILE_FEATURED_HEIGHT } from '@/components/explore-tab-new/courseled/ReviewTile';
import { BAND_GREEN, BAND_AMBER, BAND_RED } from '@/features/courses/_shared/scoreBands';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';

/** The mosaic reads reactions through React Query; the tree needs a client. */
function render(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return rtlRender(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function make(i: number, over: Partial<LatestReview> = {}): LatestReview {
  return {
    reviewId: `r${i}`,
    courseId: `c${i}`,
    courseName: `Course ${i}`,
    courseImage: 'https://example.com/course.jpg',
    rating: 8.4,
    quote: `Quote number ${i}`,
    at: new Date().toISOString(),
    userId: `u${i}`,
    reviewerName: `Member ${i}`,
    reviewerUsername: null,
    reviewerAvatar: null,
    mediaUrl: null,
    mediaType: null,
    posterUrl: null,
    courseCountry: null,
    courseRegion: null,
    courseSubCountry: null,
    breakdown: { design: null, conditions: null, clubhouse: null, facilities: null },
    ...over,
  };
}

const featuredBreakdown = { design: 9.1, conditions: 9.2, clubhouse: 9.3, facilities: 9.4 };

function makeFeatured(i: number, over: Partial<LatestReview> = {}): LatestReview {
  return make(i, { rating: 9.5, breakdown: featuredBreakdown, ...over });
}

function makeCompact(i: number, over: Partial<LatestReview> = {}): LatestReview {
  return make(i, { rating: 7.5, ...over });
}

function makeBars(i: number, over: Partial<LatestReview> = {}): LatestReview {
  return make(i, { rating: 9.0, breakdown: { design: 8.5, conditions: null, clubhouse: null, facilities: null }, ...over });
}

describe('LatestReviews mosaic', () => {
  it('renders nothing with no qualifying reviews', () => {
    const { container } = render(
      <LatestReviews reviews={[]} onTilePress={() => {}} onSeeAll={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a featured tile plus two grid tiles when a featured review exists', () => {
    const reviews = [makeFeatured(0), makeCompact(1), makeCompact(2), makeCompact(3)];
    render(<LatestReviews reviews={reviews} totalCount={4} onTilePress={() => {}} onSeeAll={() => {}} />);
    const photos = screen.getAllByTestId('review-tile-photo');
    expect(photos).toHaveLength(3);
    const grid = screen.getByTestId('latest-reviews-grid');
    expect(grid.children).toHaveLength(2);
    expect(screen.getByText('Quote number 0')).toBeTruthy();
  });

  it('renders two grid tiles when no featured review qualifies', () => {
    const reviews = [makeCompact(0), makeBars(1), makeCompact(2)];
    render(<LatestReviews reviews={reviews} totalCount={3} onTilePress={() => {}} onSeeAll={() => {}} />);
    const photos = screen.getAllByTestId('review-tile-photo');
    expect(photos).toHaveLength(2);
    const grid = screen.getByTestId('latest-reviews-grid');
    expect(grid.children).toHaveLength(2);
  });

  it('still lifts a featured review sitting third or fourth newest', () => {
    // A featured review at index 2 must be found even though the search pool is wider than the grid.
    const reviews = [
      makeCompact(0),
      makeCompact(1),
      makeFeatured(2, { quote: 'Featured at three' }),
      makeCompact(3),
      makeCompact(4),
    ];
    render(<LatestReviews reviews={reviews} totalCount={5} onTilePress={() => {}} onSeeAll={() => {}} />);
    const photos = screen.getAllByTestId('review-tile-photo');
    expect(photos).toHaveLength(3);
    expect(screen.getByText('Featured at three')).toBeTruthy();
    const grid = screen.getByTestId('latest-reviews-grid');
    expect(grid.children).toHaveLength(2);
  });

  it('renders a single left-aligned tile without stretching it across the grid', () => {
    const reviews = [makeCompact(0, { courseName: 'Solo course' })];
    render(<LatestReviews reviews={reviews} onTilePress={() => {}} onSeeAll={() => {}} />);
    const photos = screen.getAllByTestId('review-tile-photo');
    expect(photos).toHaveLength(1);
    const grid = screen.getByTestId('latest-reviews-grid');
    expect(grid.children).toHaveLength(1);
    expect(grid.style.gridTemplateColumns).toBe('1fr 1fr');
  });

  it('keeps all rendered grid tiles at the same height', () => {
    const reviews = [makeBars(0), makeBars(1), makeCompact(2)];
    render(<LatestReviews reviews={reviews} totalCount={3} onTilePress={() => {}} onSeeAll={() => {}} />);
    const photos = screen.getAllByTestId('review-tile-photo');
    for (const photo of photos) expect(photo.style.height).toBe(`${REVIEW_TILE_HEIGHT}px`);
  });

  it('renders the featured tile at its taller height', () => {
    const reviews = [makeFeatured(0), makeCompact(1), makeCompact(2)];
    render(<LatestReviews reviews={reviews} totalCount={3} onTilePress={() => {}} onSeeAll={() => {}} />);
    const photos = screen.getAllByTestId('review-tile-photo');
    // The featured tile is full-width and taller; the two grid tiles stay at the standard height.
    expect(photos[0].style.height).toBe(`${REVIEW_TILE_FEATURED_HEIGHT}px`);
    expect(photos[1].style.height).toBe(`${REVIEW_TILE_HEIGHT}px`);
    expect(photos[2].style.height).toBe(`${REVIEW_TILE_HEIGHT}px`);
  });

  it('renders the viewing member name in on-dark amber', () => {
    render(
      <LatestReviews
        reviews={[make(1, { userId: 'me', reviewerName: 'Ben' })]}
        viewerId="me"
        onTilePress={() => {}}
        onSeeAll={() => {}}
      />,
    );
    const own = screen.getByText('Ben');
    expect(own.getAttribute('style')).toContain('255, 178, 94');
  });

  it('renders one breakdown row per scored category', () => {
    render(
      <LatestReviews
        reviews={[
          make(1, {
            breakdown: { design: 9.1, conditions: 7.2, clubhouse: 5.5, facilities: 8.8 },
          }),
        ]}
        onTilePress={() => {}}
        onSeeAll={() => {}}
      />,
    );
    const block = screen.getByTestId('review-tile-breakdown');
    expect(block.children).toHaveLength(4);
    expect(screen.getByText('5.5')).toBeTruthy();
  });

  it('renders only the scored rows when some categories are null', () => {
    render(
      <LatestReviews
        reviews={[
          make(1, {
            breakdown: { design: 8.0, conditions: null, clubhouse: null, facilities: 6.4 },
          }),
        ]}
        onTilePress={() => {}}
        onSeeAll={() => {}}
      />,
    );
    expect(screen.getByTestId('review-tile-breakdown').children).toHaveLength(2);
  });

  it('renders no breakdown block at all when no category is scored', () => {
    render(
      <LatestReviews
        reviews={[make(1)]}
        onTilePress={() => {}}
        onSeeAll={() => {}}
      />,
    );
    expect(screen.queryByTestId('review-tile-breakdown')).toBeNull();
  });

  it('tints bars with the app-wide score bands, not a local scale', () => {
    render(
      <LatestReviews
        reviews={[
          // A bars review (overall >= 9 but not every scored category >= 9) renders the coloured tracks.
          make(1, { rating: 9.0, breakdown: { design: 9.4, conditions: 6.1, clubhouse: 4.2, facilities: null } }),
        ]}
        onTilePress={() => {}}
        onSeeAll={() => {}}
      />,
    );
    const html = screen.getByTestId('review-tile-breakdown').innerHTML;
    // jsdom serialises inline colours as rgb(); assert the band values.
    const rgb = (hex: string) =>
      `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
    expect(html).toContain(rgb(BAND_GREEN));
    expect(html).toContain(rgb(BAND_AMBER));
    expect(html).toContain(rgb(BAND_RED));
  });
});
