import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import courses from '../../src/locales/en/courses.json';
const f = vi.hoisted(() => ({ long: [] as unknown[], short: [] as unknown[], members: [] as unknown[], more: false, fetching: false, next: vi.fn(), momentRead: vi.fn(), open: vi.fn(), scroll: vi.fn() }));
vi.mock('@/features/explore-magazine/watch/useWatchVideos', () => ({ useWatchVideos: () => ({ data: { pages: [f.long] }, isFetched: true, hasNextPage: false }) }));
vi.mock('@/features/explore-magazine/watch/useWatchClips', () => ({ useWatchClips: () => ({ data: { pages: [f.short] }, isFetched: true, hasNextPage: f.more, isFetchingNextPage: f.fetching, fetchNextPage: f.next }) }));
vi.mock('@/features/explore-magazine/watch/useWatchSignals', () => ({ useWatchProgress: () => ({ data: new Map() }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek', () => ({ useMomentsOfTheWeek: (...args: unknown[]) => { f.momentRead(...args); return { data: f.members, isFetched: true }; } }));
vi.mock('@/hooks/gam/useUserAnalyticsCourses', () => ({ useUserAnalyticsCourses: () => ({ data: [] }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseLikes', () => ({ useClubhouseLikes: () => ({ getActiveLikeState: () => ({ isLiked: false, count: 0 }), handleLike: vi.fn() }) }));
vi.mock('@/features/explore-magazine/watch/WatchLead', () => ({ WatchLead: () => null }));
vi.mock('@/features/explore-magazine/watch/CreatorSpotlight', () => ({ CreatorSpotlight: () => null }));
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
  it.each([3,13,23,33])('never adds a rail after the final video at position %i', count => { f.long = rows(count); mount(); expect(slot(count)).toBeNull(); });
  it.each(['quick','long','community'])('does not weave rails on the %s chip', filter => { mount(filter); expect(rails()).toHaveLength(0); expect(f.next).not.toHaveBeenCalled(); });
  it('search disables all woven rails and restores the full top result shelf', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Search videos and creators' })); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Title' } });
    expect(rails()).toHaveLength(0); expect(document.querySelector('[data-watch-rail="quick"]')?.children).toHaveLength(35);
  });
});