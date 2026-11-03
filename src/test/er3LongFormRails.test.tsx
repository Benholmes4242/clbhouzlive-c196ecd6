import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import courses from '../../public/locales/en/courses.json';
const f = vi.hoisted(() => ({ long: [] as unknown[], short: [] as unknown[], members: [] as unknown[], more: false, fetching: false, next: vi.fn(), momentRead: vi.fn(), open: vi.fn(), scroll: vi.fn() }));
vi.mock('@/features/explore-magazine/watch/useWatchVideos', () => ({ useWatchVideos: () => ({ data: { pages: [f.long] }, isFetched: true, hasNextPage: false }) }));
vi.mock('@/features/explore-magazine/watch/useWatchClips', () => ({ useWatchClips: () => ({ data: { pages: [f.short] }, isFetched: true, hasNextPage: f.more, isFetchingNextPage: f.fetching, fetchNextPage: f.next }) }));
vi.mock('@/features/explore-magazine/watch/useWatchSignals', () => ({ useWatchProgress: () => ({ data: new Map() }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek', () => ({ useMomentsOfTheWeek: (...args: unknown[]) => { f.momentRead(...args); return { data: f.members, isFetched: true }; } }));
vi.mock('@/hooks/gam/useUserAnalyticsCourses', () => ({ useUserAnalyticsCourses: () => ({ data: [] }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseLikes', () => ({ useClubhouseLikes: () => ({ getActiveLikeState: () => ({ isLiked: false, count: 0 }), handleLike: vi.fn() }) }));
vi.mock('@/features/explore-magazine/watch/WatchLead', () => ({ WatchLead: () => null }));
vi.mock('@/features/explore-magazine/watch/RoundsThisWeekShelf', () => ({ RoundsThisWeekShelf: () => null }));
vi.mock('@/features/explore-magazine/watch/RegionsShelf', () => ({ RegionsShelf: () => null }));
vi.mock('@/features/explore-magazine/watch/CreatorSpotlight', () => ({ CreatorSpotlight: () => null }));
vi.mock('@/features/explore-magazine/watch/Top100FilmShelf', () => ({ Top100FilmShelf: () => null }));
vi.mock('@/features/explore-magazine/watch/useWatchMiddle', () => ({ useCourseVideos: () => ({ data: [] }) }));
vi.mock('@/components/explore-tab-new/courseled/MomentTile', () => ({ MomentTile: ({ moment, onPress, autoplayGroup }: { moment: { key: string }; onPress: () => void; autoplayGroup: string }) => <button data-moment={moment.key} data-autoplay-group={autoplayGroup} onClick={onPress} /> }));
vi.mock('@/components/explore-tab-new/courseled/mediaRailAutoplay', () => ({ registerRailVideo: () => () => {}, IN_VIEW_THRESHOLD: 0.6, MAX_PLAYING: 1 }));
vi.mock('@/components/explore-tab-new/courseled/tileHlsPlayer', () => ({ attachTileHls: () => ({ detach: vi.fn() }) }));
vi.mock('@/components/explore-tab-new/courseled/reviewVideoAutoplay', () => ({ autoplayBlocked: () => false, deliverVerdict: vi.fn() }));
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ usePrefersReducedMotion: () => false }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: f.open }));
vi.mock('@/lib/getScrollParent', async (orig) => ({ ...(await orig<Record<string, unknown>>()), scrollPageToTop: f.scroll }));
import { WatchFeed } from '@/features/explore-magazine/watch/WatchFeed';
import { SHORTS_SHELF_COUNT, WOVEN_RAIL_INTERVAL, WOVEN_RAIL_MIN } from '@/features/explore-magazine/watch/watchRules';
const i18n = createInstance();
void i18n.init({ lng: 'en', initAsync: false, resources: { en: { courses } }, interpolation: { escapeValue: false } });
const rows = (count: number, short = false) => Array.from({ length: count }, (_, i) => ({ post_id: `${short ? 's' : 'l'}${i}`, duration_seconds: short ? 60 : 500, post_user_id: `creator-${i}`, creator_display_name: `Name ${i}`, post_content: `Title ${i}`, poster_url: `https://x/${i}.jpg` }));
const members = (count: number) => Array.from({ length: count }, (_, i) => ({ key: `m${i}`, post: { id: `p${i}`, userId: `u${i}`, displayName: `Member ${i}`, createdAt: '2026-11-03', mediaItems: [] }, courseName: 'Course', thumbnail: null }));
function Location() { const loc = useLocation(); return <output data-testid="loc">{loc.pathname + loc.search}</output>; }
const clients: QueryClient[] = [];
function tree(filter: string, client: QueryClient) { return <MemoryRouter><QueryClientProvider client={client}><I18nextProvider i18n={i18n}><WatchFeed userId="me" initialFilter={filter} onDepart={() => {}} /><Location /></I18nextProvider></QueryClientProvider></MemoryRouter>; }
function mount(filter = 'all') { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); clients.push(client); const view = render(tree(filter, client)); return { ...view, redraw: () => view.rerender(tree(filter, client)) }; }
const rails = () => Array.from(document.querySelectorAll('[data-woven-after]'));
const slot = (position: number) => document.querySelector(`[data-woven-after="${position}"]`);
beforeEach(() => { vi.clearAllMocks(); f.long = rows(40); f.short = rows(35, true); f.members = members(25); f.more = false; f.fetching = false; f.next.mockResolvedValue(undefined); });
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });
describe('ER3 woven rails', () => {
  it('uses ten top shorts, ten-video intervals and three-item minimum', () => { expect(SHORTS_SHELF_COUNT).toBe(10); expect(WOVEN_RAIL_INTERVAL).toBe(10); expect(WOVEN_RAIL_MIN).toBe(3); });
  it('top For you shelf shows ten while the Shorts grid shows everything', () => {
    mount(); expect(document.querySelector('[data-watch-rail="quick"]')?.children).toHaveLength(10);
    cleanup(); mount('quick'); expect(document.querySelector('[data-watch-grid="quick"]')?.children).toHaveLength(35);
  });
  it('40 long videos weave the right headings after 3, 13, 23 and 33', () => {
    mount(); expect(rails().map(el => el.getAttribute('data-woven-after'))).toEqual(['3', '13', '23', '33']);
    expect(slot(3)?.textContent).toContain('From the community'); expect(slot(13)?.textContent).toContain('More shorts');
    expect(slot(23)?.textContent).toContain('More from the community'); expect(slot(33)?.textContent).toContain('More shorts');
    for (const position of [3,13,23,33]) expect(slot(position)?.parentElement?.querySelector('[data-watch-card="long"]')?.textContent).toContain(`Title ${position - 1}`);
  });
  it('no short or grouped member repeats across the page and windows keep their existing order', () => {
    f.members = [...members(25), ...members(25)]; mount();
    const shorts = Array.from(document.querySelectorAll('[data-watch-short]'), el => el.getAttribute('data-watch-short'));
    const people = Array.from(document.querySelectorAll('[data-watch-member]'), el => el.getAttribute('data-watch-member'));
    expect(shorts).toHaveLength(30); expect(new Set(shorts).size).toBe(30); expect(shorts).toEqual(rows(30,true).map(row => row.post_id));
    expect(people).toHaveLength(20); expect(new Set(people).size).toBe(20); expect(people).toEqual(members(20).map(member => member.post.userId));
  });
  it('fewer than three unseen shorts skips those slots without changing later community positions', () => {
    f.short = rows(12,true); mount(); expect(slot(13)).toBeNull(); expect(slot(33)).toBeNull(); expect(slot(23)?.getAttribute('data-woven-kind')).toBe('community');
  });
  it('fewer than three community members skips the slot without changing the next Shorts position', () => {
    f.members = members(2); mount(); expect(slot(3)).toBeNull(); expect(slot(23)).toBeNull(); expect(slot(13)?.getAttribute('data-woven-kind')).toBe('shorts');
  });
  it.each([3,13,23,33])('never adds a rail after the final video at position %i', count => { f.long = rows(count); mount(); expect(slot(count)).toBeNull(); });
  it.each(['quick','long','community'])('does not weave rails on the %s chip', filter => { mount(filter); expect(rails()).toHaveLength(0); expect(f.next).not.toHaveBeenCalled(); });
  it('search disables all woven rails and restores the full top result shelf', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Search videos and creators' })); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Title' } });
    expect(rails()).toHaveLength(0); expect(document.querySelector('[data-watch-rail="quick"]')?.children).toHaveLength(35);
  });
  it('More shorts See all selects Shorts and scrolls to the top', () => {
    mount(); const button = Array.from(slot(13)?.querySelectorAll('button') ?? []).find(el => el.textContent === 'See all'); if (!button) throw new Error('Missing Shorts See all'); fireEvent.click(button);
    expect(screen.getByRole('tab', { name: 'Shorts' })).toHaveAttribute('aria-selected','true'); expect(f.scroll).toHaveBeenCalledOnce(); expect(rails()).toHaveLength(0);
  });
  it('community See all selects Community in place and scrolls to the top', () => {
    mount(); const button = Array.from(slot(23)?.querySelectorAll('button') ?? []).find(el => el.textContent === 'See all'); if (!button) throw new Error('Missing community See all'); fireEvent.click(button);
    expect(screen.getByTestId('loc').textContent).toBe('/');
    expect(screen.getByRole('tab', { name: 'Community' })).toHaveAttribute('aria-selected', 'true');
    expect(f.scroll).toHaveBeenCalledOnce();
  });
  it('takes one extra clips page before a short rail renders, once for that slot', async () => {
    f.long = rows(14); f.short = rows(12,true); f.more = true;
    let finish: (() => void) | undefined; f.next.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    const view = mount(); expect(slot(13)).toBeNull(); expect(f.next).toHaveBeenCalledOnce();
    view.redraw(); expect(f.next).toHaveBeenCalledOnce();
    await act(async () => { f.short = rows(18,true); finish?.(); }); view.redraw();
    await waitFor(() => expect(slot(13)?.querySelectorAll('[data-watch-short]')).toHaveLength(8)); expect(f.next).toHaveBeenCalledOnce();
  });
  it('an insufficient one-page refill skips the rail instead of retrying forever', async () => {
    f.long = rows(14); f.short = rows(11,true); f.more = true; mount();
    await waitFor(() => expect(f.next).toHaveBeenCalledOnce()); await act(async () => {});
    expect(slot(13)).toBeNull(); expect(f.next).toHaveBeenCalledOnce();
  });
  it('community keeps the 72 candidate read and shares the original autoplay group across rails', () => {
    mount(); expect(f.momentRead).toHaveBeenCalledWith(30, { enabled: true, candidateLimit: 72 });
    expect(document.querySelectorAll('[data-autoplay-group="amateur-watch-moments"]')).toHaveLength(20);
  });
  it('opens a later short at its correct index in the complete loaded viewer pool', () => {
    mount(); const button = document.querySelector('[data-watch-short="s20"]'); if (!button) throw new Error('Missing s20'); fireEvent.click(button);
    expect(f.open).toHaveBeenCalledWith(expect.objectContaining({ index: 20, posts: expect.any(Array) })); expect(f.open.mock.calls[0][0].posts).toHaveLength(35);
  });
});