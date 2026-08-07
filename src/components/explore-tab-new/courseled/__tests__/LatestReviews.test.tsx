import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_k: string, d?: unknown) =>
      typeof d === 'string' ? d : ((d as { defaultValue?: string })?.defaultValue ?? _k),
  }),
}));

import { LatestReviews } from '@/components/explore-tab-new/courseled/LatestReviews';
import { REVIEW_TILE_HEIGHT } from '@/components/explore-tab-new/courseled/ReviewTile';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';

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
    const tiles = screen.getAllByRole('button').filter((b) => b.style.height);
    expect(tiles).toHaveLength(4);
    for (const tile of tiles) expect(tile.style.height).toBe(`${REVIEW_TILE_HEIGHT}px`);
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
});
