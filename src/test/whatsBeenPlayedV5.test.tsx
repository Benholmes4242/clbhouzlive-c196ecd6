/** BRIEF_COURSES_PAGE_V5 §6 — rings, tile row and shell. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const f = vi.hoisted(() => ({ hook: null as any, tile: { holes: [], photos: [], hardestHole: null, ready: true } as any, counts: 0, videos: 0, calls: [] as any[] }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/components/courses/browse/usePlayedTile', () => ({ usePlayedTile: () => f.tile }));
vi.mock('@/hooks/useCourseMediaCounts', () => ({ useCourseMediaCounts: () => ({ data: { photos: f.counts, videos: f.videos, total: f.counts + f.videos } }) }));
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
import { WhoPlayingSection, NEW_RING_BG } from '@/components/courses/browse/WhoPlayingSection';
import { type HomePlace, type PlacedCourse } from '@/components/courses/browse/playedRings';

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
beforeEach(() => { window.localStorage.clear(); f.counts = 0; f.videos = 0; f.tile = { holes: [], photos: [], hardestHole: null, ready: true }; f.calls = []; });
afterEach(cleanup);


const kentA = c('kenta', { region: 'Kent', subCountry: 'England', name: 'Knole Park Golf Club' });
const surrey = c('surrey', { region: 'Surrey', subCountry: 'England', name: 'Walton Heath Golf Club' });
const fife = c('fife', { region: 'Fife', subCountry: 'Scotland', name: 'Kingsbarns Golf Links' });
const kerry = c('kerry', { region: 'Kerry', subCountry: 'Ireland', name: 'Waterville Golf Links' });
const spain = c('spain', { region: 'Andalusia', subCountry: 'Spain', country: 'Continental Europe', name: 'Valderrama Golf Club' });
const faces = new Map([['tom', { displayName: 'Thomas Holmes', username: 'tom', photoUrl: null }], ['dan', { displayName: 'Danny Holmes', username: 'dan', photoUrl: null }]]);
const base = () => setHook({
  rounds: [round('1', 'kenta', 'ann', 71), round('2', 'kenta', 'bob', 76, '2026-11-09'), round('3', 'surrey', 'cy', 80, '2026-11-08'), round('4', 'surrey', 'dee', 78, '2026-11-07'), round('5', 'kerry', 'ed', 74)],
  reviews: [review('v1', 'fife', 'fi')],
  courses: [kentA, surrey, fife, kerry, spain], faces,
});


const ringsOf = (container: HTMLElement) => [...container.querySelectorAll('[data-played-ring]')] as HTMLElement[];
const ringSetup = () => {
  const went = c('went', { region: 'Surrey', subCountry: 'England', name: 'Wentworth Club' });
  setHook({ rounds: [round('1', 'kenta', 'ann', 71), round('3', 'surrey', 'cy', 80, '2026-11-08'), round('6', 'went', 'gus', 75, '2026-11-01')], courses: [kentA, surrey, went] });
  const v = mount();
  fireEvent.click(v.getAllByRole('tab')[1]);
  fireEvent.click(v.container.querySelectorAll('[data-played-ring]')[1]);
  return v;
};

describe('V5 §1 G1 gradient on new rings', () => {
  it('draws a new ring with a transparent border over the amber gradient and a #FFB24D count', () => {
    const { container } = ringSetup();
    const fresh = ringsOf(container).find((r) => r.getAttribute('data-played-ring') === 'new')!;
    const box = fresh.querySelector('[data-ring-count]')!.parentElement as HTMLElement;
    expect(box.style.border).toBe('1.5px solid transparent');
    // jsdom drops a layered background shorthand, so the applied value is the exported constant.
    expect(NEW_RING_BG).toBe('linear-gradient(#0A0A0C, #0A0A0C) padding-box, linear-gradient(225deg, #FFC069 0%, #F7931E 40%, #8C4512 100%) border-box');
    expect(box.style.borderRadius).toBe('21.76px');
    const count = fresh.querySelector('[data-ring-count]') as HTMLElement;
    expect(count.style.border).toMatch(/^1.5px solid (#ffb24d|rgb\(255, 178, 77\))$/i);
    expect(count.style.color).toBe('rgb(255, 178, 77)');
  });

  it('leaves selected and seen rings solid, as before', () => {
    const { container } = ringSetup();
    const rings = ringsOf(container);
    const box = (state: string) => rings.find((r) => r.getAttribute('data-played-ring') === state)!.querySelector('[data-ring-count]')!.parentElement as HTMLElement;
    expect(box('selected').style.border).toMatch(/^1.5px solid (#f8fafc|rgb\(248, 250, 252\))$/i);
    expect(box('selected').style.background).toBe('');
    expect(box('seen').style.border.replace(/\s/g, '')).toBe('1.5pxsolidrgba(255,255,255,.16)');
    expect(box('seen').style.background).toBe('');
  });
});

const cardSize = (el: HTMLElement) => [el.style.width, el.style.height, el.style.borderRadius];

describe('V5 §2 tile row at rail-card size', () => {
  it('has no sub line under the tile title', () => {
    base();
    const { container } = mount();
    expect(container.querySelector('[data-tile-title]')).not.toBeNull();
    expect(container.querySelector('[data-tile-sub]')).toBeNull();
    expect(container.textContent).not.toContain('Through members');
  });

  it('draws Best lately and photo tiles 156 × 216, radius 16, 8px apart, with 12px card padding', () => {
    base();
    f.tile = { holes: [{ key: 'h1', kind: 'hole', holeNo: 3, imageUrl: '/a.jpg', par: 4, yards: 400, memberId: null, memberName: null, memberPhoto: null }], photos: [], hardestHole: 3, ready: true };
    const { container } = mount();
    const row = container.querySelector('[data-tile-row]') as HTMLElement;
    expect(row.style.gap).toBe('8px');
    const best = container.querySelector('[data-best-lately]') as HTMLElement;
    expect(cardSize(best)).toEqual(['156px', '216px', '16px']);
    expect(best.style.padding).toBe('12px');
    for (const p of container.querySelectorAll('[data-tile-photo]')) expect(cardSize(p as HTMLElement)).toEqual(['156px', '216px', '16px']);
  });

  it('draws the latest review card at the same size', () => {
    setHook({ reviews: [review('v1', 'kenta', 'fi')], courses: [kentA], faces: new Map([['fi', { displayName: 'Fi Scott', username: 'fi', photoUrl: null }]]) });
        const { container } = mount();
    const card = container.querySelector('[data-latest-review]') as HTMLElement;
    expect(cardSize(card)).toEqual(['156px', '216px', '16px']);
    expect(card.style.padding).toBe('12px');
  });

  it('keeps the no-photos tile 230 wide at 216 high, radius 16', () => {
    base();
    const { container } = mount();
    const empty = container.querySelector('[data-tile-empty]') as HTMLElement;
    expect(cardSize(empty)).toEqual(['230px', '216px', '16px']);
  });
});
