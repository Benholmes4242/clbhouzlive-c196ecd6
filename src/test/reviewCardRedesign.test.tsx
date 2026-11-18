import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReviewMediaItem } from '@/components/posts/useReviewMedia';

const fx = vi.hoisted(() => ({
  top100: { mode: 'member' as 'member' | 'none' | 'error' | 'pending' },
  likers: [] as Array<{ userId: string; actorId?: string; displayName: string; username: string; avatarUrl: null; isViewer?: boolean }>,
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: { coursesRated: 14, averageRating: 8.1, memberSince: null } }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: undefined }) }));
vi.mock('@/components/posts/useReviewMedia', () => ({ useReviewMedia: () => ({ data: [] }) }));
vi.mock('@/components/posts/useReviewPost', () => ({ useReviewPost: () => ({ data: undefined }) }));
vi.mock('@/hooks/useReviewFallback', () => ({ useReviewFallback: () => ({ data: null }) }));
vi.mock('@/features/comments-v2/CommentsSheetV2', () => ({ CommentsSheetV2: () => null }));
vi.mock('@/components/likes/LikesSheet', () => ({ LikesSheet: () => null }));
vi.mock('@/hooks/usePostLikers', async (orig) => ({ ...(await orig<typeof import('@/hooks/usePostLikers')>()), usePostLikers: () => ({ likers: fx.likers, isLoading: false }) }));
vi.mock('@/integrations/supabase/client', () => {
  const chain = () => {
    const c: Record<string, unknown> = {};
    c.select = () => c;
    c.eq = (col: string) => {
      if (col !== 'top100_lists.is_active') return c;
      if (fx.top100.mode === 'pending') return new Promise(() => {});
      if (fx.top100.mode === 'error') return Promise.resolve({ data: null, error: { message: 'boom' } });
      return Promise.resolve({ data: fx.top100.mode === 'member' ? [{ course_id: 'course', top100_lists: { slug: 'gb-i', is_active: true } }] : [], error: null });
    };
    return c;
  };
  return { supabase: { from: () => chain(), rpc: () => Promise.resolve({ data: [], error: null }), auth: { getSession: () => Promise.resolve({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) } } };
});

import { ReviewBottomSheet } from '@/components/posts/ReviewBottomSheet';

function Loc() { return <output data-testid="loc">{useLocation().pathname}</output>; }
function sheet(extra: Partial<React.ComponentProps<typeof ReviewBottomSheet>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter><QueryClientProvider client={client}>
      <ReviewBottomSheet isOpen onClose={() => {}} user={{ id: 'member', name: 'James Carter', username: 'james' }} courseId="course" courseName="Swinley Forest Golf Club" courseCountry="England" rating={9.2} reviewId="review" resolvedReviewText="Text" resolvedMedia={[]} resolvedAggregate={{ avg_overall_score: 8.8, review_count: 23 }} onToggleReaction={() => {}} reactionCount={0} commentCount={0} {...extra} />
      <Loc />
    </QueryClientProvider></MemoryRouter>,
  );
}
const q = (s: string) => document.body.querySelector(s);
afterEach(() => { cleanup(); fx.top100.mode = 'member'; fx.likers = []; });

describe('review card redesign', () => {
  it('(a) has no doors; the reviewer row is one button that opens the profile', () => {
    sheet();
    expect(q('[data-sheet-doors]')).toBeNull();
    const row = q('[data-review-player-row]') as HTMLElement;
    expect(row.tagName).toBe('BUTTON');
    expect(row.getAttribute('aria-label')).toBe("View James Carter's profile");
    fireEvent.click(row);
    expect(screen.getByTestId('loc').textContent).not.toBe('/');
  });

  it('(b) the comparison is a single <p> with above/below grammar', () => {
    sheet();
    const cal = document.body.querySelectorAll('[data-review-calibration]');
    expect(cal.length).toBe(1);
    expect(cal[0].tagName).toBe('P');
    expect(cal[0].textContent).toBe("1.1 above James's usual 8.1 \u00b7 0.4 above the course's 8.8 from 23 ratings");
  });

  it('(c) footer renders like, comment, share in order with no reserve or comment preview', () => {
    sheet({ commentPreview: { id: 'c', body: 'Nice', authorName: 'Tom' } as never, commentCount: 2 });
    const foot = q('[data-review-engagement]')!;
    const order = Array.from(foot.querySelectorAll('[data-footer-action], [data-review-share]')).map((n) => n.getAttribute('data-footer-action') ?? 'share');
    expect(order).toEqual(['like', 'comment', 'share']);
    expect(q('[data-liked-by-reserve]')).toBeNull();
    expect(q('[data-feed-comment-preview]')).toBeNull();
    expect(foot.textContent).not.toContain('Nice');
  });

  it('(d) nothing on the right at zero likes; three faces and "and 3 others" at four', () => {
    sheet();
    expect(q('[data-liked-by-stack]')).toBeNull();
    cleanup();
    fx.likers = ['Tom', 'Dan', 'Oli', 'Sam'].map((n) => ({ userId: n, displayName: `${n} X`, username: n, avatarUrl: null }));
    sheet({ reactionCount: 4 });
    const stack = q('[data-liked-by-stack]')!;
    expect(stack.querySelectorAll('[data-liked-stack-face]').length).toBe(3);
    expect(stack.querySelector('[data-liked-stack-long]')?.textContent).toBe('Tom and 3 others');
    expect(stack.querySelector('[data-liked-stack-short]')?.textContent).toBe('+3');
  });

  it('(e) at most six tiles, "+N" on the sixth, and a video tile keeps the derived poster', () => {
    const stream = '0123456789abcdef0123456789abcdef';
    const media: ReviewMediaItem[] = Array.from({ length: 8 }, (_, i) => i === 1
      ? { id: `m${i}`, mediaType: 'video', mediaUrl: 'https://example.com/v.mp4', posterUrl: null, streamId: stream, isCover: false, width: 1080, height: 1920 }
      : { id: `m${i}`, mediaType: 'image', mediaUrl: `https://example.com/${i}.jpg`, posterUrl: null, streamId: null, isCover: i === 0, width: 1080, height: 1080 });
    sheet({ resolvedMedia: media });
    const tiles = document.body.querySelectorAll('.review-photo-tile');
    expect(tiles.length).toBe(6);
    expect(tiles[5].querySelector('[data-review-media-overflow]')?.textContent).toBe('+2');
    const videoImg = tiles[1].querySelector('img');
    expect(videoImg?.getAttribute('src')).toContain(stream);
    expect(videoImg?.getAttribute('src')).not.toBe('https://example.com/v.mp4');
  });

  it('(f) TOP 100 stamp only when the membership read returns the course', async () => {
    fx.top100.mode = 'pending';
    sheet();
    expect(q('[data-review-top100]')).toBeNull();
    cleanup();
    fx.top100.mode = 'error';
    sheet();
    await new Promise((r) => setTimeout(r, 20));
    expect(q('[data-review-top100]')).toBeNull();
    cleanup();
    fx.top100.mode = 'none';
    sheet();
    await new Promise((r) => setTimeout(r, 20));
    expect(q('[data-review-top100]')).toBeNull();
  });

  it('(f) TOP 100 stamp renders for an active member course', async () => {
    fx.top100.mode = 'member';
    sheet();
    await waitFor(() => expect(q('[data-review-top100]')?.textContent).toBe('TOP 100'));
  });

  it('(g) the course name clamps to two lines', () => {
    sheet();
    const name = q('[data-review-sheet-course-name]') as HTMLElement;
    expect(name.style.webkitLineClamp || (name.style as unknown as Record<string, string>).WebkitLineClamp).toBe('2');
    expect(name.style.whiteSpace).not.toBe('nowrap');
  });

  it('the panel declares no font family', () => {
    const src = readFileSync(resolve(__dirname, '../components/posts/ReviewBottomSheet.tsx'), 'utf8');
    expect(src).not.toMatch(/fontFamily/);
  });
});
