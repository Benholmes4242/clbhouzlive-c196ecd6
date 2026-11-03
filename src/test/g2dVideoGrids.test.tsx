import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import locale from '../../public/locales/en/courses.json';
import { readFileSync } from 'node:fs';
import WatchGridPage from '@/pages/WatchGridPage';
import { resolveChrome } from '@/features/chrome-v2/registry';
import { IslandBackCapsule } from '@/features/chrome-v2/IslandBackCapsule';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';

const f = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[], regions: [{ region: 'Scotland', videos: 24, courses: 6 }], sources: [] as unknown[], track: vi.fn(), open: vi.fn() }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: f.track } }));
vi.mock('@/features/explore-magazine/watch/openVideoList', () => ({ openVideoList: f.open }));
vi.mock('@/features/explore-magazine/watch/useWatchMiddle', () => ({
  useWatchRegions: () => ({ data: f.regions }),
  useRegionCourses: () => ({ data: [{ course_id: 'st', course_name: 'St Andrews' }, { course_id: 'kb', course_name: 'Kingsbarns' }] }),
  useGridVideos: (_id: unknown, source: unknown) => { f.sources.push(source); return { data: { pages: [f.rows] }, isSuccess: true, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn() }; },
}));
// Real i18n avoids a partial mock affecting shared PageTitle/rail imports.
const lang = createInstance();
void lang.init({ lng: 'en', initAsync: false, resources: { en: { courses: locale } } });
const callbacks = new Map<Element, IntersectionObserverCallback>();
const original = window.IntersectionObserver;
let scroller: HTMLDivElement; let unregister: () => void;
function node(selector: string) { const value = document.querySelector<HTMLElement>(selector); if (!value) throw new Error(`Missing ${selector}`); return value; }
function pass(selector: string, bottom: number, intersecting = false) {
  const target = node(selector), callback = callbacks.get(target); if (!callback) throw new Error('Missing observer');
  act(() => callback([{ target, isIntersecting: intersecting, boundingClientRect: { bottom }, rootBounds: { top: 56 } } as unknown as IntersectionObserverEntry], {} as IntersectionObserver));
}
async function move(top: number) { scroller.scrollTop = top; await act(async () => { fireEvent.scroll(scroller); await new Promise(resolve => requestAnimationFrame(() => resolve(null))); }); }
function mount(kind: 'region' | 'courses' | 'top100', region = 'Scotland') {
  const path = kind === 'region' ? `/watch/region/${encodeURIComponent(region)}` : `/watch/${kind}`;
  return render(<MemoryRouter initialEntries={[path]}><I18nextProvider i18n={lang}><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <Routes><Route path={kind === 'region' ? '/watch/region/:region' : path} element={<><IslandBackCapsule label="Go back" onBack={() => {}} /><WatchGridPage kind={kind} /></>} /></Routes>
  </QueryClientProvider></I18nextProvider></MemoryRouter>);
}
beforeEach(() => {
  resetToExpanded(); callbacks.clear(); f.track.mockClear(); f.sources = []; f.regions = [{ region: 'Scotland', videos: 24, courses: 6 }];
  f.rows = []; f.open.mockClear();
  scroller = document.createElement('div'); scroller.id = 'root'; document.body.appendChild(scroller); unregister = registerNavScroller(scroller);
  window.IntersectionObserver = class { cb: IntersectionObserverCallback; constructor(cb: IntersectionObserverCallback) { this.cb = cb; } observe(target: Element) { callbacks.set(target, this.cb); } disconnect() {} unobserve() {} } as unknown as typeof IntersectionObserver;
});

const film = (extra: Record<string, unknown> = {}) => ({ post_id: 'film', poster_url: 'https://example.com/poster.jpg', duration_seconds: 56, course_name: 'Royal County Down · Championship', display_name: 'A creator with a complete long name', handle: 'creator', ...extra });
describe('TU1 two-up video grid', () => {
  it('uses two columns, 10px column gaps and 18px row gaps', () => {
    f.rows = [film()]; mount('top100'); const grid = node('[data-grid]');
    expect(grid.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
    expect(grid.style.columnGap).toBe('10px'); expect(grid.style.rowGap).toBe('18px');
    expect(grid.style.padding).toBe('0px 14px'); expect(grid.style.alignItems).toBe('start');
  });
  it('a positive Top 100 rank renders #4 with the existing glass chip', () => {
    f.rows = [film({ list_rank: 4 })]; mount('top100');
    expect(node('[data-grid-rank]').textContent).toBe('#4');
    expect(node('[data-grid-rank]')).toHaveClass('review-tile-chip');
  });
  it.each([undefined, 0, -1])('Top 100 rank %s renders no rank chip', rank => {
    f.rows = [film({ list_rank: rank })]; mount('top100'); expect(document.querySelector('[data-grid-rank]')).toBeNull();
  });
  it.each(['courses', 'region'] as const)('%s never renders a rank even when supplied', kind => {
    f.rows = [film({ list_rank: 4 })]; mount(kind); expect(document.querySelector('[data-grid-rank]')).toBeNull();
  });
  it('56 seconds renders the shared bottom-right 0:56 badge', () => {
    f.rows = [film()]; mount('courses'); const badge = node('[data-watch-badge="duration"]');
    expect(badge.textContent).toBe('0:56'); expect(badge.style.right).toBe('6px'); expect(badge.style.bottom).toBe('6px');
    expect(badge.closest('[data-grid-frame]')).toBeTruthy();
  });
  it('full course and creator text sit below the frame without truncation', () => {
    f.rows = [film()]; mount('courses');
    expect(node('[data-grid-course]').textContent).toBe('Royal County Down · Championship');
    expect(node('[data-grid-creator]').textContent).toBe('A creator with a complete long name');
    for (const selector of ['[data-grid-course]', '[data-grid-creator]']) {
      const text = node(selector); expect(text.style.whiteSpace).not.toBe('nowrap'); expect(text.style.textOverflow).not.toBe('ellipsis');
      expect(text.style.overflow).not.toBe('hidden'); expect(text.style.overflowWrap).toBe('anywhere');
      expect(text.parentElement).toBe(node('[data-grid-tile]'));
    }
  });
  it('no display name or handle omits the creator element', () => {
    f.rows = [film({ display_name: '', handle: '' })]; mount('courses'); expect(document.querySelector('[data-grid-creator]')).toBeNull();
  });
  it('a missing display name uses the full handle', () => {
    f.rows = [film({ display_name: '', handle: 'a-very-long-complete-handle' })]; mount('courses'); expect(node('[data-grid-creator]').textContent).toBe('a-very-long-complete-handle');
  });
  it('the entire second tile opens the loaded list at index one', () => {
    f.rows = [film(), film({ post_id: 'second' })]; mount('top100'); fireEvent.click(node('[data-grid-tile="second"]'));
    expect(f.open).toHaveBeenCalledOnce(); expect(f.open).toHaveBeenCalledWith(f.rows, 1);
    expect(f.track).toHaveBeenCalledWith('watch_grid_video_opened', { kind: 'top100' });
  });
  it('preserves portrait and semantic colour source values jsdom cannot retain', () => {
    const source = readFileSync('src/pages/WatchGridPage.tsx', 'utf8');
    expect(source).toContain("aspectRatio: '4 / 5'"); expect(source).toContain("background: 'var(--watch-grid-poster)'");
    expect(source).toContain("color: 'var(--watch-grid-rank-ink)'");
    expect(source).not.toContain('height: 172'); expect(source).not.toContain('DurationChip'); expect(source).not.toContain('linear-gradient');
  });
});
afterEach(() => { cleanup(); unregister(); scroller.remove(); resetToExpanded(); window.IntersectionObserver = original; });
describe('G2D video-grid islands', () => {
  it.each(['/watch/courses', '/watch/top100', '/watch/region/Scotland'])('%s has dark soft condensing islands and history back to /amateur', path => {
    expect(resolveChrome(path, new URLSearchParams())).toEqual({ chrome: 'island', tone: 'dark', bleed: true, scrim: 'soft', condense: true, left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/amateur' } });
  });
  it.each([['top100', 'Top 100 on film'], ['courses', 'Your courses']] as const)('%s uses its existing translated title with no header or dock', (kind, title) => {
    const view = mount(kind); expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(title);
    expect(view.container.querySelector('header')).toBeNull(); expect(view.container.querySelector('[aria-label="Back"]')).toBeNull(); expect(view.container.querySelector('[data-island-dock]')).toBeNull();
  });
  it('preserves the exact decoded region param and only prints available metadata', () => {
    const view = mount('region', 'Dún Laoghaire & Co'); expect(screen.getByRole('heading').textContent).toBe('Dún Laoghaire & Co'); expect(view.container.querySelector('.chrome-page-title-subtitle')).toBeNull();
    view.unmount(); mount('region'); expect(node('.chrome-page-title-subtitle').textContent).toBe('24 videos · 6 courses');
  });
  it('observes the actual h1 and shows its name only expanded past the title', async () => {
    mount('region'); pass('h1', 160, true); expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false');
    pass('h1', 55); expect(screen.getByRole('button', { name: 'Back from Scotland' })).toHaveAttribute('data-named', 'true');
    await move(160); expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false');
    await move(140); expect(screen.getByRole('button', { name: 'Back from Scotland' })).toBeTruthy();
  });
  it('docks region chips only past the row while expanded', async () => {
    mount('region'); const dock = node('[data-island-dock]'); expect(dock).toHaveAttribute('aria-hidden', 'true'); expect(dock).toHaveAttribute('inert');
    pass('[data-grid-chips]', 160, true); expect(dock).toHaveAttribute('data-shown', 'false'); pass('[data-grid-chips]', 55); expect(dock).toHaveAttribute('data-shown', 'true');
    await move(160); expect(dock).toHaveAttribute('data-shown', 'false'); await move(140); expect(dock).toHaveAttribute('data-shown', 'true');
  });
  it('keeps both chip copies, course-id reads and analytics synchronized', () => {
    mount('region'); pass('[data-grid-chips]', 55);
    fireEvent.click(node('[data-grid-dock-chip="kb"]')); expect(node('[data-grid-chip="kb"]')).toHaveAttribute('aria-pressed', 'true');
    expect(f.sources.at(-1)).toEqual({ kind: 'region', region: 'Scotland', courseId: 'kb' }); expect(f.track).toHaveBeenLastCalledWith('watch_grid_chip', { region: 'Scotland', course_id: 'kb' });
    fireEvent.click(node('[data-grid-chip="all"]')); expect(node('[data-grid-dock-chip="all"]')).toHaveAttribute('aria-selected', 'true'); expect(f.sources.at(-1)).toEqual({ kind: 'region', region: 'Scotland', courseId: null });
    const calls = f.track.mock.calls.length; fireEvent.click(node('[data-grid-dock-chip="all"]')); expect(f.track.mock.calls).toHaveLength(calls);
  });
});