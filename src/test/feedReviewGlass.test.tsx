import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import type { FeedPost } from '@/components/media-system/types/media';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({ read: vi.fn(), select: vi.fn(), eq: vi.fn(), from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: h.from } }));
vi.mock('@/features/pro-verification/InlineProMemberName', () => ({ InlineProMemberName: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
vi.mock('@/components/mentions/MentionText', () => ({ MentionText: ({ text }: { text: string }) => <>{text}</> }));

import { ReviewPostCard } from '@/components/feed/ReviewPostCard';
import { FeedReviewTop100Provider } from '@/hooks/feed/useTop100CourseIds';
const post = {
  id: 'p1', userId: 'u1', displayName: 'Member', createdAt: '2026-11-19T12:00:00Z', isReview: true,
  review: { reviewId: 'r1', courseId: 'c1', courseName: 'Camiral', courseRegion: 'Catalonia', courseSubCountry: 'Girona', courseCountry: 'Spain', rating: 8.5, reviewText: 'Review body', breakdown: { design: 8, conditions: 9, clubhouse: 8, facilities: 9 } },
} as FeedPost;
function card(p = post, media = true, layout: 'standard' | 'mediaFirst' = 'mediaFirst', onOpenCourse = vi.fn()) {
  return <ReviewPostCard post={p} layout={layout} articleRef={() => {}} onProfile={vi.fn()} onReadReview={vi.fn()} onPrefetch={vi.fn()} onOpenCourse={onOpenCourse}
    media={media ? <img alt="media" /> : null} footer={null} mediaFirstFooter={block => <div data-caption-slot>{block}</div>} />;
}
function tree(children: React.ReactNode) { return <MemoryRouter>{children}</MemoryRouter>; }
function batch(posts: FeedPost[], client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return <QueryClientProvider client={client}><MemoryRouter><FeedReviewTop100Provider posts={posts}>{posts.map(p => <React.Fragment key={p.id}>{card(p)}</React.Fragment>)}</FeedReviewTop100Provider></MemoryRouter></QueryClientProvider>;
}
function readWith(result: Promise<unknown>) {
  h.from.mockImplementation(() => ({ select: h.select }));
  h.select.mockImplementation(() => ({ eq: h.eq }));
  h.eq.mockImplementation(() => ({ in: h.read }));
  h.read.mockReturnValue(result);
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('feed review glass', () => {
  it('(a) media review keeps course, full region and shared tile scores below media; caption retains body and CTA', () => {
    const { container } = render(tree(card()));
    const strip = container.querySelector('[data-review-grid-scores]');
    expect(strip?.querySelector('[data-course-name-link]')).not.toBeNull();
    expect(strip?.querySelector('[data-review-region-line]')?.textContent).toBe('Catalonia, Spain');
    expect(strip?.querySelector('[data-review-score-row][data-variant="tile"]')).not.toBeNull();
    const caption = container.querySelector('[data-caption-slot]');
    expect(caption?.querySelector('[data-review-course], [data-review-score-row], [data-review-glass-region]')).toBeNull();
    expect(caption?.querySelector('[data-review-body]')?.textContent).toBe('Member Review body');
    expect(caption?.querySelector('[data-review-cta]')).not.toBeNull();
  });
  it('(a2) region falls back to subcountry then joins the country, de-duplicated', () => {
    for (const [courseRegion, courseSubCountry, expected] of [['', 'Girona', 'Girona, Spain'], ['', '', 'Spain'], ['Spain', '', 'Spain']]) {
      const { container, unmount } = render(tree(card({ ...post, review: { ...post.review, courseRegion, courseSubCountry } } as FeedPost)));
      expect(container.querySelector('[data-review-region-line]')?.textContent).toBe(expected); unmount();
    }
  });
  it('(b) no-media and standard reviews keep underneath scores and 700 course weight', () => {
    for (const [media, layout] of [[false, 'mediaFirst'], [true, 'standard']] as const) {
      const { container, unmount } = render(tree(card(post, media, layout)));
      expect(container.querySelector('[data-review-score-strip]')).toBeNull();
      expect(container.querySelector('[data-review-subject]')).not.toBeNull();
      expect(container.querySelector('[data-review-score-row]')).not.toBeNull();
      expect(container.querySelector<HTMLElement>('[data-review-course]')?.style.fontWeight).toBe('700'); unmount();
    }
  });
  it('(c) REVIEW exists in media, no-media and standard headers', () => {
    for (const [media, layout] of [[true, 'mediaFirst'], [false, 'mediaFirst'], [true, 'standard']] as const) {
      const { container, unmount } = render(tree(card(post, media, layout)));
      expect(container.querySelector('[data-review-who] [data-review-pill="review"]')).not.toBeNull(); unmount();
    }
  });
  it('(c2) several posts use one active-membership batch, stamps only active course and reuse per-course cache', async () => {
    readWith(Promise.resolve({ data: [{ course_id: 'c1', top100_lists: { slug: 'global', is_active: true } }, { course_id: 'c2', top100_lists: { slug: 'global', is_active: false } }], error: null }));
    const posts = [post, { ...post, id: 'p2', review: { ...post.review, courseId: 'c2' } } as FeedPost];
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container, rerender } = render(batch(posts, client));
    await waitFor(() => expect(container.querySelectorAll('[data-review-pill="top100"]')).toHaveLength(1));
    expect(h.from).toHaveBeenCalledWith('course_top100_memberships');
    expect(h.select).toHaveBeenCalledWith('course_id, top100_lists!inner(slug, is_active)');
    expect(h.eq).toHaveBeenCalledWith('top100_lists.is_active', true);
    expect(h.read).toHaveBeenCalledWith('course_id', ['c1', 'c2']);
    expect(h.read).toHaveBeenCalledTimes(1);
    rerender(batch([post], client));
    await waitFor(() => expect(container.querySelectorAll('[data-review-pill="top100"]')).toHaveLength(1));
    expect(h.read).toHaveBeenCalledTimes(1);
  });
  it('(c3) pending membership never stamps until settled', async () => {
    let resolve: (value: unknown) => void = () => {};
    readWith(new Promise(r => { resolve = r; }));
    const { container } = render(batch([post]));
    expect(container.querySelector('[data-review-pill="top100"]')).toBeNull();
    resolve({ data: [{ course_id: 'c1', top100_lists: { slug: 'global', is_active: true } }], error: null });
    await waitFor(() => expect(container.querySelector('[data-review-pill="top100"]')).not.toBeNull());
  });
  it('(c4) failed membership has no stamp', async () => {
    readWith(Promise.resolve({ data: null, error: new Error('failed') }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(batch([post], client));
    await waitFor(() => expect(client.getQueryState(['courses', 'feed-review-top100', ['c1']])?.status).toBe('error'));
    expect(container.querySelector('[data-review-pill="top100"]')).toBeNull();
  });
  it('(d) below-media block retains the canonical course door', () => {
    const open = vi.fn(); const { container } = render(tree(card(post, true, 'mediaFirst', open)));
    expect(container.querySelector('[data-review-grid-scores]')).not.toBeNull();
    const link = container.querySelector<HTMLElement>('[data-review-grid-scores] [data-course-name-link]');
    expect(link?.style.pointerEvents).toBe('auto'); if (!link) throw new Error('missing course link');
    fireEvent.click(link); expect(open).toHaveBeenCalledTimes(1);
  });
  it('(e) video mute sits bottom-right at 12px, duration top-right; dots sit at 58px', () => {
    const video = readFileSync('src/components/feed/InlineVideo.tsx', 'utf8');
    expect(video).toContain("data-inline-video-mute style={{ position: 'absolute', right: 8, bottom: 8, zIndex: 30 }}");
    expect(video).toContain('<MuteButton size="chip" laneId={laneId} />');
    expect(video).not.toContain('--review-glass-h');
    expect(readFileSync('src/components/feed/MediaCarousel.tsx', 'utf8')).toContain('bottom: 58,');
    expect(containerHeight()).toBe('');
  });
  it('(f) no name and no scores omit the below-media block, glass and fade', () => {
    const { container } = render(tree(card({ ...post, review: null, courseName: null } as FeedPost)));
    expect(container.querySelector('[data-review-grid-scores]')).toBeNull();
    expect(container.querySelector('[data-review-score-strip]')).toBeNull();
    expect(container.querySelector('[data-review-glass-fade]')).toBeNull();
  });
});
function containerHeight() {
  const { container } = render(tree(card()));
  return container.querySelector<HTMLElement>('[data-review-media]')?.style.getPropertyValue('--review-glass-h');
}