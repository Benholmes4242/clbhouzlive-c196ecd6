/** Guard tests: the liked-by line collapses at zero on feed cards and opens
    with a 180ms grid-rows/opacity animation; the three fixed-layout sheets
    keep the reserve. */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// No react-i18next mock: ExploreCard reads i18n.language, as in exploreRoundTileLikedByNoBubble.test.tsx.
vi.mock('@/hooks/usePostLikers', () => ({
  usePostLikers: () => ({ likers: [], isLoading: true }),
  likerFirstNames: () => [],
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' } }) }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
vi.mock('@/components/likes/LikesSheet', () => ({ LikesSheet: () => null }));

import { LikedByRow } from '@/components/likes/LikedByRow';
import { ExploreCard, type RoundCardEngagement } from '@/features/explore-magazine/ExploreCard';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

afterEach(cleanup);

const row = (c: HTMLElement) => c.querySelector('[data-liked-by-row]') as HTMLElement | null;

describe('LikedByRow open/collapse animation', () => {
  it('first render with count > 0 renders the row with no transition', () => {
    const v = render(<LikedByRow postId="p1" count={1} />);
    const el = row(v.container)!;
    expect(el).not.toBeNull();
    expect(el.style.transition).toBe('');
    expect(el.style.gridTemplateRows).toBe('1fr');
  });

  it('count 0→1 after mount opens with the grid-template-rows transition', () => {
    const v = render(<LikedByRow postId="p1" count={0} />);
    expect(row(v.container)).toBeNull();
    v.rerender(<LikedByRow postId="p1" count={1} />);
    const el = row(v.container)!;
    expect(el).not.toBeNull();
    expect(el.style.transition).toContain('grid-template-rows 180ms ease-out');
    expect(el.style.transition).toContain('opacity 180ms ease-out');
    expect(el.style.gridTemplateRows).toBe('1fr');
    expect(el.style.opacity).toBe('1');
  });

  it('an unlike collapses the row the same way, then unmounts it', () => {
    vi.useFakeTimers();
    try {
      const v = render(<LikedByRow postId="p1" count={1} />);
      v.rerender(<LikedByRow postId="p1" count={0} />);
      const el = row(v.container)!;
      expect(el).not.toBeNull();
      expect(el.style.transition).toContain('grid-template-rows 180ms ease-out');
      expect(el.style.gridTemplateRows).toBe('0fr');
      expect(el.style.opacity).toBe('0');
      act(() => { vi.advanceTimersByTime(200); });
      expect(row(v.container)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('prefers-reduced-motion opens and collapses with no transition', () => {
    const mm = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    try {
      const v = render(<LikedByRow postId="p1" count={0} />);
      v.rerender(<LikedByRow postId="p1" count={1} />);
      const el = row(v.container)!;
      expect(el).not.toBeNull();
      expect(el.style.transition).toBe('');
      v.rerender(<LikedByRow postId="p1" count={0} />);
      expect(row(v.container)).toBeNull();
    } finally {
      window.matchMedia = mm;
    }
  });
});

const item: StreamItem = {
  id: 'round:score-1', kind: 'round', ring: 'own', lane: 'news', score: 1,
  consequence: null,
  subject: { course_id: null, course_name: 'Test Course', region: null, sub_country: null, image_url: null, pending: false },
  who: { user_id: 'player', display_name: 'Ben', photo_url: null, is_viewer: false },
  facts: { score_id: 'score-1', gross: 80, to_par: 8, net: 76, course_par: 72, course_handicap: 4, play_date: '2026-09-15' },
  payload: {}, seen: false,
};
const engagement = (likeCount: number): RoundCardEngagement => ({
  likeCount, liked: likeCount > 0, likeAvailable: true, commentCount: 0, commentAvailable: true,
  onToggleLike: vi.fn(), onOpenComments: vi.fn(), reactionSubjectId: 'score-1',
});

describe('ExploreCard feed cards collapse the liked-by line at zero', () => {
  it('likeCount 0 renders no reactions row and no reserved space', () => {
    const v = render(<ExploreCard item={item} size="std" feedPlot onTap={() => {}} engagement={engagement(0)} />);
    expect(v.container.querySelector('[data-round-reactions-row]')).toBeNull();
    expect(v.container.querySelector('[data-liked-by-reserve]')).toBeNull();
    expect(row(v.container)).toBeNull();
  });
  it('likeCount 3 renders the row', () => {
    const v = render(<ExploreCard item={item} size="std" feedPlot onTap={() => {}} engagement={engagement(3)} />);
    expect(v.container.querySelector('[data-round-reactions-row]')).not.toBeNull();
    expect(row(v.container)).not.toBeNull();
  });
});

describe('the fixed-layout sheets keep the reserve at zero', () => {
  const read = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');
  it.each([
    'components/fullscreen-feed/ImmersiveFullscreenChrome.tsx',
    'components/posts/ReviewBottomSheet.tsx',
    'features/courses/_shared/scorecard/CardScorecardSheet.tsx',
  ])('%s still passes reserve to LikedByRow', (p) => {
    expect(read(p)).toMatch(/LikedByRow[\s\S]{0,600}?\breserve\b/);
  });
  it('reserve at count 0 still renders the reserved box', () => {
    const v = render(<LikedByRow postId="p1" count={0} reserve />);
    expect(v.container.querySelector('[data-liked-by-reserve]')).not.toBeNull();
  });
});
