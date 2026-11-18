/** BRIEF_WHATS_BEEN_PLAYED_V4 §7. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const f = vi.hoisted(() => ({ hook: null as any, tile: null as any, opened: [] as any[], scrolled: [] as any[] }));
// V6 §3: the section waits for Featured's reads; empty, ready signals here (ruled).
vi.mock('@/components/courses/browse/useFeaturedSignals', () => ({ useFeaturedSignals: () => ({ played: undefined, reviewed: undefined, top100: undefined, connected: undefined, likedPosts: undefined, ready: true }) }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/components/courses/browse/usePlayedTile', () => ({ usePlayedTile: () => f.tile }));
vi.mock('@/hooks/useCourseMediaCounts', () => ({ useCourseMediaCounts: () => ({ data: { photos: 0, videos: 0, total: 0 } }) }));
vi.mock('@/features/pro-verification/InlineProMemberName', () => ({ InlineProMemberName: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span data-face="" /> }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: (a: any) => { f.opened.push(a); } }));
vi.mock('@/lib/getScrollParent', async () => {
  const real = await vi.importActual<any>('@/lib/getScrollParent');
  return { ...real, scrollElementIntoView: (el: Element, o: any) => { f.scrolled.push([el, o]); } };
});
vi.mock('@/lib/chromeClearance', async () => {
  const real = await vi.importActual<any>('@/lib/chromeClearance');
  return { ...real, chromeClearancePx: () => 72 };
});
vi.mock('@/integrations/supabase/client', () => {
  const builder = () => { const b: any = {}; for (const op of ['select', 'eq', 'or', 'not', 'gte', 'order', 'range', 'in', 'limit']) b[op] = () => b; b.then = (r: any) => Promise.resolve({ data: [], error: null }).then(r); return b; };
  return { supabase: { from: builder, rpc: () => Promise.resolve({ data: [], error: null }) } };
});
vi.mock('@/components/courses/browse/usePlayedRounds', async () => {
  const real = await vi.importActual<any>('@/components/courses/browse/usePlayedRounds');
  return { ...real, usePlayedRounds: () => f.hook };
});
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WhoPlayingSection } from '@/components/courses/browse/WhoPlayingSection';
import { readSeen, type HomePlace, type PlacedCourse } from '@/components/courses/browse/playedRings';
import { courseLatelyHref } from '@/lib/courses/courseLatelyLink';
import { useLatelyDeepLink } from '@/components/courses/course-detail/about/useLatelyDeepLink';
import { CourseMasthead } from '@/components/courses/CourseMasthead';
import { VIEWER_ABOVE_SHEETS_Z } from '@/lib/zLayers';

const UKI = 'Britain & Ireland';
const c = (id: string, o: Partial<PlacedCourse & { name: string }>) => ({ id, region: null, subCountry: null, country: UKI, continent: 'Europe', lat: null, lng: null, name: `${id} Golf Club`, imageUrl: null, ...o }) as PlacedCourse & { name: string; imageUrl: null };
const home: HomePlace = { lat: null, lng: null, region: 'Kent', subCountry: 'England', country: UKI, continent: 'Europe' };
const round = (id: string, course: string, user: string, gross: number, date = '2026-11-10') => ({ whs_score_id: id, course_id: course, course_name: null, play_date: date, user_id: user, display_name: `${user} Smith`, profile_photo_url: null, gross_score: gross, course_par: 72, total_count: 0 });
const q = (data: unknown) => ({ data, isFetched: true, isError: false });
const sundridge = c('sun', { region: 'Kent', subCountry: 'England', name: 'Sundridge Park Golf Club - East Course' });
const surrey = c('surrey', { region: 'Surrey', subCountry: 'England', name: 'Walton Heath Golf Club' });
const holeRow = { id: 'm1', course_id: 'sun', hole_no: 3, media_type: 'image', media_url: 'https://x/h.jpg', added_at: '2026-11-10T10:00:00Z', member_name: 'Tom', member_id: 'tom' };
const hole2 = { ...holeRow, id: 'm2', hole_no: 7, media_url: 'https://x/h7.jpg', member_name: 'Ann', member_id: 'ann' };
const coursePost = { id: 'p1', userId: 'dan', actorType: 'personal', displayName: 'Dan', createdAt: '2026-11-11T10:00:00Z', courseId: 'sun', courseName: 'Sundridge', mediaItems: [{ id: 'mi1', type: 'image', imageUrl: 'https://x/c.jpg' }] };
const tile = () => ({
  ready: true, hardestHole: null,
  holes: [{ kind: 'hole', key: 'h:m1', holeNo: 3, addedAt: holeRow.added_at, imageUrl: holeRow.media_url, par: 4, yards: 400, memberName: 'Tom', memberId: 'tom', memberPhoto: null, sourcePostId: null, mediaId: 'm1', rows: [holeRow] },
    { kind: 'hole', key: 'h:m2', holeNo: 7, addedAt: hole2.added_at, imageUrl: hole2.media_url, par: 3, yards: 160, memberName: 'Ann', memberId: 'ann', memberPhoto: null, sourcePostId: null, mediaId: 'm2', rows: [hole2] }],
  photos: [{ kind: 'course', key: 'c:p1', postId: 'p1', mediaId: 'mi1', createdAt: coursePost.createdAt, imageUrl: 'https://x/c.jpg', caption: 'Lovely', memberName: 'Dan', memberId: 'dan', memberPhoto: null }],
  coursePosts: [coursePost],
});
function Where() { const l = useLocation(); return <output data-where="">{l.pathname + l.search}</output>; }
const mount = () => render(
  <QueryClientProvider client={new QueryClient()}>
    <MemoryRouter initialEntries={['/courses']}>
      <Routes><Route path="*" element={<><WhoPlayingSection /><Where /></>} /></Routes>
    </MemoryRouter>
  </QueryClientProvider>,
);
const where = (el: HTMLElement) => el.querySelector('[data-where]')?.textContent;
beforeEach(() => {
  window.localStorage.clear(); f.opened = []; f.scrolled = []; f.tile = tile();
  f.hook = { rounds: q([round('1', 'sun', 'ann', 71), round('2', 'sun', 'bob', 76, '2026-11-09'), round('3', 'surrey', 'cy', 80, '2026-11-08')]), posts: q([]), reviews: q([]), faces: q(new Map()), ratings: q(new Map()), memberIds: [], unplayedIds: [],
    courses: q(new Map([sundridge, surrey].map((x) => [x.id, x]))), ids: ['sun', 'surrey'], home, homeReady: true };
});
afterEach(cleanup);

import { ReviewRailSlot, reviewMediaLine } from '@/components/courses/ReviewRailSlot';
import { countsAsActivity, unseenFirst, featuredCourses, featuredScore, FEATURED_CAP, NO_SIGNALS, roundsLately, golfersLine, type FeaturedSignals } from '@/components/courses/browse/playedRings';

const g = (courseId: string, activity: number, latestDate = '2026-11-10', keys = [`round:${courseId}`]) => ({ courseId, activity, latestDate, latestKey: keys[0], keys });
const S = (o: Partial<FeaturedSignals>): FeaturedSignals => ({ ...NO_SIGNALS, ...o });
const ids = (xs: Array<{ courseId: string }>) => xs.map((x) => x.courseId);

describe('V6 §1 activity', () => {
  it("a round's scorecard post and text-only posts don't count; media posts do", () => {
    expect(countsAsActivity({ whs_score_id: 's1', media_count: 2 })).toBe(false);
    expect(countsAsActivity({ attached_score_id: 's1', media_count: 2 })).toBe(false);
    expect(countsAsActivity({ post_type: 'round', media_count: 1 })).toBe(false);
    expect(countsAsActivity({ post_type: 'regular', media_count: 0 })).toBe(false);
    expect(countsAsActivity({ post_type: 'regular', media_count: 1 })).toBe(true);
    expect(countsAsActivity({ post_type: null, media_count: 3 })).toBe(true);
  });
});

describe('V6 §2 ring order', () => {
  it('unseen rings come before seen ones, each group keeping the tab order', () => {
    const order = [g('a', 5), g('b', 4), g('c', 3), g('d', 2)];
    expect(ids(unseenFirst(order, { a: ['round:a'], c: ['round:c'] }))).toEqual(['b', 'd', 'a', 'c']);
  });
  it('a seen course with new activity returns to the front', () => {
    expect(ids(unseenFirst([g('a', 5, '2026-11-10', ['round:a', 'post:new']), g('b', 4)], { a: ['round:a'] }))).toEqual(['a', 'b']);
  });
  it('tapping through the row does not reorder it until a tab switch, then seen rings sit at the back', () => {
    const { container, getByRole } = mount();
    const rings = () => [...container.querySelectorAll<HTMLElement>('[data-played-ring]')];
    expect(rings().map((r) => r.getAttribute('data-played-ring'))).toEqual(['selected', 'new']);
    fireEvent.click(rings()[1]);
    expect(rings().map((r) => r.getAttribute('data-played-ring'))).toEqual(['seen', 'selected']);
    fireEvent.click(getByRole('tab', { name: 'England' }));
    fireEvent.click(getByRole('tab', { name: 'Featured' }));
    // Both now seen: the row keeps its order among seen rings.
    expect(rings().map((r) => r.getAttribute('data-played-ring'))).toEqual(['selected', 'seen']);
    expect(container.querySelectorAll('[data-ring-count]')).toHaveLength(0);
  });
});

describe('V6 §3 Featured', () => {
  it('is the first tab and selected on load', () => {
    const { getAllByRole } = mount();
    expect(getAllByRole('tab')[0].textContent).toBe('Featured');
    expect(getAllByRole('tab')[0].getAttribute('aria-selected')).toBe('true');
  });
  it('scores each signal: +10 home, played, Top 100, unseen; +5 reviewed, connected; +2 liked', () => {
    const x = g('x', 1);
    const seen = { x: ['round:x'] };
    expect(featuredScore(x, NO_SIGNALS, seen)).toBe(0);
    expect(featuredScore(x, NO_SIGNALS, null)).toBe(10);
    expect(featuredScore(x, S({ homeCourseIds: new Set(['x']) }), seen)).toBe(10);
    expect(featuredScore(x, S({ playedIds: new Set(['x']) }), seen)).toBe(10);
    expect(featuredScore(x, S({ top100Ids: new Set(['x']) }), seen)).toBe(10);
    expect(featuredScore(x, S({ reviewedIds: new Set(['x']) }), seen)).toBe(5);
    expect(featuredScore(x, S({ connectedIds: new Set(['x']) }), seen)).toBe(5);
    expect(featuredScore(x, S({ likedIds: new Set(['x']) }), seen)).toBe(2);
  });
  it('ties go to activity, then the most recent; capped at 15', () => {
    const seenAll = Object.fromEntries(['a', 'b', 'c'].map((k) => [k, [`round:${k}`]]));
    expect(ids(featuredCourses([g('a', 1, '2026-11-01'), g('b', 3), g('c', 1, '2026-11-09')], NO_SIGNALS, seenAll))).toEqual(['b', 'c', 'a']);
    const many = Array.from({ length: 20 }, (_, i) => g(`k${i}`, i + 1));
    expect(featuredCourses(many, NO_SIGNALS, null)).toHaveLength(FEATURED_CAP);
  });
  it('a missing signal scores nothing, so ordering falls back to activity', () => {
    const seenAll = { a: ['round:a'], b: ['round:b'] };
    expect(ids(featuredCourses([g('a', 1), g('b', 2)], S({ top100Ids: new Set() }), seenAll))).toEqual(['b', 'a']);
    expect(ids(featuredCourses([g('a', 1), g('b', 2)], S({ top100Ids: new Set(['a']) }), seenAll))).toEqual(['a', 'b']);
  });
  it('rails still exclude the home county, not the Featured set', () => {
    const { container } = mount();
    expect(container.querySelector('[data-region-rail]')?.textContent ?? '').not.toContain('Sundridge');
    expect(container.querySelector('[data-region-rail="home"]')?.textContent).toContain('Walton Heath');
  });
});

describe('V6 §4 tile', () => {
  it('ROUNDS LATELY shows the latest two, the same golfer allowed, with the footer', () => {
    const r = (id: string, user: string, d: string) => ({ whs_score_id: id, user_id: user, play_date: d });
    expect(roundsLately([r('1', 'nl', '2026-11-08'), r('2', 'nl', '2026-11-12'), r('3', 'ab', '2026-11-01')]).map((x) => x.whs_score_id)).toEqual(['2', '1']);
    expect(roundsLately([r('a', 'x', '2026-11-12'), r('b', 'y', '2026-11-12')]).map((x) => x.whs_score_id)).toEqual(['b', 'a']);
    f.hook.rounds = q([round('1', 'sun', 'nl', 88, '2026-11-12'), round('2', 'sun', 'nl', 91, '2026-11-08'), round('3', 'sun', 'ab', 70, '2026-11-01')]);
    const { container } = mount();
    const card = container.querySelector('[data-best-lately]') as HTMLElement;
    expect(card.querySelector('[data-best-kicker]')?.textContent).toBe('ROUNDS LATELY');
    expect([...card.querySelectorAll('[data-best-entry]')].map((e) => e.textContent?.slice(0, 2))).toEqual(['88', '91']);
    expect(card.textContent).toContain('3 rounds lately \u203A');
  });
  it('the add tile shows only with no photos at all, with its wording and tap', () => {
    const a = mount();
    expect(a.container.querySelector('[data-tile-add]')).toBeNull();
    cleanup();
    f.tile = { holes: [], photos: [], hardestHole: null, ready: true };
    window.localStorage.clear();
    const b = mount();
    const add = b.container.querySelector('[data-tile-add]') as HTMLElement;
    expect([add.style.width, add.style.height, add.style.borderRadius, add.style.background]).toEqual(['156px', '216px', '16px', 'rgba(247, 147, 30, 0.12)']);
    expect(add.querySelector('[data-tile-add-text]')?.textContent).toBe('Add a photo or video of Sundridge Park');
    fireEvent.click(add);
    expect(where(b.container)).toBe('/courses/sun');
  });
  it('faces line says golfers, with no chevron', () => {
    expect(golfersLine(1, 2)).toEqual({ bold: '1 golfer', rest: ' played 2 rounds lately' });
    expect(golfersLine(11, 1)).toEqual({ bold: '11 golfers', rest: ' played 1 round lately' });
    expect(golfersLine(2, 0)).toEqual({ bold: '2 golfers', rest: ' shared it lately' });
    const { container } = mount();
    const faces = container.querySelector('[data-tile-faces]')?.textContent ?? '';
    expect(faces).toBe('2 golfers played 2 rounds lately');
    expect(faces).not.toContain('\u203A');
  });
});

describe('V6 §5 review card (magazine rails)', () => {
  const rv = (o: Record<string, unknown> = {}) => ({ reviewId: 'r1', courseId: 'c1', courseName: 'Vale do Lobo (Ocean)', courseImage: null, rating: 8.7, quote: 'Fantastic.', at: '2026-11-10', userId: 'u', reviewerName: 'Benjamin Holmes', reviewerUsername: null, reviewerAvatar: null, mediaUrl: null, mediaType: null, posterUrl: null, media: [], courseCountry: null, courseRegion: null, courseSubCountry: null, breakdown: { design: null, conditions: null, clubhouse: null, facilities: null }, ...o }) as never;
  const wrap = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);
  it('media line variants', () => {
    expect(reviewMediaLine(2, 6)).toBe('2 videos · 6 photos');
    expect(reviewMediaLine(1, 1)).toBe('1 video · 1 photo');
    expect(reviewMediaLine(0, 4)).toBe('4 photos');
    expect(reviewMediaLine(3, 0)).toBe('3 videos');
    expect(reviewMediaLine(0, 0)).toBe('');
  });
  it('the media card footer carries the media counts and age; the written card footer carries the age only', () => {
    const withMedia = rv({
      videoCount: 2, photoCount: 6,
      media: [{ id: 'm1', type: 'image', url: 'https://x/a.jpg', posterUrl: null, streamId: null, durationSeconds: null }],
    });
    const { container } = wrap(<ReviewRailSlot reviews={[withMedia, rv({ reviewId: 'r2' })]} onReviewPress={() => {}} />);
    const mediaFoot = container.querySelector('[data-review-media-card] [data-review-foot]') as HTMLElement;
    expect(mediaFoot.textContent).toContain('Benjamin Holmes');
    expect(mediaFoot.querySelector('[data-review-media-line]')!.textContent).toBe('2 videos · 6 photos · Nov');
    const writtenFoot = container.querySelector('[data-review-written-card] [data-review-foot]') as HTMLElement;
    expect(writtenFoot.textContent).toContain('Benjamin Holmes');
    expect(writtenFoot.querySelector('[data-review-media-line]')!.textContent).toBe('Nov');
  });
  it('the whole card, course name included, opens the review sheet', () => {
    const press = vi.fn();
    const { container } = wrap(<ReviewRailSlot reviews={[rv()]} onReviewPress={press} />);
    expect(container.querySelector('button[data-course-name-link]')).toBeNull();
    fireEvent.click(container.querySelector('[data-review-course]')!);
    fireEvent.click(container.querySelector('[data-review-foot]')!);
    expect(press).toHaveBeenCalledTimes(2);
  });
});
