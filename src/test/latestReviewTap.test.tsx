/** FIX_LATEST_REVIEW_TAP: the LATEST REVIEW card opens the review sheet. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
vi.mock('@/stores/reviewSheetStore', () => ({ useReviewSheetStore: (select: any) => select({ open: (a: any) => { f.reviews.push(a); }, isOpen: false }) }));
const f = vi.hoisted(() => ({ hook: null as any, tile: null as any, opened: [] as any[], reviews: [] as any[], scrolled: [] as any[] }));
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

const rev = (id: string, course: string, user: string) => ({ id, course_id: course, user_id: user, rating: 8.5, review: 'Greens quick and true.', created_at: '2026-11-10T10:00:00Z' });
beforeEach(() => {
  window.localStorage.clear(); f.opened = []; f.reviews = []; f.tile = tile();
  f.hook = { rounds: q([]), posts: q([]), reviews: q([rev('v1', 'sun', 'raj'), rev('v2', 'surrey', 'kay')]), faces: q(new Map()), ratings: q(new Map()), memberIds: [], unplayedIds: [],
    courses: q(new Map([sundridge, surrey].map((x) => [x.id, x]))), ids: ['sun', 'surrey'], home, homeReady: true };
});
afterEach(cleanup);

describe('FIX_LATEST_REVIEW_TAP', () => {
  it('the main tile card opens the tapped review in the review sheet and never navigates', () => {
    const r = mount();
    fireEvent.click(r.container.querySelector('[data-played-tile="sun"] [data-latest-review]')!);
    expect(f.reviews).toHaveLength(1);
    expect(f.reviews[0].reviewId).toBe('v1');
    expect(f.reviews[0].courseId).toBe('sun');
    expect(f.reviews[0].user.id).toBe('raj');
    expect(where(r.container)).toBe('/courses');
  });
  it('from the rail sheet: the tile sheet closes, then the review sheet opens, no navigation', async () => {
    const r = mount();
    fireEvent.click(r.container.querySelector('[data-rail-card]')!);
    await waitFor(() => expect(document.querySelector('[data-played-sheet="surrey"]')).not.toBeNull());
    fireEvent.click(document.querySelector('[data-played-sheet] [data-latest-review]')!);
    expect(f.reviews.map((a) => a.reviewId)).toEqual(['v2']);
    await waitFor(() => expect(document.querySelector('[data-played-sheet]')).toBeNull());
    expect(where(r.container)).toBe('/courses');
  });
  it('the LATEST REVIEW kicker is ink, like BEST LATELY', () => {
    const r = mount();
    const kicker = Array.from(r.container.querySelectorAll('[data-latest-review] span')).find((s) => s.textContent === 'LATEST REVIEW') as HTMLElement;
    expect(kicker.style.color).toBe('rgb(248, 250, 252)');
  });
});
