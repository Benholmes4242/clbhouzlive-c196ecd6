import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BufferingMonitor } from '@/video/bufferingMonitor';
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/utils/analyticsSession', () => ({ getSessionId: vi.fn(() => 'cb50') }));
import { analyticsEvents } from '@/utils/analyticsEvents';
import { getSessionId } from '@/utils/analyticsSession';
import { trackVisibleStall } from '@/video/stallAnalytics';

describe('CB50 measured buffering and visible stalls', () => {
  let sample = { currentTime: 0, firstFrame: false };
  let monitor: BufferingMonitor;
  const ended = vi.fn();
  beforeEach(() => {
    vi.useFakeTimers(); sample = { currentTime: 0, firstFrame: false }; ended.mockClear();
    monitor = new BufferingMonitor(() => sample, () => {}, ended);
  });
  afterEach(() => { monitor.stop('release'); vi.useRealTimers(); });
  it('starts at exactly 500ms, never at 499ms, with no waiting event', () => {
    monitor.start(); vi.advanceTimersByTime(499); expect(monitor.buffering).toBe(false);
    vi.advanceTimersByTime(1); expect(monitor.buffering).toBe(true);
  });
  it('clears synchronously on advancing currentTime with no hold-over', () => {
    monitor.start(); vi.advanceTimersByTime(500);
    sample.currentTime = 0.1; monitor.progress(); expect(monitor.buffering).toBe(false);
  });
  it('a first frame counts as immediate progress even at currentTime zero', () => {
    monitor.start(); vi.advanceTimersByTime(500); sample.firstFrame = true;
    monitor.progress(); expect(monitor.buffering).toBe(false);
  });
  it('native currentTime sampling catches progress without browser events', () => {
    monitor.start(); vi.advanceTimersByTime(450); sample.currentTime = 0.2;
    vi.advanceTimersByTime(50); expect(monitor.buffering).toBe(false);
    vi.advanceTimersByTime(499); expect(monitor.buffering).toBe(false);
    vi.advanceTimersByTime(1); expect(monitor.buffering).toBe(true);
  });
  it('no play intent has no timers and no buffering', () => {
    vi.advanceTimersByTime(2000); expect(monitor.buffering).toBe(false); expect(vi.getTimerCount()).toBe(0);
  });
  it.each(['pause', 'pauseAll', 'hidden'] as const)('stops immediately on %s and removes all timers', (reason) => {
    monitor.setPresented(true); monitor.start(); vi.advanceTimersByTime(700); monitor.stop(reason);
    expect(monitor.buffering).toBe(false); expect(vi.getTimerCount()).toBe(0);
    expect(ended).toHaveBeenCalledExactlyOnceWith({ phase: 'start', duration_ms: 200, ended_by: reason });
  });
  it('reports start over the poster once, only for the displayed duration', () => {
    monitor.setPresented(true); monitor.start(); vi.advanceTimersByTime(800);
    sample.currentTime = 0.1; monitor.progress(); monitor.progress();
    expect(ended).toHaveBeenCalledExactlyOnceWith({ phase: 'start', duration_ms: 300 });
  });
  it('reports mid phase and swipe interruption after a first frame', () => {
    sample.firstFrame = true; monitor.setPresented(true); monitor.start(); vi.advanceTimersByTime(750);
    monitor.setPresented(false, 'swipe'); monitor.stop('pause');
    expect(ended).toHaveBeenCalledExactlyOnceWith({ phase: 'mid', duration_ms: 250, ended_by: 'swipe' });
  });
  it('rails without a presenter and subthreshold stalls never report', () => {
    monitor.start(); vi.advanceTimersByTime(900); monitor.stop('pause'); expect(ended).not.toHaveBeenCalled();
    monitor.setPresented(true); monitor.start(); vi.advanceTimersByTime(499); monitor.stop('pause');
    expect(ended).not.toHaveBeenCalled();
  });
  it('caps video_stall at 30 per session with exact payload and resets for a new session', () => {
    sessionStorage.clear(); vi.mocked(getSessionId).mockReturnValue('cb50-cap'); vi.mocked(analyticsEvents.track).mockClear();
    for (let n = 0; n < 35; n++) trackVisibleStall('feed-active', 'profile', 'post:2', { phase: 'mid', duration_ms: 240, ended_by: 'close' });
    expect(analyticsEvents.track).toHaveBeenCalledTimes(30);
    expect(analyticsEvents.track).toHaveBeenLastCalledWith('video_stall', { lane: 'feed-active', surface: 'profile', post_id: 'post', phase: 'mid', duration_ms: 240, ended_by: 'close' });
    vi.mocked(getSessionId).mockReturnValue('cb50-next');
    trackVisibleStall('fullscreen', 'fullscreen', null, { phase: 'start', duration_ms: 30 });
    expect(analyticsEvents.track).toHaveBeenCalledTimes(31);
  });
});