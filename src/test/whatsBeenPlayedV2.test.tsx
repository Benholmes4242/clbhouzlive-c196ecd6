/** BRIEF_WHATS_BEEN_PLAYED_V2 §8 — activity counting, tabs in the section,
 *  ring alignment, best lately names, LATEST REVIEW, county head, rails,
 *  the 30-day reads and the hero record row. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const f = vi.hoisted(() => ({ hook: null as any, tile: { holes: [], photos: [], hardestHole: null, ready: true } as any, counts: 0, calls: [] as any[] }));
// V6 §3: the section waits for Featured's reads; empty, ready signals here (ruled).
vi.mock('@/components/courses/browse/useFeaturedSignals', () => ({ useFeaturedSignals: () => ({ played: undefined, reviewed: undefined, top100: undefined, connected: undefined, likedPosts: undefined, ready: true }) }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/components/courses/browse/usePlayedTile', () => ({ usePlayedTile: () => f.tile }));
vi.mock('@/hooks/useCourseMediaCounts', () => ({ useCourseMediaCounts: () => ({ data: { photos: f.counts, videos: 0, total: f.counts } }) }));
vi.mock('@/features/pro-verification/InlineProMemberName', () => ({ InlineProMemberName: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span data-face="" /> }));
vi.mock('@/integrations/supabase/client', () => {
  const builder = (table: string) => {
    const ops: any[] = []; const b: any = {};
    for (const op of ['select', 'eq', 'or', 'not', 'gte', 'order', 'range', 'in', 'limit']) b[op] = (...a: any[]) => { ops.push([op, ...a]); return b; };
    b.then = (r: any) => { f.calls.push({ table, ops }); return Promise.resolve({ data: [], error: null }).then(r); };
    return b;
  };
  return { supabase: { from: builder, rpc: (name: string, args: any) => { f.calls.push({ rpc: name, args }); return Promise.resolve({ data: [], error: null }); } } };
});
vi.mock('@/components/courses/browse/usePlayedRounds', async () => {
  const real = await vi.importActual<any>('@/components/courses/browse/usePlayedRounds');
  return { ...real, usePlayedRounds: () => f.hook };
});
import { WhoPlayingSection, groupActivity } from '@/components/courses/browse/WhoPlayingSection';
import { fetchPlayedPosts, fetchPlayedReviews, fetchPlayedRounds } from '@/components/courses/browse/usePlayedRounds';
import { ACTIVITY_WINDOW_DAYS, type HomePlace, type PlacedCourse } from '@/components/courses/browse/playedRings';

const UKI = 'Britain & Ireland';
const c = (id: string, o: Partial<PlacedCourse & { name: string }>): PlacedCourse & { name: string; imageUrl: null } => ({ id, region: null, subCountry: null, country: UKI, continent: 'Europe', lat: null, lng: null, name: `${id} Golf Club`, imageUrl: null, ...o });
const home: HomePlace = { lat: null, lng: null, region: 'Kent', subCountry: 'England', country: UKI, continent: 'Europe' };
const round = (id: string, course: string, user: string, gross: number, date = '2026-11-10', name: string | null = `${user} Smith`) => ({ whs_score_id: id, course_id: course, course_name: null, play_date: date, user_id: user, display_name: name, profile_photo_url: null, gross_score: gross, course_par: 72, total_count: 0 });
const post = (id: string, course: string | null, user: string, at = '2026-11-11T10:00:00Z', tagged: string[] = [], actor = 'user') => ({ id, user_id: user, actor_type: actor, created_at: at, course_id: course, tagged_course_ids: tagged });
const review = (id: string, course: string, user: string, at = '2026-11-12T10:00:00Z', rating = 9.2, text = 'Greens quick and true.') => ({ id, course_id: course, user_id: user, rating, review: text, created_at: at });
const q = (data: unknown) => ({ data, isFetched: true, isError: false });
function setHook(o: { rounds?: any[]; posts?: any[]; reviews?: any[]; courses: ReturnType<typeof c>[]; faces?: Map<string, any>; ratings?: Map<string, number | null> }) {
  f.hook = { rounds: q(o.rounds ?? []), posts: q(o.posts ?? []), reviews: q(o.reviews ?? []), faces: q(o.faces ?? new Map()), ratings: q(o.ratings ?? new Map()), memberIds: [], unplayedIds: [],
    courses: q(new Map(o.courses.map((x) => [x.id, x]))), ids: o.courses.map((x) => x.id), home, homeReady: true };
}
const mount = () => render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><WhoPlayingSection /></MemoryRouter></QueryClientProvider>);
beforeEach(() => { window.localStorage.clear(); f.counts = 0; f.tile = { holes: [], photos: [], hardestHole: null, ready: true }; f.calls = []; });
afterEach(cleanup);

describe('activity counting', () => {
  it('counts rounds, posts (course or tagged) and reviews; members are distinct; newest key wins', () => {
    const groups = groupActivity(
      [round('r1', 'a', 'ann', 74, '2026-11-01')],
      [post('p1', 'a', 'bob'), post('p2', null, 'cy', '2026-11-05T09:00:00Z', ['a', 'b']), post('p3', 'b', 'biz', '2026-11-06T09:00:00Z', [], 'business')],
      [review('v1', 'b', 'ann', '2026-11-13T09:00:00Z')],
    );
    const a = groups.find((g) => g.courseId === 'a')!; const b = groups.find((g) => g.courseId === 'b')!;
    expect([a.activity, b.activity]).toEqual([3, 3]);
    expect(a.faces.map((x) => x.userId)).toEqual(['bob', 'cy', 'ann']);
    expect(b.faces.map((x) => x.userId)).toEqual(['ann', 'cy']);
    expect(b.latestKey).toBe('review:v1');
    expect(a.latestKey).toBe('post:p1');
    expect(groups.map((g) => g.courseId)).toEqual(['b', 'a']);
  });
  it('fills names and faces from readMemberFaces when the row has none', () => {
    const faces = new Map([['ann', { displayName: 'Ann Lee', username: 'ann', photoUrl: 'ann.jpg' }]]);
    const [g] = groupActivity([round('r1', 'a', 'ann', 74, '2026-11-01', null)], [], [], faces);
    expect(g.rows[0].display_name).toBe('Ann Lee');
    expect(g.faces[0]).toEqual({ userId: 'ann', photo: 'ann.jpg', name: 'Ann Lee' });
  });
  it('reads 30 days: rounds window, published course posts and real reviews since the window start', async () => {
    expect(ACTIVITY_WINDOW_DAYS).toBe(30);
    await fetchPlayedRounds();
    expect(f.calls[0]).toMatchObject({ rpc: 'get_recent_rounds', args: { p_scope: 'everyone', p_window: '30' } });
    await fetchPlayedPosts('2026-10-18T00:00:00.000Z');
    const posts = f.calls.find((x) => x.table === 'posts').ops;
    expect(posts).toContainEqual(['eq', 'status', 'published']);
    expect(posts).toContainEqual(['or', 'course_id.not.is.null,tagged_course_ids.neq.{}']);
    expect(posts).toContainEqual(['gte', 'created_at', '2026-10-18T00:00:00.000Z']);
    await fetchPlayedReviews('2026-10-18T00:00:00.000Z');
    const reviews = f.calls.find((x) => x.table === 'course_ratings').ops;
    expect(reviews).toContainEqual(['eq', 'is_mock', false]);
    expect(reviews).toContainEqual(['not', 'review', 'is', null]);
    expect(reviews).toContainEqual(['gte', 'created_at', '2026-10-18T00:00:00.000Z']);
  });
});

describe('section', () => {
  const kentA = c('sun', { region: 'Kent', subCountry: 'England', name: 'Sundridge Park Golf Club (East Course)' });
  const knole = c('knole', { region: 'Kent', subCountry: 'England', name: 'Knole Park Golf Club' });
  const surrey = c('add', { region: 'Surrey', subCountry: 'England', name: 'The Addington' });
  const woburn = c('wob', { region: 'Bedfordshire', subCountry: 'England', name: 'Woburn Golf Club' });
  const spain = c('val', { region: 'Andalusia', subCountry: 'Spain', country: 'Continental Europe', name: 'Valderrama' });
  beforeEach(() => setHook({
    rounds: [round('1', 'sun', 'ben', 75), round('2', 'sun', 'ben', 72, '2026-11-09'), round('3', 'sun', 'tom', 78), round('4', 'sun', 'raj', 80), round('5', 'add', 'ben', 77)],
    posts: [post('p1', 'knole', 'mason'), post('p2', 'wob', 'mason')],
    reviews: [review('v1', 'knole', 'raj')],
    faces: new Map([['raj', { displayName: 'Raj Kapoor', username: 'raj', photoUrl: null }], ['mason', { displayName: 'Mason Ellis', username: 'mason', photoUrl: null }]]),
    ratings: new Map([['wob', 9.1]]),
    courses: [kentA, knole, surrey, woburn, spain],
  }));
  it('tabs run Featured, county, nation, then world tabs with activity; the first is selected', () => {
    const { getAllByRole } = mount();
    expect(getAllByRole('tab').map((t) => t.textContent)).toEqual(['Featured', 'Kent', 'England', 'GB&I']);
    expect(getAllByRole('tab')[0].getAttribute('aria-selected')).toBe('true');
  });
  it('rings are top-aligned whatever their label lines', () => {
    const { container } = mount();
    const row = container.querySelector('[data-played-rings]') as HTMLElement;
    expect(row.style.alignItems).toBe('flex-start');
    for (const ring of container.querySelectorAll<HTMLElement>('[data-played-ring]')) {
      expect(ring.style.display).toBe('flex');
      expect(ring.style.flexDirection).toBe('column');
      expect(ring.style.justifyContent).toBe('flex-start');
    }
    expect(container.querySelectorAll('[data-ring-count]')).toHaveLength(0);
  });
  it('rounds lately is the latest two rounds with full names; no county in the head; played line', () => {
    const { container } = mount();
    const entries = [...container.querySelectorAll('[data-best-entry]')];
    expect(entries.map((e) => e.textContent?.slice(0, 2))).toEqual(['80', '78']);
    expect(entries[0].textContent).toContain('raj Smith');
    expect(entries[1].textContent).toContain('tom Smith');
    expect(container.querySelector('[data-tile-place]')).toBeNull();
    expect(container.querySelector('[data-tile-faces]')?.textContent).toBe('3 golfers played 4 rounds lately');
  });
  it('a course with no rounds opens on its latest review and is "shared it lately"', () => {
    const { container } = mount();
    fireEvent.click(container.querySelectorAll('[data-played-ring]')[1]);
    expect(container.querySelector('[data-best-lately]')).toBeNull();
    const card = container.querySelector('[data-latest-review]') as HTMLElement;
    expect(card.textContent).toContain('LATEST REVIEW');
    expect(card.textContent).toContain('Raj Kapoor');
    expect(card.querySelector('[data-review-text]')?.textContent).toBe('Greens quick and true.');
    expect(card.textContent).toContain('1 review lately');
    const faces = container.querySelector('[data-tile-faces]')?.textContent ?? '';
    expect(faces).toContain('2 golfers');
    expect(faces).toContain('shared it lately');
    expect(JSON.parse(window.localStorage.getItem('clbhouz:played-seen:me') ?? '{}').knole).toEqual(['review:v1', 'post:p1']);
  });
  it('no rounds and no review: no first card', () => {
    setHook({ posts: [post('p1', 'knole', 'mason')], courses: [knole] });
    const { container } = mount();
    expect(container.querySelector('[data-best-lately]')).toBeNull();
    expect(container.querySelector('[data-latest-review]')).toBeNull();
    expect(container.querySelector('[data-tile-add]')).not.toBeNull();
  });
  it('rails hold active courses outside the first tab with Best round, or media counts (V3 §3)', () => {
    f.counts = 4;
    const { container } = mount();
    const rail = container.querySelector('[data-region-rail="home"]') as HTMLElement;
    const ids = [...rail.querySelectorAll('[data-rail-card]')].map((n) => n.textContent);
    expect(ids.some((t) => t?.includes('Sundridge'))).toBe(false);
    const played = rail.querySelector('[data-played-stat]') as HTMLElement;
    expect(played.textContent).toBe('Best round 77');
    expect(rail.querySelector('[data-activity-stat]')?.textContent).toBe('4 photos');
    const counts = [...rail.querySelectorAll('[data-rail-card="played"]')].map((n) => n.querySelector('span span:nth-child(2)')?.textContent);
    expect(counts.length).toBe(2);
  });
  it('a course may sit in a tab and a rail: England tab courses outside Kent are on a rail too', () => {
    const { container, getAllByRole } = mount();
    fireEvent.click(getAllByRole('tab')[2]);
    expect(container.querySelectorAll('[data-played-ring]')).toHaveLength(4);
    expect(container.querySelector('[data-region-rail="home"]')?.textContent).toContain('The Addington');
  });
});
