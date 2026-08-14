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
import { REVIEW_TILE_HEIGHT } from '@/components/explore-tab-new/courseled/ReviewTile';
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

describe('LatestReviews mosaic', () => {
  it('renders nothing with no qualifying reviews', () => {
    const { container } = render(
      <LatestReviews reviews={[]} onTilePress={() => {}} onSeeAll={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('caps the page at four tiles of identical height', () => {
    const reviews = Array.from({ length: 9 }, (_, i) => make(i));
    render(<LatestReviews reviews={reviews} totalCount={9} onTilePress={() => {}} onSeeAll={() => {}} />);
    const photos = screen.getAllByTestId('review-tile-photo');
    expect(photos).toHaveLength(4);
    for (const photo of photos) expect(photo.style.height).toBe(`${REVIEW_TILE_HEIGHT}px`);
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
          make(1, { rating: 4.2, breakdown: { design: 9.4, conditions: 6.1, clubhouse: 4.2, facilities: null } }),
        ]}
        onTilePress={() => {}}
        onSeeAll={() => {}}
      />,
    );
    const html = screen.getByTestId('review-tile-breakdown').innerHTML;
    expect(html).toContain(BAND_GREEN);
    expect(html).toContain(BAND_AMBER);
    expect(html).toContain(BAND_RED);
  });
});
