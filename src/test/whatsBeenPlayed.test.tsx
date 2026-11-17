/** BRIEF_WHATS_BEEN_PLAYED §6 (V3-revised) — tabs, rails, See all, tile row, best
 *  lately, distance, seen state, card states and the 320 containment. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const f = vi.hoisted(() => ({ hook: null as any, tile: { holes: [], photos: [], hardestHole: null, ready: true } as any, counts: 0, session: { user: { id: 'me' }, loading: false } as any }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => f.session }));
vi.mock('@/components/courses/browse/usePlayedRounds', () => ({ usePlayedRounds: () => f.hook }));
vi.mock('@/components/courses/browse/usePlayedTile', () => ({ usePlayedTile: () => f.tile }));
vi.mock('@/hooks/useCourseMediaCounts', () => ({ useCourseMediaCounts: () => ({ data: { photos: f.counts, videos: 0, total: f.counts } }) }));
vi.mock('@/features/pro-verification/InlineProMemberName', () => ({ InlineProMemberName: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span data-face="" /> }));
import {
  bestLately, buildAreaTabs, buildRails, dayLabel, interleaveTilePhotos, railHeading, railShowsSeeAll, seenKey, toParText, hardestHoleFromRanks,
  type HomePlace, type PlacedCourse,
} from '@/components/courses/browse/playedRings';
import { WhoPlayingSection, groupRounds } from '@/components/courses/browse/WhoPlayingSection';
import { tilePlaceText } from '@/components/courses/browse/PlayedTile';
import { HOLE_DIFFICULTY_MIN_ROUNDS } from '@/lib/courses/holeDifficulty';

const UKI = 'Britain & Ireland';
const c = (id: string, o: Partial<PlacedCourse>): PlacedCourse => ({ id, region: null, subCountry: null, country: UKI, continent: 'Europe', lat: null, lng: null, ...o });
const home: HomePlace = { lat: 51.4, lng: 0.05, region: 'Kent', subCountry: 'England', country: UKI, continent: 'Europe' };
const near = c('near', { region: 'Kent', subCountry: 'England', lat: 51.41, lng: 0.06 });
const kent = c('kent', { region: 'Kent', subCountry: 'England', lat: 51.2, lng: 1.35 });
const surrey = c('surrey', { region: 'Surrey', subCountry: 'England' });
const fife = c('fife', { region: 'Fife', subCountry: 'Scotland' });
const kerry = c('kerry', { region: 'Kerry', subCountry: 'Ireland' });
const down = c('down', { region: 'Down', subCountry: 'Northern Ireland' });
const spain = c('spain', { region: 'Andalusia', subCountry: 'Spain', country: 'Continental Europe' });
const g = (courseId: string, activity: number, latestDate = '2026-11-10') => ({ courseId, activity, latestDate, latestKey: `round:${courseId}-s` });

describe('area tabs', () => {
  const usa = c('usa', { region: 'California', subCountry: 'United States', country: 'Rest of World', continent: 'North America' as never });
  const dubai = c('dubai', { region: 'Dubai', subCountry: 'United Arab Emirates', country: 'Rest of World', continent: 'Asia' as never });
  const japan = c('japan', { region: 'Chiba', subCountry: 'Japan', country: 'Rest of World', continent: 'Asia' as never });
  it('county, nation, then GB&I, Europe, USA, Middle East and Rest of world in that order', () => {
    const tabs = buildAreaTabs([kent, surrey, fife, spain, usa, dubai, japan], home);
    expect(tabs.map((t) => t.label)).toEqual(['Kent', 'England', 'GB&I', 'Europe', 'USA', 'Middle East', 'Rest of world']);
    expect(tabs.map((t) => t.courseIds)).toEqual([['kent'], ['kent', 'surrey'], ['kent', 'surrey', 'fife'], ['spain'], ['usa'], ['dubai'], ['japan']]);
  });
  it('hides a tab with no active course', () => {
    expect(buildAreaTabs([surrey, japan], home).map((t) => t.label)).toEqual(['England', 'GB&I', 'Rest of world']);
  });
  it('skips a world tab whose label repeats an earlier tab', () => {
    const usHome: HomePlace = { lat: null, lng: null, region: 'California', subCountry: 'USA', country: 'Rest of World', continent: null };
    expect(buildAreaTabs([usa, c('usa2', { region: 'Florida', subCountry: 'USA', country: 'Rest of World', continent: null })], usHome).map((t) => t.label)).toEqual(['California', 'USA']);
    expect(buildAreaTabs([usa], { ...usHome, subCountry: 'United States' }).map((t) => t.label)).toEqual(['California', 'United States']);
  });
  it('no home club: world tabs only', () => {
    expect(buildAreaTabs([kent, spain, dubai], null).map((t) => t.label)).toEqual(['GB&I', 'Europe', 'Middle East']);
  });
});

describe('region rails', () => {
  const all = [near, kent, surrey, fife, kerry, down, spain];
  const groups = [g('near', 9), g('kent', 4), g('surrey', 3), g('fife', 2), g('kerry', 1), g('down', 5), g('spain', 1)];
  const tabIds = new Set(['near', 'kent']);
  it('home nation, one rail for the rest of the grouping busiest first, Abroad last (V3 §4)', () => {
    const rails = buildRails(all, groups, tabIds, home);
    expect(rails.map((r) => r.key)).toEqual(['home', 'rest', 'abroad']);
    expect(rails[1].courseIds).toEqual(['down', 'fife', 'kerry']);
    expect(rails[2].courseIds).toEqual(['spain']);
    expect(rails.flatMap((r) => r.courseIds)).not.toContain('near');
  });
  it('a rail only appears with a played course; nothing repeats from the tabs', () => {
    const rails = buildRails(all, groups, new Set(['near', 'kent', 'surrey']), home);
    expect(rails.some((r) => r.key === 'home')).toBe(false);
  });
  it('no home groups by Britain & Ireland', () => {
    expect(buildRails([spain, fife], [g('spain', 1), g('fife', 1)], new Set(), null).map((r) => r.kind)).toEqual(['rest', 'abroad']);
  });
  it('maps the headings', () => {
    expect(railHeading('home', 'England')).toEqual({ kicker: 'ACROSS ENGLAND', title: 'Played lately' });
    expect(railHeading('rest', 'England')).toEqual({ kicker: 'BEYOND ENGLAND', title: 'The rest of GB&I' });
    expect(railHeading('rest', 'California', 'Rest of World')).toEqual({ kicker: 'BEYOND CALIFORNIA', title: 'Played lately' });
    expect(railHeading('abroad', null)).toEqual({ kicker: 'FURTHER AFIELD', title: 'Abroad' });
  });
  it('See all only on the home nation rail with more than ten active', () => {
    const many = Array.from({ length: 11 }, (_, i) => c(`e${i}`, { subCountry: 'England' }));
    const [rail] = buildRails(many, many.map((x) => g(x.id, 1)), new Set(), home);
    expect(rail.courseIds).toHaveLength(10);
    expect(railShowsSeeAll(rail)).toBe(true);
    expect(railShowsSeeAll({ ...rail, playedTotal: 10 })).toBe(false);
    expect(railShowsSeeAll({ ...rail, kind: 'rest' })).toBe(false);
    expect(railShowsSeeAll({ ...rail, kind: 'abroad' })).toBe(false);
  });
});

describe('tile rules', () => {
  const hole = (holeNo: number, addedAt: string) => ({ kind: 'hole' as const, holeNo, addedAt });
  const photo = (createdAt: string) => ({ kind: 'course' as const, createdAt });
  it('alternates hole and course, hardest first, the other carrying on, capped at twelve', () => {
    const out = interleaveTilePhotos([hole(3, '2026-11-09'), hole(10, '2026-11-01'), hole(18, '2026-11-05')], [photo('2026-11-02'), photo('2026-11-08')], 10);
    expect(out.map((x) => (x.kind === 'hole' ? `h${x.holeNo}` : `c${x.createdAt.slice(-2)}`))).toEqual(['h10', 'c08', 'h3', 'c02', 'h18']);
    const lots = interleaveTilePhotos(Array.from({ length: 9 }, (_, i) => hole(i + 1, `2026-11-0${i}`)), Array.from({ length: 9 }, () => photo('2026-11-01')), null);
    expect(lots).toHaveLength(12);
  });
  it('best lately is the lowest two, ties to the more recent', () => {
    const r = (id: string, gross: number | null, date: string) => ({ whs_score_id: id, user_id: id, play_date: date, gross_score: gross });
    expect(bestLately([r('a', 74, '2026-11-01'), r('b', 68, '2026-11-02'), r('c', 74, '2026-11-08'), r('d', null, '2026-11-09')]).map((x) => x.whs_score_id)).toEqual(['b', 'c']);
  });
  it('to par uses a true minus and E', () => {
    expect(toParText(71, 72)).toBe('\u22121');
    expect(toParText(72, 72)).toBe('E');
    expect(toParText(77, 72)).toBe('+5');
    expect(toParText(77, null)).toBeNull();
  });
  it('day reads a weekday within six days, otherwise day and month', () => {
    const now = new Date(2026, 10, 17, 10);
    expect(dayLabel('2026-11-15', now)).toBe('Sun');
    expect(dayLabel('2026-11-09', now)).toBe('9 Nov');
  });
  it('head right reads the county, else the nation', () => {
    expect(tilePlaceText({ region: 'Kent', subCountry: 'England' })).toBe('Kent');
    expect(tilePlaceText({ region: null, subCountry: 'England' })).toBe('England');
  });
  it('best lately is each golfer\u2019s best, then the two lowest golfers, never one twice', () => {
    const r = (id: string, user: string, gross: number, date: string) => ({ whs_score_id: id, user_id: user, play_date: date, gross_score: gross });
    expect(bestLately([r('1', 'ann', 70, '2026-11-01'), r('2', 'ann', 71, '2026-11-02'), r('3', 'bob', 74, '2026-11-03'), r('4', 'cy', 74, '2026-11-08')]).map((x) => x.whs_score_id)).toEqual(['1', '4']);
    expect(bestLately([r('1', 'ann', 72, '2026-11-01'), r('2', 'ann', 72, '2026-11-05')]).map((x) => x.whs_score_id)).toEqual(['2']);
  });
});

const row = (id: string, course: string, user: string, gross: number, date = '2026-11-10') => ({ whs_score_id: id, course_id: course, course_name: null, play_date: date, user_id: user, display_name: `${user} Smith`, profile_photo_url: null, gross_score: gross, course_par: 72, total_count: 0 });
const placed = (x: PlacedCourse, name: string) => ({ ...x, name, imageUrl: null });
function setHook(rows: ReturnType<typeof row>[], courses: ReturnType<typeof placed>[], h: HomePlace | null = home) {
  f.hook = { rounds: { data: rows, isFetched: true, isError: false }, courses: { data: new Map(courses.map((x) => [x.id, x])), isFetched: true, isError: false }, ids: courses.map((x) => x.id), home: h, homeReady: true };
}
const mount = () => render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><WhoPlayingSection /></MemoryRouter></QueryClientProvider>);

describe('section', () => {
  beforeEach(() => {
    window.localStorage.clear();
    f.tile = { holes: [], photos: [], hardestHole: null, ready: true }; f.counts = 0;
    setHook([row('1', 'near', 'ann', 71), row('2', 'near', 'bob', 77, '2026-11-08'), row('3', 'near', 'cy', 80), row('4', 'kent', 'ann', 72), row('5', 'fife', 'dee', 79)],
      [placed(near, 'Sundridge Park Golf Club (East Course)'), placed(kent, 'Knole Park Golf Club'), placed(fife, 'St Andrews Links (Old Course)')]);
  });
  afterEach(cleanup);
  it('rings follow the tab; the first ring is selected and its tile shows', () => {
    const { container } = mount();
    expect([...container.querySelectorAll('[data-played-ring]')].map((n) => n.getAttribute('data-played-ring'))).toEqual(['selected', 'new']);
    expect(container.querySelector('[data-played-tile]')?.getAttribute('data-played-tile')).toBe('near');
    fireEvent.click(screen.getByRole('tab', { name: 'GB&I' }));
    expect(container.querySelectorAll('[data-played-ring]')).toHaveLength(3);
    expect(container.querySelector('[data-played-tile]')?.getAttribute('data-played-tile')).toBe('near');
  });
  it('best lately shows the two lowest with to par beside the score, under par red, otherwise dim (V3 §2)', () => {
    const { container } = mount();
    const entries = [...container.querySelectorAll('[data-best-entry]')];
    expect(entries).toHaveLength(2);
    const pars = [...container.querySelectorAll('[data-to-par]')] as HTMLElement[];
    expect(pars.map((p) => p.textContent)).toEqual(['\u22121', '+5']);
    expect(pars[0].style.color).toBe('rgb(240, 84, 74)');
    expect(pars[1].style.color).toBe('rgba(248, 250, 252, 0.42)');
  });
  it('no photos shows the single empty tile', () => {
    const { container } = mount();
    expect(container.querySelector('[data-tile-empty]')).not.toBeNull();
    expect(container.querySelectorAll('[data-tile-photo]')).toHaveLength(0);
  });
  it('selecting a ring stores its newest round as seen', () => {
    const { container } = mount();
    fireEvent.click(screen.getByRole('tab', { name: 'Kent' }));
    const kentRing = container.querySelectorAll('[data-played-ring]')[1];
    expect(kentRing.getAttribute('data-played-ring')).toBe('new');
    fireEvent.click(kentRing);
    expect(JSON.parse(window.localStorage.getItem(seenKey('me')) ?? '{}')).toEqual({ near: 'round:3', kent: 'round:4' });
    fireEvent.click(container.querySelectorAll('[data-played-ring]')[0]);
    expect(container.querySelectorAll('[data-played-ring]')[1].getAttribute('data-played-ring')).toBe('seen');
  });
  it('rest-of rail card with no top-ups (V3 §3, §4)', () => {
    f.counts = 0;
    const { container } = mount();
    const rail = container.querySelector('[data-region-rail]') as HTMLElement;
    expect(rail.textContent).toContain('BEYOND ENGLAND');
    expect(rail.querySelectorAll('[data-rail-card="played"]')).toHaveLength(1);
    expect(rail.querySelector('[data-rail-card="not-played"]')).toBeNull();
    expect(rail.querySelector('[data-rail-see-all]')).toBeNull();
  });
  it('contains every row at 320: the section clips and each row scrolls', () => {
    window.innerWidth = 320;
    const { container } = mount();
    const section = container.querySelector('[data-whats-been-played]') as HTMLElement;
    expect(section.style.overflow).toBe('hidden');
    for (const sel of ['[data-played-rings]', '[data-tile-row]']) expect((container.querySelector(sel) as HTMLElement).style.overflowX).toBe('auto');
    expect((container.querySelector('[data-tile-explore]') as HTMLElement).style.width).toBe('100%');
  });
  it('groups rounds busiest first with distinct faces', () => {
    const groups = groupRounds(f.hook.rounds.data);
    expect(groups.map((x) => x.courseId)).toEqual(['near', 'fife', 'kent']);
    expect(groups[0].faces.map((x) => x.userId)).toEqual(['cy', 'ann', 'bob']);
  });
});

describe('BRIEF_WHATS_BEEN_PLAYED_FIXES', () => {
  beforeEach(() => {
    window.localStorage.clear();
    f.session = { user: { id: 'me' }, loading: false };
    f.tile = { holes: [], photos: [], hardestHole: null, ready: true }; f.counts = 0;
    setHook([row('1', 'near', 'ann', 71), row('2', 'near', 'bob', 77, '2026-11-08'), row('4', 'kent', 'ann', 72), row('5', 'fife', 'dee', 79)],
      [placed(near, 'Sundridge Park Golf Club (East Course)'), placed(kent, 'Knole Park Golf Club'), placed(fife, 'St Andrews Links (Old Course)')]);
  });
  afterEach(cleanup);
  const present = (c: HTMLElement) => {
    expect(c.querySelector('[data-who-shell]')).toBeNull();
    for (const sel of ['[data-played-rings]', '[data-played-tile]', '[data-best-entry]']) expect(c.querySelector(sel)).not.toBeNull();
    expect(screen.getAllByRole('tab').length).toBeGreaterThan(0);
  };
  const photo = { kind: 'course', key: 'c:1', createdAt: '2026-11-10', imageUrl: 'x.jpg', caption: '', memberName: null };
  it('a ring selected with pending photo reads stays mounted with two placeholders, then swaps', () => {
    const { container, rerender } = mount();
    fireEvent.click(screen.getByRole('tab', { name: 'Kent' }));
    const rails = container.querySelector('[data-whats-been-played]')!.lastElementChild;
    f.tile = { holes: [], photos: [], hardestHole: null, ready: false };
    fireEvent.click(container.querySelectorAll('[data-played-ring]')[1]);
    present(container);
    expect(container.querySelectorAll('[data-tile-pending]')).toHaveLength(2);
    expect(container.querySelector('[data-whats-been-played]')!.lastElementChild).toBe(rails);
    f.tile = { holes: [], photos: [photo], hardestHole: null, ready: true };
    rerender(<QueryClientProvider client={new QueryClient()}><MemoryRouter><WhoPlayingSection /></MemoryRouter></QueryClientProvider>);
    expect(container.querySelectorAll('[data-tile-pending]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-tile-photo]')).toHaveLength(1);
  });
  it('a tab change with pending reads behaves the same', () => {
    const { container } = mount();
    f.tile = { holes: [], photos: [], hardestHole: null, ready: false };
    fireEvent.click(screen.getByRole('tab', { name: 'GB&I' }));
    present(container);
    expect(container.querySelectorAll('[data-tile-pending]')).toHaveLength(2);
  });
  it('a session resolving after cached rounds keeps the stored seen map', () => {
    window.localStorage.setItem(seenKey('me'), JSON.stringify({ fife: '5' }));
    setHook([row('1', 'near', 'ann', 71), row('2', 'near', 'bob', 77, '2026-11-08'), row('3', 'near', 'cy', 80), row('4', 'kent', 'ann', 72), row('5', 'fife', 'dee', 79)],
      [placed(near, 'Sundridge Park Golf Club (East Course)'), placed(kent, 'Knole Park Golf Club'), placed(fife, 'St Andrews Links (Old Course)')]);
    f.session = { user: null, loading: true };
    const { rerender } = mount();
    expect(window.localStorage.getItem(seenKey(null))).toBeNull();
    f.session = { user: { id: 'me' }, loading: false };
    rerender(<QueryClientProvider client={new QueryClient()}><MemoryRouter><WhoPlayingSection /></MemoryRouter></QueryClientProvider>);
    expect(JSON.parse(window.localStorage.getItem(seenKey('me')) ?? '{}')).toEqual({ fife: '5', near: 'round:3' });
    expect(window.localStorage.getItem(seenKey(null))).toBeNull();
  });
  it('the ring whose tile is showing counts as seen on load and after a tab change', () => {
    setHook([row('1', 'near', 'ann', 71), row('2', 'kent', 'bob', 70, '2026-11-08'), row('3', 'kent', 'cy', 75, '2026-11-12'), row('6', 'fife', 'dee', 80), row('7', 'fife', 'ed', 81), row('8', 'fife', 'fi', 82, '2026-11-13')],
      [placed(near, 'Sundridge Park Golf Club (East Course)'), placed(kent, 'Knole Park Golf Club'), placed(fife, 'St Andrews Links (Old Course)')]);
    const { container } = mount();
    expect(JSON.parse(window.localStorage.getItem(seenKey('me')) ?? '{}')).toEqual({ kent: 'round:3' });
    fireEvent.click(screen.getByRole('tab', { name: 'GB&I' }));
    expect(JSON.parse(window.localStorage.getItem(seenKey('me')) ?? '{}')).toEqual({ kent: 'round:3', fife: 'round:8' });
    expect([...container.querySelectorAll('[data-played-ring]')].map((r) => r.getAttribute('data-played-ring'))).toEqual(['selected', 'seen', 'new']);
  });
});

describe('hardest hole minimum', () => {
  it('shows at the minimum rounds and not one fewer', () => {
    expect(hardestHoleFromRanks([{ hole_no: 7, difficulty_rank: 1, rounds: HOLE_DIFFICULTY_MIN_ROUNDS }])).toBe(7);
    expect(hardestHoleFromRanks([{ hole_no: 7, difficulty_rank: 1, rounds: HOLE_DIFFICULTY_MIN_ROUNDS - 1 }])).toBeNull();
  });
});
