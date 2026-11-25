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
import { WhoPlayingSection } from '@/components/courses/browse/WhoPlayingSection';
import { readSeen, type HomePlace, type PlacedCourse } from '@/components/courses/browse/playedRings';

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
    <MemoryRouter initialEntries={['/courses']}><WhoPlayingSection /></MemoryRouter>
  </QueryClientProvider>,
);
const pending = { data: undefined, isFetched: false, isError: false };
const review = (id: string, course: string) => ({ id, course_id: course, user_id: 'rev', rating: 8, review: 'Good', created_at: '2026-11-12T10:00:00Z' });
const states = (el: HTMLElement) => Object.fromEntries([...el.querySelectorAll('[data-played-ring]')].map((b) => [b.textContent?.includes('Walton') ? 'surrey' : 'sun', b.getAttribute('data-played-ring')]));
const ring = (el: HTMLElement, id: 'sun' | 'surrey') => [...el.querySelectorAll('[data-played-ring]')].find((b) => (b.textContent?.includes('Walton') ? 'surrey' : 'sun') === id) as HTMLElement;
const base = () => ({ rounds: q([round('1', 'sun', 'ann', 71), round('3', 'surrey', 'cy', 80, '2026-11-08')]), posts: q([]), reviews: q([]), faces: q(new Map()), ratings: q(new Map()), memberIds: [], unplayedIds: [],
  courses: q(new Map([sundridge, surrey].map((x) => [x.id, x]))), ids: ['sun', 'surrey'], home, homeReady: true });
beforeEach(() => { window.localStorage.clear(); f.tile = tile(); });
afterEach(cleanup);
describe('Brief 21 E — played rings stay grey once seen', () => {
  it('a ring selected before reviews land is grey after remount; a new review turns it amber; nothing new stays grey', async () => {
    // Stage 1: rounds only. Stage 2: posts. Stage 3: reviews land.
    f.hook = { ...base(), posts: pending, reviews: pending };
    const first = mount();
    expect(readSeen('me')).toEqual({});
    f.hook = { ...base(), reviews: pending }; first.rerender(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/courses']}><WhoPlayingSection /></MemoryRouter></QueryClientProvider>);
    expect(readSeen('me')).toEqual({});
    f.hook = { ...base(), reviews: q([review('r1', 'sun')]) };
    first.unmount();
    const second = mount();
    await waitFor(() => expect(second.container.querySelectorAll('[data-played-ring]').length).toBe(2));
    fireEvent.click(ring(second.container, 'sun')); fireEvent.click(ring(second.container, 'surrey'));
    await waitFor(() => expect(readSeen('me')?.sun).toContain('review:r1'));
    second.unmount();
    // Remount with the same data: grey.
    const third = mount();
    await waitFor(() => expect(third.container.querySelectorAll('[data-played-ring]').length).toBe(2));
    fireEvent.click(ring(third.container, 'surrey'));
    expect(states(third.container).sun).toBe('seen');
    third.unmount();
    // One new review key for sun: amber.
    f.hook = { ...base(), reviews: q([review('r1', 'sun'), review('r2', 'sun')]) };
    const fourth = mount();
    await waitFor(() => expect(fourth.container.querySelectorAll('[data-played-ring]').length).toBe(2));
    const s = states(fourth.container);
    expect(s.sun === 'new' || (s.sun === 'selected' && ring(fourth.container, 'sun') === fourth.container.querySelector('[data-played-ring]'))).toBe(true);
    expect(s.surrey).not.toBe('new');
    fourth.unmount();
    // Remount again with nothing new after viewing: grey.
    const fifth = mount();
    await waitFor(() => expect(fifth.container.querySelectorAll('[data-played-ring]').length).toBe(2));
    fireEvent.click(ring(fifth.container, 'surrey'));
    expect(states(fifth.container).sun).toBe('seen');
  });
});
