import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import locale from '../../public/locales/en/courses.json';
import WatchGridPage from '@/pages/WatchGridPage';
import { resolveChrome } from '@/features/chrome-v2/registry';
import { IslandBackCapsule } from '@/features/chrome-v2/IslandBackCapsule';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';

const f = vi.hoisted(() => ({ regions: [{ region: 'Scotland', videos: 24, courses: 6 }], sources: [] as unknown[], track: vi.fn(), open: vi.fn() }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: f.track } }));
vi.mock('@/features/explore-magazine/watch/openVideoList', () => ({ openVideoList: f.open }));
vi.mock('@/features/explore-magazine/watch/useWatchMiddle', () => ({
  useWatchRegions: () => ({ data: f.regions }),
  useRegionCourses: () => ({ data: [{ course_id: 'st', course_name: 'St Andrews' }, { course_id: 'kb', course_name: 'Kingsbarns' }] }),
  useGridVideos: (_id: unknown, source: unknown) => { f.sources.push(source); return { data: { pages: [[]] }, isSuccess: true, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn() }; },
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
  scroller = document.createElement('div'); scroller.id = 'root'; document.body.appendChild(scroller); unregister = registerNavScroller(scroller);
  window.IntersectionObserver = class { cb: IntersectionObserverCallback; constructor(cb: IntersectionObserverCallback) { this.cb = cb; } observe(target: Element) { callbacks.set(target, this.cb); } disconnect() {} unobserve() {} } as unknown as typeof IntersectionObserver;
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