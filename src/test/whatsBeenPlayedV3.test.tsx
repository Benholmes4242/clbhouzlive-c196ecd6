/** BRIEF_WHATS_BEEN_PLAYED_V3 §6. */
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
import { WhoPlayingSection, groupActivity } from '@/components/courses/browse/WhoPlayingSection';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RING_ROW_PAD_TOP } from '@/components/courses/browse/WhoPlayingSection';
import { mediaLine } from '@/components/courses/browse/RegionRails';
import { buildRails, railHeading, type HomePlace, type PlacedCourse } from '@/components/courses/browse/playedRings';

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

describe('V3 §1 ring count on the corner', () => {
  it('sits on the ring corner in canvas with a border and number per state', () => {
    const went = c('went', { region: 'Surrey', subCountry: 'England', name: 'Wentworth Club' });
    setHook({ rounds: [round('1', 'kenta', 'ann', 71), round('3', 'surrey', 'cy', 80, '2026-11-08'), round('6', 'went', 'gus', 75, '2026-11-01')], courses: [kentA, surrey, went] });
    const { container, getAllByRole } = mount();
    fireEvent.click(getAllByRole('tab')[1]);
    fireEvent.click(container.querySelectorAll('[data-played-ring]')[1]);
    const rings = [...container.querySelectorAll('[data-played-ring]')] as HTMLElement[];
    const badge = (state: string) => rings.find((r) => r.getAttribute('data-played-ring') === state)!.querySelector('[data-ring-count]') as HTMLElement;
    const sel = badge('selected');
    expect([sel.style.position, sel.style.top, sel.style.right, sel.style.height, sel.style.borderRadius, sel.style.background]).toEqual(['absolute', '-7px', '-7px', '18px', '6px', 'rgb(10, 10, 12)']);
    expect(sel.style.backdropFilter || '').toBe('');
    expect(sel.style.border).toMatch(/^1.5px solid (#f8fafc|rgb\(248, 250, 252\))$/i);
    expect(sel.style.color).toBe('rgb(248, 250, 252)');
    const seen = badge('seen');
    expect(seen.style.border.replace(/\s/g, '')).toBe('1.5pxsolidrgba(255,255,255,.16)');
    expect(seen.style.color).toBe('rgba(248, 250, 252, 0.62)');
    const fresh = badge('new');
    expect(fresh.style.border).toMatch(/^1.5px solid (#f7931e|rgb\(247, 147, 30\))$/i);
    expect(fresh.style.color).toBe('rgb(247, 147, 30)');
    // The badge is a child of the ring box, not the photo.
    expect(sel.parentElement?.querySelector(':scope > [data-ring-count]')).toBe(sel);
  });
  it('the ring row takes 10px top padding', () => {
    base();
    const { container } = mount();
    expect(RING_ROW_PAD_TOP).toBe(10);
    expect((container.querySelector('[data-played-rings]') as HTMLElement).style.padding.startsWith('10px')).toBe(true);
  });
});

describe('V3 §2 tile', () => {
  it('BEST LATELY kicker is ink; to par sits beside the score, red under, dim over, E level; day alone', () => {
    setHook({ rounds: [round('1', 'kenta', 'ann', 71), round('2', 'kenta', 'bob', 72, '2026-11-09'), round('3', 'kenta', 'cy', 80)], courses: [kentA] });
    const { container } = mount();
    expect((container.querySelector('[data-best-kicker]') as HTMLElement).style.color).toBe('rgb(248, 250, 252)');
    const entries = [...container.querySelectorAll('[data-best-entry]')] as HTMLElement[];
    const pars = entries.map((e) => e.querySelector('[data-to-par]') as HTMLElement);
    expect(pars.map((p) => p.textContent)).toEqual(['\u22121', 'E']);
    expect(pars[0].style.color).toBe('rgb(240, 84, 74)');
    expect(pars[1].style.color).toBe('rgba(248, 250, 252, 0.42)');
    expect(pars[0].previousElementSibling?.textContent).toBe('71');
    expect((pars[0].parentElement as HTMLElement).style.alignItems).toBe('baseline');
    expect(entries[0].lastElementChild?.textContent).not.toContain('\u00B7');
  });
  it('captions carry face and full name; course photos keep the day; COURSE tag white', () => {
    setHook({ rounds: [round('1', 'kenta', 'ann', 71)], courses: [kentA], faces });
    f.tile = { ready: true, hardestHole: null,
      holes: [{ kind: 'hole', key: 'h:1', holeNo: 18, addedAt: '2026-11-10', imageUrl: 'a.jpg', par: 4, yards: 441, memberName: null, memberId: 'tom', memberPhoto: null, sourcePostId: null }],
      photos: [{ kind: 'course', key: 'c:1', createdAt: '2026-11-09T10:00:00Z', imageUrl: 'b.jpg', caption: 'What a great presentation', memberName: 'Danny Holmes', memberId: 'dan', memberPhoto: null }] };
    const { container } = mount();
    const hole = container.querySelector('[data-tile-photo="hole"]') as HTMLElement;
    const course = container.querySelector('[data-tile-photo="course"]') as HTMLElement;
    expect(hole.querySelector('[data-photo-credit] [data-face]')).not.toBeNull();
    expect(hole.querySelector('[data-photo-credit]')?.textContent).toBe('Thomas Holmes');
    expect(course.querySelector('[data-photo-credit]')?.textContent).toMatch(/^Danny Holmes \u00B7 /);
    expect(container.textContent).not.toMatch(/by (Thomas|Danny)/);
    const tag = [...course.querySelectorAll('span')].find((s) => s.textContent === 'COURSE') as HTMLElement;
    expect(tag.style.color).toBe('rgb(255, 255, 255)');
  });
});

describe('V3 §3 rail cards', () => {
  it('count is white; a played course names its best golfer and a white Best round', () => {
    base();
    const { container } = mount();
    const rail = container.querySelector('[data-region-rail="home"]') as HTMLElement;
    const card = rail.querySelector('[data-rail-card="played"]') as HTMLElement;
    expect((card.querySelector('[data-rail-count]') as HTMLElement).style.color).toBe('rgb(255, 255, 255)');
    expect(card.querySelector('[data-best-golfer]')?.textContent).toBe('dee Smith');
    expect(card.querySelector('[data-best-golfer] [data-face]')).not.toBeNull();
    expect(card.querySelector('[data-played-stat]')?.textContent).toBe('Best round 78');
    expect((card.querySelector('[data-best-gross]') as HTMLElement).style.color).toBe('rgb(255, 255, 255)');
  });
  it('media wording: both, one, none; no star', () => {
    expect(mediaLine(2, 5)).toBe('2 videos & 5 photos');
    expect(mediaLine(1, 1)).toBe('1 video & 1 photo');
    expect(mediaLine(0, 3)).toBe('3 photos');
    expect(mediaLine(4, 0)).toBe('4 videos');
    expect(mediaLine(0, 0)).toBeNull();
    base(); f.videos = 2; f.counts = 3;
    const { container } = mount();
    const stat = container.querySelector('[data-activity-stat]') as HTMLElement;
    expect(stat.textContent).toBe('2 videos & 3 photos');
    expect(container.querySelector('[data-region-rails]')?.textContent).not.toContain('\u2605');
  });
  it('no top-ups: no NOT PLAYED LATELY card', () => {
    base();
    const { container } = mount();
    expect(container.querySelector('[data-rail-card="not-played"]')).toBeNull();
    expect(container.textContent).not.toContain('NOT PLAYED LATELY');
  });
});

describe('V3 §4 one rest-of rail', () => {
  it('home nation, then one BEYOND rail for every other nation, then Abroad', () => {
    base();
    const { container } = mount();
    const rails = [...container.querySelectorAll('[data-region-rail]')] as HTMLElement[];
    expect(rails.map((r) => r.getAttribute('data-region-rail'))).toEqual(['home', 'rest']);
    expect(rails[1].textContent).toContain('BEYOND ENGLAND');
    expect(rails[1].textContent).toContain('The rest of GB&I');
    expect(rails[1].querySelectorAll('[data-rail-card]')).toHaveLength(2);
    expect(rails[1].querySelector('[data-rail-see-all]')).toBeNull();
  });
  it('rest rail is capped at ten, busiest first, never See all; other groupings say Played lately', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ ...c(`s${i}`, { subCountry: i % 2 ? 'Scotland' : 'Wales' }) }));
    const rails = buildRails(many, many.map((x, i) => ({ courseId: x.id, activity: i + 1, latestDate: '2026-11-10', latestKey: `round:${x.id}` })), new Set(), home);
    expect(rails.map((r) => r.kind)).toEqual(['rest']);
    expect(rails[0].courseIds).toHaveLength(10);
    expect(rails[0].courseIds[0]).toBe('s11');
    expect(railHeading('rest', 'Texas', 'Rest of World').title).toBe('Played lately');
  });
});

describe('V3 §5 page', () => {
  it('By region and Tough tracks are unmounted and out of the gate', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/components/courses/CoursesBrowsePage.tsx'), 'utf8');
    expect(src).not.toContain('<ByRegionSection');
    expect(src).not.toContain('<HardestSection');
    expect(src).not.toContain("'byRegion'");
    expect(src).not.toContain("'hardest'");
  });
});
