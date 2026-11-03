import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const f = vi.hoisted(() => ({ activate: null as null | ((active: boolean) => void), detach: vi.fn(), lead: null as unknown }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/components/explore-tab-new/courseled/mediaRailAutoplay', () => ({ registerRailVideo: (_el: Element, cb: (active: boolean) => void) => { f.activate = cb; return () => {}; } }));
vi.mock('@/components/explore-tab-new/courseled/tileHlsPlayer', () => ({ attachTileHls: () => ({ detach: f.detach }) }));
vi.mock('@/components/explore-tab-new/courseled/reviewVideoAutoplay', () => ({ autoplayBlocked: () => false }));
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ usePrefersReducedMotion: () => false }));
vi.mock('@/features/explore-magazine/watch/useWatchLead', () => ({ useWatchLead: () => ({ data: f.lead, isFetched: true, isError: false }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
import { AutoplayLayer } from '@/features/explore-magazine/watch/videoUnit';
import { WatchLead } from '@/features/explore-magazine/watch/WatchLead';

function videoIn(container: HTMLElement) { const video = container.querySelector('video'); if (!video) throw new Error('Missing preview video'); Object.defineProperty(video, 'duration', { configurable: true, value: 20 }); return video; }
function activate() { act(() => f.activate?.(true)); }
beforeEach(() => { f.activate = null; f.detach.mockClear(); vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(); vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('VIDEO_POSTERS_1 AutoplayLayer', () => {
  it('waits for metadata and seeks to the poster before play', () => {
    const view = render(<AutoplayLayer hlsUrl="/hls" poster="/poster?time=7s" />); const video = videoIn(view.container); activate(); expect(video.play).not.toHaveBeenCalled();
    const starts: number[] = []; vi.mocked(video.play).mockImplementation(() => { starts.push(video.currentTime); return Promise.resolve(); }); fireEvent.loadedMetadata(video); expect(starts).toEqual([7]);
  });
  it('stays hidden before playing and ignores playing before the start point', () => {
    const view = render(<AutoplayLayer hlsUrl="/hls" poster="/poster?time=7s" />); const video = videoIn(view.container); activate(); fireEvent.playing(video); expect(video.style.opacity).toBe('0'); fireEvent.loadedMetadata(video); expect(video.style.opacity).toBe('0'); video.currentTime = 0; fireEvent.playing(video); expect(video.style.opacity).toBe('0'); video.currentTime = 7; fireEvent.playing(video); expect(video.style.opacity).toBe('1');
  });
  it('waits for seeked before play when a real seek is pending', () => {
    const view = render(<AutoplayLayer hlsUrl="/hls" poster="/poster?time=7s" />); const video = videoIn(view.container); activate(); Object.defineProperty(video, 'seeking', { configurable: true, value: true }); fireEvent.loadedMetadata(video); expect(video.play).not.toHaveBeenCalled(); Object.defineProperty(video, 'seeking', { configurable: true, value: false }); fireEvent.seeked(video); expect(video.play).toHaveBeenCalledOnce();
  });
  it('restarts at the poster on ended without native looping', () => {
    const view = render(<AutoplayLayer hlsUrl="/hls" poster="/poster?time=7s" />); const video = videoIn(view.container); activate(); fireEvent.loadedMetadata(video); fireEvent.playing(video); video.currentTime = 20; fireEvent.ended(video); expect(video.loop).toBe(false); expect(video.currentTime).toBe(7); expect(video.play).toHaveBeenCalledTimes(2); expect(video.style.opacity).toBe('0'); fireEvent.playing(video); expect(video.style.opacity).toBe('1');
  });
  it.each([null, '/poster.jpg', '/poster?time=0s', '/poster?time=19s', '/poster?time=30s'])('falls back to zero for %s', poster => {
    const view = render(<AutoplayLayer hlsUrl="/hls" poster={poster} />); const video = videoIn(view.container); activate(); video.currentTime = 4; fireEvent.loadedMetadata(video); expect(video.currentTime).toBe(0); expect(video.play).toHaveBeenCalledOnce();
  });
  it('cleans metadata and repeat handlers when inactive', () => {
    const view = render(<AutoplayLayer hlsUrl="/hls" poster="/poster?time=7s" />); const video = videoIn(view.container); activate(); act(() => f.activate?.(false)); fireEvent.loadedMetadata(video); fireEvent.ended(video); expect(video.play).not.toHaveBeenCalled(); expect(f.detach).toHaveBeenCalledOnce();
  });
});
describe('VIDEO_POSTERS_1 WatchLead', () => {
  it('shares metadata-gated poster start and repeat while fullscreen intent remains zero', () => {
    f.lead = { post_id: 'post', actor_type: 'personal', actor_id: 'member', display_name: 'Golfer', handle: 'golfer', poster_url: '/poster?time=7s', hls_url: '/hls', created_at: '2026-11-01T00:00:00Z', duration_seconds: 20, width: 1920, height: 1080, reason: 'new', like_count: 0, comment_count: 0 };
    const view = render(<MemoryRouter><WatchLead userId="member" onDepart={() => {}} /></MemoryRouter>); const video = videoIn(view.container); activate(); expect(video.play).not.toHaveBeenCalled(); fireEvent.loadedMetadata(video); expect(video.currentTime).toBe(7); expect(video.style.opacity).toBe('0'); fireEvent.playing(video); expect(video.style.opacity).toBe('1'); fireEvent.ended(video); expect(video.currentTime).toBe(7); expect(video.loop).toBe(false); expect(video.style.opacity).toBe('0');
  });
});