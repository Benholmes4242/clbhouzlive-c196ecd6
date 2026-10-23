import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string } | string) => (typeof o === 'string' ? o : o?.defaultValue ?? ''), i18n: { language: 'en' } }),
  Trans: ({ children }: { children?: React.ReactNode }) => children,
}));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));

const engine = vi.hoisted(() => ({ snapshot: vi.fn(), pause: vi.fn(), play: vi.fn() }));
vi.mock('@/video/VideoEngine', () => ({ VideoEngine: engine }));

import { CourseNameLink } from '@/components/shared/CourseNameLink';
import { InlineReviewCard } from '@/components/feed/InlineReviewCard';
import { ReviewPostCard } from '@/components/feed/ReviewPostCard';
import { ReviewTile } from '@/components/explore-tab-new/courseled/ReviewTile';
import { ReviewRailSlot } from '@/components/courses/ReviewRailSlot';
import { ReviewFeaturedSlot } from '@/components/courses/ReviewFeaturedSlot';
import { HelpfulReviewsShelf } from '@/features/explore-magazine/HelpfulReviewsShelf';
import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import { FullscreenScrubber } from '@/components/fullscreen-feed/FullscreenScrubber';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { DOUBLE_TAP_WINDOW_MS } from '@/components/feed/mediaTap';
import { mapActivityPostToFeedPost } from '@/lib/activityPostMapper';
import { extractReviewData } from '@/lib/postHelpers';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

let path = '';
function Where() { path = useLocation().pathname; return null; }
function inRouter(ui: React.ReactElement) {
  path = '';
  return render(
    <MemoryRouter initialEntries={['/start']}>
      <QueryClientProvider client={new QueryClient()}>
        <Routes><Route path="*" element={<><Where />{ui}</>} /></Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}
const link = (c: HTMLElement) => c.querySelector<HTMLButtonElement>('button[data-course-name-link]');

const latest = (courseId: string): LatestReview => ({
  reviewId: 'r1', courseId, courseName: 'Swinley Forest', courseImage: null, rating: 8.4, quote: 'Lovely.',
  at: '2026-10-01', userId: 'u1', reviewerName: 'Mike', reviewerUsername: null, reviewerAvatar: null,
  mediaUrl: null, mediaType: null, posterUrl: null, courseCountry: null, courseRegion: null, courseSubCountry: null,
  breakdown: { design: 8, conditions: 8, clubhouse: 8, facilities: 8 },
});
const streamReview = (courseId: string | null): StreamItem => ({
  id: 'rv', kind: 'review', ring: 'own', lane: 'news', score: 1, consequence: null,
  subject: { course_id: courseId, course_name: 'The Addington Golf Club', region: 'Surrey', sub_country: 'England', country: 'Britain & Ireland', image_url: null, pending: false },
  who: { user_id: 'd', display_name: 'danny', photo_url: null, is_viewer: false },
  facts: { rating: 8.8, play_date: '2026-09-15', review_id: 'rid', first_sentence: 'Great.' },
  payload: {}, seen: false,
} as unknown as StreamItem);

/** Each surface: mount with/without an id, return the tile's own tap spy. */
type Surface = { name: string; mount: (courseId: string | null) => { c: HTMLElement; tile: ReturnType<typeof vi.fn> } };
const surfaces: Surface[] = [
  { name: 'InlineReviewCard (fullscreen caption)', mount: (id) => { const tile = vi.fn(); const { container } = inRouter(<InlineReviewCard courseName="Swinley Forest" courseId={id} rating={8} reviewer={{ name: 'M' }} isVisible onTap={tile} />); return { c: container, tile }; } },
  { name: 'ReviewTile (course-led)', mount: (id) => { const tile = vi.fn(); const { container } = inRouter(<ReviewTile review={latest(id ?? '')} onPress={tile} />); return { c: container, tile }; } },
  { name: 'ReviewRailSlot', mount: (id) => { const tile = vi.fn(); const { container } = inRouter(<ReviewRailSlot reviews={[latest(id ?? '')]} onReviewPress={tile} />); return { c: container, tile }; } },
  { name: 'ReviewFeaturedSlot', mount: (id) => { const tile = vi.fn(); const { container } = inRouter(<ReviewFeaturedSlot review={latest(id ?? '')} onReviewPress={tile} />); return { c: container, tile }; } },
  { name: 'HelpfulReviewsShelf', mount: (id) => { const tile = vi.fn(); const { container } = inRouter(<HelpfulReviewsShelf items={[streamReview(id)]} countFor={() => 0} pos={0} onPress={tile} />); return { c: container, tile }; } },
  { name: 'ExploreCard review', mount: (id) => { const tile = vi.fn(); const { container } = inRouter(<ExploreCard item={streamReview(id)} size="std" shape={null} onTap={tile} />); return { c: container, tile }; } },
];

describe('CB69 review course names open the course page', () => {
  for (const s of surfaces) {
    it(`${s.name}: the name is a button that opens /courses/:id without the tile's tap`, () => {
      const { c, tile } = s.mount('course-1');
      const btns = c.querySelectorAll('button[data-course-name-link]');
      expect(btns.length).toBeGreaterThan(0);
      fireEvent.pointerDown(btns[0]);
      fireEvent.click(btns[0]);
      expect(path).toBe('/courses/course-1');
      expect(tile).not.toHaveBeenCalled();
    });
    it(`${s.name}: without a course id the name is plain text`, () => {
      const { c } = s.mount(null);
      expect(link(c)).toBeNull();
    });
  }

  it('ReviewPostCard: the name is a button only when the card can open the course, and stops the tile tap', () => {
    const go = vi.fn();
    const tile = vi.fn();
    const post = { id: 'p', userId: 'u', actorId: 'u', displayName: 'M', avatarUrl: '', createdAt: new Date().toISOString(), caption: '', review: { reviewId: 'r', courseId: 'c', courseName: 'Swinley', rating: 8, reviewText: 'x', breakdown: {} } } as never;
    const { container } = inRouter(<div onClick={tile}><ReviewPostCard post={post} articleRef={() => {}} onProfile={vi.fn()} onReadReview={vi.fn()} onPrefetch={vi.fn()} footer={null} onOpenCourse={go} /></div>);
    fireEvent.click(link(container)!);
    expect(go).toHaveBeenCalledTimes(1);
    expect(tile).not.toHaveBeenCalled();
    cleanup();
    const plain = inRouter(<ReviewPostCard post={post} articleRef={() => {}} onProfile={vi.fn()} onReadReview={vi.fn()} onPrefetch={vi.fn()} footer={null} />).container;
    expect(link(plain)).toBeNull();
    expect(plain.querySelector('[data-review-course]')?.textContent).toBe('Swinley');
  });

  it('converted tiles keep role=button with Enter/Space activation; Enter on the name does not open the tile', () => {
    const tile = vi.fn();
    const { container } = inRouter(<ReviewRailSlot reviews={[latest('c9')]} onReviewPress={tile} />);
    const root = container.querySelector<HTMLElement>('[role="button"][tabindex="0"]')!;
    expect(root.tagName).toBe('DIV');
    fireEvent.keyDown(root, { key: 'Enter' });
    fireEvent.keyDown(root, { key: ' ' });
    expect(tile).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(link(container)!, { key: 'Enter' });
    expect(tile).toHaveBeenCalledTimes(2);
  });

  it('the hit area is an invisible absolute overlay of at least 44px that takes no layout space', () => {
    const { container } = inRouter(<CourseNameLink courseId="c1">Name</CourseNameLink>);
    const hit = container.querySelector<HTMLElement>('[data-course-name-hit]')!;
    expect(hit.getAttribute('aria-hidden')).toBe('true');
    expect(hit.style.position).toBe('absolute');
    expect(hit.style.minHeight).toBe('44px');
  });

  it('onBeforeNavigate runs before navigation (sheet / viewer closes first)', () => {
    const order: string[] = [];
    function Probe() { const l = useLocation(); order.push(`at:${l.pathname}`); return null; }
    render(
      <MemoryRouter initialEntries={['/start']}>
        <Probe />
        <CourseNameLink courseId="c2" onBeforeNavigate={() => order.push('close')}>Name</CourseNameLink>
      </MemoryRouter>,
    );
    fireEvent.click(document.querySelector('button[data-course-name-link]')!);
    expect(order.indexOf('close')).toBeGreaterThan(-1);
    expect(order.indexOf('close')).toBeLessThan(order.indexOf('at:/courses/c2'));
  });
});

describe('CB69 fullscreen: a tap on the course name never pauses, likes or swipes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    engine.snapshot.mockImplementation(() => ({ postId: 'p1:0', state: 'playing' }));
    useFullscreenFeedStore.setState({ activePagerIdx: 0, borrow: null, pausedOwnerKeys: new Set() } as never);
  });
  afterEach(() => vi.useRealTimers());

  it('single and double taps on the name reach neither the pause toggle nor the like', () => {
    const onLike = vi.fn();
    render(<FullscreenScrubber activePost={{ id: 'p1', mediaItems: [{ type: 'video' }] } as never} activeIndex={0} onDoubleTapLike={onLike} />);
    const { container } = inRouter(<InlineReviewCard courseName="Swinley" courseId="c1" rating={8} reviewer={{ name: 'M' }} isVisible onTap={vi.fn()} />);
    const name = link(container)!;
    const tap = () => {
      name.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }));
      name.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 10, clientY: 10 }));
    };
    act(() => { tap(); tap(); });
    act(() => { vi.advanceTimersByTime(DOUBLE_TAP_WINDOW_MS + 600); });
    expect(engine.pause).not.toHaveBeenCalled();
    expect(onLike).not.toHaveBeenCalled();
    act(() => { tap(); });
    act(() => { vi.advanceTimersByTime(DOUBLE_TAP_WINDOW_MS + 50); });
    expect(engine.pause).not.toHaveBeenCalled();
  });
});

describe('CB69 activity mapper: a missing course id is null, never empty', () => {
  const base = { id: 'p', user_id: 'u', content: 'x', created_at: '2026-10-01', source_review_id: 'r', is_review: true, post_type: 'review', review_rating: 8, likes: 0, comments: 0 } as never;
  it('extractReviewData returns null and the mapped post links nowhere', () => {
    const data = extractReviewData(base);
    if (data) expect(data.courseId).toBeNull();
    const mapped = mapActivityPostToFeedPost(base);
    expect(mapped.review?.courseId ?? null).toBeNull();
    expect(mapped.courseId ?? null).toBeNull();
    expect(mapped.review?.courseId).not.toBe('');
  });
  it('a known course id still comes through', () => {
    const mapped = mapActivityPostToFeedPost({ ...(base as object), course_id: 'c7' } as never);
    expect(mapped.courseId).toBe('c7');
  });
});
