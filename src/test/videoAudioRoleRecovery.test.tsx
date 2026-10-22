import React from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/utils/analyticsSession', () => ({ getSessionId: vi.fn(() => 'cb48') }));
vi.mock('@/store/fullscreenFeedStore', async () => {
  const { create } = await import('zustand');
  const useFullscreenFeedStore = create(() => ({ isOpen: false, borrow: null }));
  return { useFullscreenFeedStore };
});
import { VideoEngine, type LaneId } from '@/video/VideoEngine';
import { feedLaneRoles } from '@/video/feedLaneRoles';
import { useSessionAudio } from '@/audio/sessionAudioStore';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { audioDuck } from '@/audio/audioDuckStore';
import { MuteButton } from '@/audio/MuteButton';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { getSessionId } from '@/utils/analyticsSession';
import { getEntries, setAudioDebugEnabled } from '@/perf/audioDebug';

const tick = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
function element(id: LaneId): HTMLVideoElement {
  const el = VideoEngine._debugGetElement(id);
  if (!(el instanceof HTMLVideoElement)) throw new Error('Missing test lane');
  return el;
}
function hidden(value: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, value });
  document.dispatchEvent(new Event('visibilitychange'));
}
async function prepare(id: LaneId, owner = 'post:0') {
  VideoEngine.mountLane(id, document.body.appendChild(document.createElement('div')));
  VideoEngine.setAudioPolicy(id, 'session');
  VideoEngine.load(id, { hlsUrl: 'https://example.test/video.m3u8', postId: owner });
  await VideoEngine.play(id, { callerPostId: owner });
}

describe('CB48 engine sound roles and recovery', () => {
  let testSession = 0;
  beforeAll(() => vi.useFakeTimers());
  afterAll(() => vi.useRealTimers());
  beforeEach(async () => {
    vi.mocked(getSessionId).mockReturnValue(`cb48-${++testSession}`);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function () {
      Object.defineProperty(this, 'paused', { configurable: true, value: false });
      this.dispatchEvent(new Event('play'));
      return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function () {
      Object.defineProperty(this, 'paused', { configurable: true, value: true });
      this.dispatchEvent(new Event('pause'));
    });
    VideoEngine.boot();
    VideoEngine.pauseAll();
    useSessionAudio.getState().mute();
    VideoEngine.unblockFromGesture();
    useFullscreenFeedStore.setState({ isOpen: false, borrow: null });
    audioDuck.reset();
    feedLaneRoles.promoteToActive('feed-active');
    VideoEngine.setAudioFocus(null, 'feed');
    setAudioDebugEnabled(false);
    vi.mocked(analyticsEvents.track).mockClear();
    await tick();
  });
  afterEach(() => { cleanup(); VideoEngine.pauseAll(); vi.restoreAllMocks(); });

  it('resolves active on every role rotation, without rewriting focus or moving elements', async () => {
    await prepare('feed-active'); await prepare('feed-next', 'later:0');
    VideoEngine.setAudioFocus('active', 'feed');
    useSessionAudio.getState().unmute();
    const old = element('feed-active'); const next = element('feed-next');
    expect(old.muted).toBe(false);
    feedLaneRoles.rotate('down');
    expect(next.muted).toBe(false); expect(old.muted).toBe(true);
    expect(element('feed-next')).toBe(next);
    expect(VideoEngine.getAudioFocus().laneId).toBe('active');
  });
  it('retains physical close handoff until the feed writes active, with unchanged speaker', async () => {
    await prepare('feed-active');
    useSessionAudio.getState().unmute();
    VideoEngine.setAudioFocus('feed-active', 'fs-close-handoff');
    expect(element('feed-active').muted).toBe(false);
    VideoEngine.setAudioFocus('active', 'feed');
    expect(element('feed-active').muted).toBe(false);
  });
  it('heartbeat and reconciliation share focus and duck resolution', async () => {
    await prepare('feed-active'); await prepare('feed-next');
    setAudioDebugEnabled(true);
    VideoEngine.setAudioFocus('feed-next', 'feed'); useSessionAudio.getState().unmute();
    await vi.advanceTimersByTimeAsync(250);
    const beat = getEntries().filter((e) => e.event === 'heartbeat.state').at(-1);
    const decision = getEntries().filter((e) => e.event === 'reconcile.decision').at(-1);
    expect(beat?.data?.resolution).toEqual(decision?.data?.resolution);
    expect(beat?.data?.resolution).toMatchObject({ speaker: 'feed-next' });
    audioDuck.hold('review'); await vi.advanceTimersByTimeAsync(250);
    expect(element('feed-next').muted).toBe(true);
    expect(getEntries().filter((e) => e.event === 'heartbeat.state').at(-1)?.data?.resolution)
      .toMatchObject({ speaker: null, whyNone: 'ducked:review' });
  });
  it('remembers rejected sound, retries muted and never lets drift unmute it', async () => {
    await prepare('feed-active'); VideoEngine.setAudioFocus('active', 'feed'); useSessionAudio.getState().unmute();
    vi.spyOn(element('feed-active'), 'play').mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'));
    await VideoEngine.play('feed-active'); await tick();
    expect(VideoEngine.snapshot('feed-active').audioBlocked).toBe(true);
    await vi.advanceTimersByTimeAsync(1000);
    expect(element('feed-active').muted).toBe(true);
    expect(useSessionAudio.getState().isMuted).toBe(false);
    expect(analyticsEvents.track).toHaveBeenCalledWith('video_audio_blocked', expect.objectContaining({ lane: 'feed-active', trigger: 'autoplay', post_id: 'post' }));
  });
  it('detects an automatic unmute self-pause within 1000ms like a rejection', async () => {
    await prepare('feed-active'); await prepare('feed-next', 'later:0');
    VideoEngine.setAudioFocus('active', 'feed'); useSessionAudio.getState().unmute();
    feedLaneRoles.rotate('down');
    element('feed-next').pause(); await tick();
    expect(VideoEngine.isAudioBlocked('feed-next')).toBe(true);
    expect(element('feed-next').muted).toBe(true);
    expect(element('feed-next').paused).toBe(false);
    expect(analyticsEvents.track).toHaveBeenCalledWith('video_audio_blocked', expect.objectContaining({ trigger: 'unmute' }));
  });
  it('does not mistake an engine-issued pause for browser sound refusal', async () => {
    await prepare('feed-next'); VideoEngine.setAudioFocus('active', 'feed'); useSessionAudio.getState().unmute();
    feedLaneRoles.rotate('down'); VideoEngine.pause('feed-next');
    expect(VideoEngine.isAudioBlocked('feed-next')).toBe(false);
  });
  it('detects and recovers a self-pause within 1000ms after unblockFromGesture unmute', async () => {
    await prepare('feed-active');
    VideoEngine.setAudioFocus('active', 'feed');
    useSessionAudio.getState().unmute();
    vi.spyOn(element('feed-active'), 'play').mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'));
    await VideoEngine.play('feed-active'); await tick();
    expect(VideoEngine.isAudioBlocked('feed-active')).toBe(true);
    // A different owner keeps the per-post analytics dedupe from hiding
    // this second real refusal while the lane's blocked state is retained.
    await prepare('feed-active', 'gesture:0');
    VideoEngine.unblockFromGesture();
    expect(element('feed-active').muted).toBe(false);
    element('feed-active').pause(); await tick();
    expect(VideoEngine.isAudioBlocked('feed-active')).toBe(true);
    expect(element('feed-active').muted).toBe(true);
    expect(element('feed-active').paused).toBe(false);
    expect(analyticsEvents.track).toHaveBeenCalledWith('video_audio_blocked', expect.objectContaining({ post_id: 'gesture', trigger: 'unmute' }));
  });
  it('does not classify a later pause outside the 1000ms window as sound refusal', async () => {
    await prepare('feed-next'); VideoEngine.setAudioFocus('active', 'feed'); useSessionAudio.getState().unmute();
    feedLaneRoles.rotate('down'); await vi.advanceTimersByTimeAsync(1001); element('feed-next').pause();
    expect(VideoEngine.isAudioBlocked('feed-next')).toBe(false);
  });
  it('blocked icon tap writes unmuted synchronously and rescues without toggling session', async () => {
    await prepare('feed-active'); VideoEngine.setAudioFocus('active', 'feed'); useSessionAudio.getState().unmute();
    vi.spyOn(element('feed-active'), 'play').mockRejectedValueOnce(new DOMException('denied'));
    await VideoEngine.play('feed-active');
    render(<MuteButton laneId="feed-active" />);
    fireEvent.click(screen.getByRole('button', { name: 'Unmute' }));
    expect(element('feed-active').muted).toBe(false);
    expect(useSessionAudio.getState().isMuted).toBe(false);
    await act(tick);
    expect(analyticsEvents.track).toHaveBeenCalledWith('video_audio_unblocked', expect.objectContaining({ lane: 'feed-active', post_id: 'post' }));
  });
  it('session unmute clears remembered refusals inside its toggle', async () => {
    await prepare('feed-active'); VideoEngine.setAudioFocus('active', 'feed'); useSessionAudio.getState().unmute();
    vi.spyOn(element('feed-active'), 'play').mockRejectedValueOnce(new DOMException('denied'));
    await VideoEngine.play('feed-active');
    useSessionAudio.getState().mute(); useSessionAudio.getState().toggle();
    expect(VideoEngine.isAudioBlocked('feed-active')).toBe(false);
    expect(element('feed-active').muted).toBe(false);
  });
  it('controlled composer icon only calls its local toggle', () => {
    const local = vi.fn(); render(<MuteButton muted={false} onToggle={local} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }));
    expect(local).toHaveBeenCalledOnce(); expect(useSessionAudio.getState().isMuted).toBe(true);
  });
  it('resumes mounted same-owner intent on return but never deliberate pause', async () => {
    await prepare('feed-active'); await prepare('fullscreen', 'paused:0'); VideoEngine.pause('fullscreen', { viaViewer: true });
    hidden(true); expect(element('feed-active').paused).toBe(true);
    hidden(false); await tick();
    expect(element('feed-active').paused).toBe(false); expect(element('fullscreen').paused).toBe(true);
  });
  it('does not resume a recycled owner or unmounted host', async () => {
    await prepare('feed-active'); await prepare('feed-next'); hidden(true);
    VideoEngine.load('feed-active', { hlsUrl: 'https://example.test/other.m3u8', postId: 'new:0' });
    VideoEngine.unmountLane('feed-next'); hidden(false); await tick();
    expect(element('feed-active').paused).toBe(true); expect(element('feed-next').paused).toBe(true);
  });
  it('reports resumed sound refusal as resume and returns to muted playback', async () => {
    await prepare('feed-active'); VideoEngine.setAudioFocus('active', 'feed'); useSessionAudio.getState().unmute(); hidden(true);
    vi.spyOn(element('feed-active'), 'play').mockRejectedValueOnce(new DOMException('denied'));
    hidden(false); await tick();
    expect(VideoEngine.isAudioBlocked('feed-active')).toBe(true);
    expect(analyticsEvents.track).toHaveBeenCalledWith('video_audio_blocked', expect.objectContaining({ trigger: 'resume' }));
  });
  it('never promotes always-muted rail content inline', async () => {
    await prepare('rail-0'); VideoEngine.setAudioPolicy('rail-0', 'always-muted');
    VideoEngine.setAudioFocus('rail-0', 'rail'); useSessionAudio.getState().unmute();
    expect(element('rail-0').muted).toBe(true);
  });
});