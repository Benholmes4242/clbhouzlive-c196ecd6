import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import courses from '../../public/locales/en/courses.json';

const f = vi.hoisted(() => ({
  rows: [] as unknown[], moments: [] as unknown[], calls: vi.fn(), open: vi.fn(),
  fetched: true, error: false, more: false, retry: vi.fn(), creators: vi.fn(), autoplay: vi.fn(),
}));
vi.mock('@/features/explore-magazine/watch/useWatchVideos', () => ({ useWatchVideos: () => ({ data: { pages: [f.rows] }, isFetched: true, hasNextPage: f.more }) }));
vi.mock('@/features/explore-magazine/watch/useWatchClips', () => ({ useWatchClips: () => ({ data: { pages: [] }, isFetched: true, hasNextPage: false }) }));
vi.mock('@/features/explore-magazine/watch/useWatchSignals', () => ({ useWatchProgress: () => ({ data: new Map() }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek', () => ({ useMomentsOfTheWeek: (window: unknown, options: unknown) => { f.calls(window, options); return { data: f.moments, isFetched: f.fetched, isError: f.error, refetch: f.retry }; } }));
vi.mock('@/hooks/gam/useUserAnalyticsCourses', () => ({ useUserAnalyticsCourses: () => ({ data: [] }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseLikes', () => ({ useClubhouseLikes: () => ({ getActiveLikeState: () => ({ isLiked: false, count: 0 }), handleLike: vi.fn() }) }));
vi.mock('@/features/explore-magazine/watch/CreatorsRow', () => ({ CreatorsRow: f.creators }));
vi.mock('@/features/explore-magazine/watch/WatchLead', () => ({ WatchLead: () => <div data-er1-other="lead" /> }));
vi.mock('@/features/explore-magazine/watch/RoundsThisWeekShelf', () => ({ RoundsThisWeekShelf: () => null }));
vi.mock('@/features/explore-magazine/watch/CourseVideosShelf', () => ({ CourseVideosShelf: () => null, ShelfHeading: ({ title }: { title: string }) => <h2>{title}</h2> }));
vi.mock('@/features/explore-magazine/watch/RegionsShelf', () => ({ RegionsShelf: () => null }));
vi.mock('@/features/explore-magazine/watch/CreatorSpotlight', () => ({ CreatorSpotlight: () => null }));
vi.mock('@/features/explore-magazine/watch/Top100FilmShelf', () => ({ Top100FilmShelf: () => null }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: f.open }));
vi.mock('@/components/explore-tab-new/courseled/reviewVideoAutoplay', () => ({ autoplayBlocked: () => false, registerReviewVideo: f.autoplay }));
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ usePrefersReducedMotion: () => false }));
vi.mock('@/components/explore-tab-new/courseled/mediaRailAutoplay', () => ({ registerRailVideo: () => () => {}, IN_VIEW_THRESHOLD: 0.6, MAX_PLAYING: 1 }));

import { WatchFeed } from '@/features/explore-magazine/watch/WatchFeed';
import { ExploreTopControls } from '@/features/explore-magazine/watch/ExploreTopControls';
import { WATCH_CHIPS } from '@/features/explore-magazine/watch/watchFilters';

const i18n = createInstance();
void i18n.init({ lng: 'en', initAsync: false, resources: { en: { courses } }, interpolation: { escapeValue: false } });
function mount(filter = 'all') {
  return render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><I18nextProvider i18n={i18n}><WatchFeed userId="me" initialFilter={filter} onDepart={() => {}} /></I18nextProvider></QueryClientProvider></MemoryRouter>);
}
const row = (id: string, duration: number, owner = 'other', extra = {}) => ({ post_id: id, duration_seconds: duration, post_user_id: owner, actor_type: 'personal', caption: id, creator_display_name: id, poster_url: `https://x/${id}.jpg`, ...extra });
const moment = (key: string, owner: string, date: string, video = false) => ({ key, courseId: 'c', courseName: 'A course', thumbnail: `https://x/${key}.jpg`, mediaType: video ? 'video' : 'image', mediaIndex: 0, post: { id: key, userId: owner, displayName: key, createdAt: date, mediaItems: [{ type: video ? 'video' : 'image', hlsUrl: video ? 'https://x/v.m3u8' : undefined, imageUrl: `https://x/${key}.jpg` }] } });
beforeEach(() => { f.rows = []; f.moments = []; f.fetched = true; f.error = false; f.more = false; vi.clearAllMocks(); });
afterEach(cleanup);

describe('ER1 Explore', () => {
  it('never mounts CreatorsRow', () => { mount(); expect(f.creators).not.toHaveBeenCalled(); });
  it('requests the enabled all-time pool with 120 candidates', () => { mount('community'); expect(f.calls).toHaveBeenCalledWith(null, { enabled: true, candidateLimit: 120 }); });
  it('keeps the all-time pool disabled on For you', () => { mount(); expect(f.calls).toHaveBeenCalledWith(null, { enabled: false, candidateLimit: 120 }); });
  it('renders every item newest first, including repeated members, without autoplay and opens displayed order', () => {
    f.moments = [moment('old', 'other', '2026-10-01'), moment('new', 'other', '2026-11-01', true), moment('middle', 'another', '2026-10-15')];
    const { container } = mount('community');
    expect(Array.from(container.querySelectorAll('[data-community-item]')).map((el) => el.getAttribute('data-community-item'))).toEqual(['new', 'middle', 'old']);
    expect(container.querySelectorAll('[data-community-play]')).toHaveLength(1);
    expect(container.querySelector('video')).toBeNull();
    expect(f.autoplay).not.toHaveBeenCalled();
    expect(container.querySelector('[data-watch-card="quick"]')).toBeNull();
    expect(container.querySelector('[data-er1-other]')).toBeNull();
    const tile = container.querySelector('[data-community-item="middle"] button');
    expect(tile).toBeTruthy(); if (!tile) return; fireEvent.click(tile);
    expect(f.open).toHaveBeenCalledWith(expect.objectContaining({ index: 1, posts: expect.arrayContaining([expect.objectContaining({ id: 'middle' })]) }));
    expect(f.open.mock.calls[0][0].posts.map((p: { id: string }) => p.id)).toEqual(['new', 'middle', 'old']);
  });
  it('shows six loading squares', () => { f.fetched = false; const { container } = mount('community'); expect(container.querySelectorAll('[data-watch-grid-shell="community"] > div')).toHaveLength(6); });
  it('retries community errors', () => { f.error = true; mount('community'); fireEvent.click(screen.getByRole('button', { name: 'Try again' })); expect(f.retry).toHaveBeenCalledOnce(); });
  it('shows the existing empty state', () => { mount('community'); expect(screen.getByText('Nothing here yet. Try another filter.')).toBeTruthy(); });
  it.each(['all', 'quick', 'long'])('excludes own personal videos before rendering %s', (filter) => {
    f.rows = [row('own-short', 60, 'me'), row('own-long', 500, 'me'), row('other-short', 60), row('other-long', 500)];
    const { container } = mount(filter);
    expect(container.textContent).not.toContain('own-short'); expect(container.textContent).not.toContain('own-long');
    if (filter !== 'long') expect(container.querySelectorAll('[data-watch-card="quick"]')).toHaveLength(1);
  });
  it('uses actor id fallback while preserving business actor videos', () => {
    f.rows = [row('fallback-own', 60, 'me', { post_user_id: null, actor_id: 'me' }), row('business', 60, 'me', { actor_type: 'business' })];
    const { container } = mount('quick'); expect(container.textContent).not.toContain('fallback-own'); expect(container.textContent).toContain('business');
  });
  it('counts only the displayed Shorts', () => { f.rows = [row('own', 60, 'me'), row('other', 60)]; const { container } = mount('quick'); expect(container.querySelector('[data-watch-count]')?.textContent).toBe('1 clips'); });
  it('Showing n excludes own Shorts while more pages remain', () => {
    f.more = true;
    f.rows = [row('own', 60, 'me'), row('a', 60), row('b', 60)]; const { container } = mount('quick'); expect(container.querySelector('[data-watch-count]')?.textContent).toBe('Showing 2');
  });
  it.each(['all', 'quick', 'long', 'community'])('search preserves own videos from %s', (filter) => {
    f.rows = [row('own-short', 60, 'me'), row('own-long', 500, 'me')]; const { container } = mount(filter);
    fireEvent.click(screen.getByRole('button', { name: 'Search videos and creators' })); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'own' } });
    if (filter !== 'long') expect(container.textContent).toContain('own-short');
    if (filter !== 'quick') expect(container.textContent).toContain('own-long');
  });
  it('excludes own community items from the grid', () => { f.moments = [moment('own', 'me', '2026-11-02'), moment('other', 'other', '2026-11-01')]; const { container } = mount('community'); expect(container.querySelectorAll('[data-community-item]')).toHaveLength(1); expect(container.querySelector('[data-community-item="own"]')).toBeNull(); });
  it('excludes own community items before rail member grouping', () => {
    f.rows = [row('a', 500), row('b', 500), row('c', 500), row('d', 500)]; f.moments = [moment('own', 'me', '2026-11-02'), moment('other', 'other', '2026-11-01')];
    const { container } = mount(); expect(container.querySelectorAll('[data-watch-card="community"]')).toHaveLength(0); expect(container.querySelector('[data-watch-rail="community"]')).toBeNull();
  });
  it('smoothly reveals a clipped selected Community tile', () => {
    const scroll = vi.fn(); const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) { return { left: 0, right: this.classList.contains('explore-top-controls') ? 390 : this.getAttribute('aria-selected') === 'true' ? 440 : 100, top: 0, bottom: 34, width: 390, height: 34, x: 0, y: 0, toJSON() {} }; });
    const previous = HTMLElement.prototype.scrollBy; HTMLElement.prototype.scrollBy = scroll;
    try { render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><ExploreTopControls query="" onQuery={() => {}} options={WATCH_CHIPS.map((id) => ({ id, label: id }))} value="community" onChange={() => {}} ariaLabel="Filters" placeholder="Search" sticky={false} /></QueryClientProvider></MemoryRouter>); expect(scroll).toHaveBeenCalledWith({ left: 66, behavior: 'smooth' }); }
    finally { rect.mockRestore(); HTMLElement.prototype.scrollBy = previous; }
  });
});