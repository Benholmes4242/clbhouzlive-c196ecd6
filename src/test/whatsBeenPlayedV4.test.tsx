/** BRIEF_WHATS_BEEN_PLAYED_V4 §7. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const f = vi.hoisted(() => ({ hook: null as any, tile: null as any, opened: [] as any[], scrolled: [] as any[] }));
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

describe('V4 §2 tile head', () => {
  it('titles the full course name in two clamped lines, plain sub line, no county', () => {
    const { container } = mount();
    const title = container.querySelector('[data-tile-title]') as HTMLElement;
    expect(title.textContent).toBe('Sundridge Park (East Course)');
    expect(title.style.webkitLineClamp || (title.style as any).WebkitLineClamp).toBe('2');
    expect(title.style.lineHeight).toBe('22px');
    expect(container.querySelector('[data-tile-sub]')).toBeNull();
    expect(container.querySelector('[data-tile-place]')).toBeNull();
    expect(container.querySelector('[data-tile-explore]')?.textContent).toBe('Explore Sundridge Park \u203A');
  });
});

describe('V4 §3 tile taps', () => {
  it('Best lately and the faces line open the course page at Lately', () => {
    const a = mount();
    fireEvent.click(a.container.querySelector('[data-best-lately]')!);
    expect(where(a.container)).toBe(courseLatelyHref('sun'));
    cleanup();
    const b = mount();
    fireEvent.click(b.container.querySelector('[data-tile-faces]')!);
    expect(where(b.container)).toBe('/courses/sun?tab=course&section=lately');
  });
  it('tapping the 3rd photo opens one sideways page of the whole row in row order, on index 2', () => {
    const { container } = mount();
    const tiles = container.querySelectorAll('[data-tile-photo]');
    expect(tiles).toHaveLength(3);
    fireEvent.click(tiles[2]);
    expect(where(container)).toBe('/courses');
    expect(f.opened).toHaveLength(1);
    const o = f.opened[0];
    expect(o.posts).toHaveLength(1);
    expect(o.index).toBe(0);
    expect(o.posts[0].id).toBe('shots:played:sun');
    const ids = o.posts[0].mediaItems.map((m: any) => m.id);
    expect(ids).toEqual(['m1', 'mi1', 'm2']);
    expect(ids.indexOf(o.mediaId)).toBe(2);
    expect(o.options.zIndex).toBeUndefined();
  });
  it('Explore opens the course page top', () => {
    const { container } = mount();
    fireEvent.click(container.querySelector('[data-tile-explore]')!);
    expect(where(container)).toBe('/courses/sun');
  });
});

describe('V4 §4 rail card sheet', () => {
  const openSheet = () => {
    const r = mount();
    fireEvent.click(r.container.querySelector('[data-rail-card]')!);
    return r;
  };
  it('opens that course\u2019s tile in a sheet, marks it seen and does not navigate', () => {
    expect(readSeen('me')?.surrey).toBeUndefined();
    const { container } = openSheet();
    const sheet = document.querySelector('[data-played-sheet="surrey"]') as HTMLElement;
    expect(sheet).not.toBeNull();
    expect(sheet.querySelector('[data-played-tile="surrey"]')).not.toBeNull();
    expect(readSeen('me')?.surrey).toBe('round:3');
    expect(where(container)).toBe('/courses');
  });
  it('photos inside the sheet open the same one-page row above the sheet; the sheet stays for the return', () => {
    openSheet();
    fireEvent.click(document.querySelectorAll('[data-played-sheet] [data-tile-photo]')[2]);
    const o = f.opened[0];
    expect(o.posts).toHaveLength(1);
    expect(o.posts[0].mediaItems.map((m: any) => m.id)).toEqual(['m1', 'mi1', 'm2']);
    expect(o.mediaId).toBe('m2');
    expect(o.options.zIndex).toBe(VIEWER_ABOVE_SHEETS_Z);
    expect(document.querySelector('[data-played-sheet="surrey"]')).not.toBeNull();
  });
  it('Best lately inside the sheet closes the sheet, then navigates to Lately', async () => {
    const { container } = openSheet();
    await act(async () => { fireEvent.click(document.querySelector('[data-played-sheet] [data-best-lately]')!); await new Promise((r) => setTimeout(r, 0)); });
    expect(document.querySelector('[data-played-sheet]')).toBeNull();
    await waitFor(() => expect(where(container)).toBe(courseLatelyHref('surrey')));
  });
});

function Probe() { useLatelyDeepLink(); const l = useLocation(); return <output data-where="">{l.pathname + l.search}</output>; }
const mountProbe = () => render(<MemoryRouter initialEntries={['/courses/sun?tab=course&section=lately']}><Probe /></MemoryRouter>);

describe('V4 §3 GolfClubView section=lately', () => {
  it('scrolls once to a ready Lately under the islands, then clears the param', async () => {
    const r = mountProbe();
    const el = document.createElement('div'); el.setAttribute('data-course-lately', 'loading'); document.body.appendChild(el);
    await act(async () => { await Promise.resolve(); });
    expect(f.scrolled).toHaveLength(0);
    await act(async () => { el.setAttribute('data-course-lately', 'ready'); await new Promise((res) => setTimeout(res, 0)); });
    expect(f.scrolled).toHaveLength(1);
    expect(f.scrolled[0]).toEqual([el, { offset: 72 }]);
    expect(where(r.container)).toBe('/courses/sun?tab=course');
    el.remove();
  });
  it('lands on the tab top when Lately is absent', async () => {
    const r = mountProbe();
    const el = document.createElement('div'); el.setAttribute('data-course-lately', 'loading'); document.body.appendChild(el);
    await act(async () => { await Promise.resolve(); });
    await act(async () => { el.remove(); await new Promise((res) => setTimeout(res, 0)); });
    expect(f.scrolled).toHaveLength(0);
    expect(where(r.container)).toBe('/courses/sun?tab=course');
  });
  it('GolfClubView consumes the deep link', () => {
    expect(readFileSync(resolve('src/components/golf-club/GolfClubView.tsx'), 'utf8')).toContain('useLatelyDeepLink(');
  });
});

describe('V4 §5 masthead kicker tone', () => {
  it('defaults amber; the course detail page passes ink', () => {
    const { container } = render(<CourseMasthead name="X" kicker="ENGLAND" place={null} />);
    expect((container.querySelector('[data-masthead-kicker]') as HTMLElement).style.color).toBe('rgb(247, 147, 30)');
    cleanup();
    const ink = render(<CourseMasthead name="X" kicker="ENGLAND" place={null} kickerColor="#F8FAFC" />);
    expect((ink.container.querySelector('[data-masthead-kicker]') as HTMLElement).style.color).toBe('rgb(248, 250, 252)');
    expect(readFileSync(resolve('src/components/golf-club/GolfClubView.tsx'), 'utf8')).toContain('kickerColor={A.INK}');
  });
});
