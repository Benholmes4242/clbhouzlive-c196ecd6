import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const f = vi.hoisted(() => ({ hook: null as any, session: { user: { id: 'me' } as { id: string } | null, loading: false } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => f.session }));
vi.mock('@/components/courses/browse/usePlayedRounds', () => ({ usePlayedRounds: () => f.hook }));
vi.mock('@/features/pro-verification/InlineProMemberName', () => ({ InlineProMemberName: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
import { buildAreaTabs, orderRings, seenKey, type HomePlace, type PlacedCourse } from '@/components/courses/browse/playedRings';
import { WhoPlayingSection, BADGE_RADIUS, RING_ITEM_W, RING_GAP } from '@/components/courses/browse/WhoPlayingSection';
import { shareCourseName } from '@/lib/courses/shareCourseName';

const UKI = 'Britain & Ireland';
const c = (id: string, o: Partial<PlacedCourse>): PlacedCourse => ({ id, region: null, subCountry: null, country: null, continent: null, lat: null, lng: null, ...o });
const kentHome: HomePlace = { lat: 51.4, lng: 0.05, region: 'Kent', subCountry: 'England', country: UKI, continent: 'Europe' };
const all = [
  c('near', { region: 'Kent', subCountry: 'England', country: UKI, continent: 'Europe', lat: 51.41, lng: 0.06 }),
  c('kent', { region: 'Kent', subCountry: 'England', country: UKI, continent: 'Europe', lat: 51.2, lng: 1.35 }),
  c('eng', { region: 'Surrey', subCountry: 'England', country: UKI, continent: 'Europe' }),
  c('irl', { region: 'Kerry', subCountry: 'Ireland', country: UKI, continent: 'Europe' }),
  c('esp', { region: 'Andalusia', subCountry: 'Spain', country: 'Continental Europe', continent: 'Europe' }),
  c('usa', { region: 'California', subCountry: 'United States', country: 'Rest of World', continent: 'North America' }),
];

describe('area tabs', () => {
  it('runs narrowest first with every tab that has a course', () => {
    const tabs = buildAreaTabs(all, kentHome);
    expect(tabs.map((t) => t.id)).toEqual(['near', 'region', 'sub', 'uki', 'continent', 'c:United States']);
    expect(tabs.map((t) => t.label)).toEqual(['Near you', 'Kent', 'England', 'UK & Ireland', 'Europe', 'USA']);
    expect(tabs[0].courseIds).toEqual(['near']);
  });
  it('Near you needs home coordinates and a course within 40 km', () => {
    expect(buildAreaTabs(all, { ...kentHome, lat: null }).some((t) => t.id === 'near')).toBe(false);
    expect(buildAreaTabs(all.filter((x) => x.id !== 'near'), kentHome).some((t) => t.id === 'near')).toBe(false);
  });
  it('hides empty tabs', () => {
    expect(buildAreaTabs([all[5]], kentHome).map((t) => t.id)).toEqual(['c:United States']);
  });
  it('guests get no Near you or region', () => {
    const ids = buildAreaTabs(all, null).map((t) => t.id);
    expect(ids).not.toContain('near');
    expect(ids).not.toContain('region');
    expect(ids[0]).toBe('uki');
  });
});

describe('rings', () => {
  it('orders busiest first, then most recent', () => {
    const g = (courseId: string, rounds: number, latestDate: string) => ({ courseId, rounds, latestDate, latestScoreId: courseId });
    expect(orderRings([g('a', 2, '2026-11-01'), g('b', 5, '2026-10-01'), g('c', 2, '2026-11-10')]).map((x) => x.courseId)).toEqual(['b', 'c', 'a']);
  });
  it('splits the short name from the variant', () => {
    expect(shareCourseName('Sundridge Park Golf Club (East Course)')).toEqual({ short: 'Sundridge Park', variant: 'East Course' });
  });
});

const row = (id: string, course: string, date: string) => ({ whs_score_id: id, course_id: course, course_name: `${course.toUpperCase()} Golf Club (Old)`, play_date: date, user_id: `u${id}`, display_name: 'Ann', profile_photo_url: null, gross_score: 80, total_count: 0 });
const course = (id: string, o: Partial<PlacedCourse>) => ({ ...c(id, o), name: `${id.toUpperCase()} Golf Club (Old)`, imageUrl: null });
function setup() {
  const rows = [row('1', 'a', '2026-11-10'), row('2', 'a', '2026-11-09'), row('3', 'b', '2026-11-08'), row('4', 'c', '2026-11-07')];
  const meta = new Map([
    ['a', course('a', { region: 'Kent', subCountry: 'England', country: UKI, continent: 'Europe' })],
    ['b', course('b', { region: 'Kent', subCountry: 'England', country: UKI, continent: 'Europe' })],
    ['c', course('c', { region: 'California', subCountry: 'United States', country: 'Rest of World', continent: 'North America' })],
  ]);
  f.hook = { rounds: { data: rows, isFetched: true }, courses: { data: meta, isFetched: true }, ids: ['a', 'b', 'c'], home: { ...kentHome, lat: null }, homeReady: true };
}
const mount = () => render(<MemoryRouter><WhoPlayingSection /></MemoryRouter>);
const states = (el: HTMLElement) => [...el.querySelectorAll('[data-played-ring]')].map((n) => `${n.getAttribute('data-played-ring')}:${n.getAttribute('data-ring-state')}`);

beforeEach(() => { window.localStorage.clear(); setup(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('rings in the section', () => {
  it('badges counts, short names and variants, default selection on the narrowest tab', () => {
    const { container } = mount();
    expect(container.querySelector('[data-played-tabs] [aria-selected="true"]')?.textContent).toBe('Kent');
    expect([...container.querySelectorAll('[data-ring-badge]')].map((n) => n.textContent)).toEqual(['2', '1']);
    expect(container.querySelector('[data-ring-name]')?.textContent).toBe('A');
    expect(container.querySelector('[data-ring-variant]')?.textContent).toBe('Old');
    expect(states(container)).toEqual(['a:selected', 'b:new']);
  });
  it('ring colours follow new, seen and selected', () => {
    const { container } = mount();
    const bg = (id: string) => (container.querySelector(`[data-played-ring="${id}"] [data-ring]`) as HTMLElement).style.background;
    expect(bg('a')).toBe('rgb(248, 250, 252)');
    expect(bg('b')).toBe('rgb(247, 147, 30)');
    fireEvent.click(container.querySelector('[data-played-ring="b"]')!);
    expect(states(container)).toEqual(['a:seen', 'b:selected']);
    expect(bg('a')).toBe('rgba(255, 255, 255, 0.16)');
  });
  it('selecting marks seen across a reload', () => {
    mount(); cleanup();
    expect(JSON.parse(window.localStorage.getItem(seenKey('me'))!)).toEqual({ a: '1' });
    const { container } = mount();
    fireEvent.click(container.querySelector('[data-played-ring="b"]')!);
    expect(states(container)).toEqual(['a:seen', 'b:selected']);
  });
  it('storage that throws reads every course as new', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const { container } = mount();
    fireEvent.click(container.querySelector('[data-played-ring="b"]')!);
    expect(states(container)).toEqual(['a:new', 'b:selected']);
  });
  it('the badge is a 6px squircle and ring item clips its own text inside 72px', () => {
    const { container } = mount();
    expect((container.querySelector('[data-ring-badge]') as HTMLElement).style.borderRadius).toBe(`${BADGE_RADIUS}px`);
    expect(BADGE_RADIUS).toBe(6);
    const item = container.querySelector('[data-played-ring]') as HTMLElement;
    expect(item.style.width).toBe(`${RING_ITEM_W}px`);
    expect((container.querySelector('[data-played-rings]') as HTMLElement).style.overflowX).toBe('auto');
    expect((item.querySelector('[data-ring-name]') as HTMLElement).style.overflow).toBe('hidden');
    expect((item.querySelector('[data-ring-variant]') as HTMLElement).style.textOverflow).toBe('ellipsis');
    expect(RING_GAP).toBe(8);
  });
  it('tapping a tab changes the rings and selects the first', () => {
    const { container } = mount();
    fireEvent.click([...container.querySelectorAll('[data-played-tabs] [role="tab"], [data-played-tabs] button')].find((n) => n.textContent === 'USA')!);
    expect(states(container)).toEqual(['c:selected']);
  });
});
