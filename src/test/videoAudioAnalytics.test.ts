import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/utils/analyticsSession', () => ({ getSessionId: vi.fn(() => 'session') }));
import { trackAudioBlock } from '@/video/audioBlockAnalytics';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { getSessionId } from '@/utils/analyticsSession';
let sequence = 0;
beforeEach(() => {
  vi.mocked(getSessionId).mockReturnValue(`session-${++sequence}`);
  vi.mocked(analyticsEvents.track).mockClear();
});
it('caps blocked events at one per lane per post per session, regardless of media index', () => {
  trackAudioBlock('video_audio_blocked', 'feed-active', 'post:0', 'clubhouse', 'autoplay');
  trackAudioBlock('video_audio_blocked', 'feed-active', 'post:1', 'clubhouse', 'unmute');
  expect(analyticsEvents.track).toHaveBeenCalledTimes(1);
});
it('caps blocked events at 20 per session', () => {
  for (let i = 0; i < 25; i++) trackAudioBlock('video_audio_blocked', 'feed-active', `post-${i}`, 'clubhouse', 'autoplay');
  expect(analyticsEvents.track).toHaveBeenCalledTimes(20);
});
it('caps unblocked events independently at one per lane/post and 20 total', () => {
  for (let i = 0; i < 25; i++) {
    trackAudioBlock('video_audio_unblocked', 'feed-active', `post-${i}`, 'clubhouse');
    trackAudioBlock('video_audio_unblocked', 'feed-active', `post-${i}`, 'clubhouse');
  }
  expect(analyticsEvents.track).toHaveBeenCalledTimes(20);
  expect(vi.mocked(analyticsEvents.track).mock.calls[0]?.[1]).not.toHaveProperty('trigger');
});
it('uses a fresh budget when the canonical analytics session changes', () => {
  trackAudioBlock('video_audio_blocked', 'feed-active', 'post', 'profile', 'autoplay');
  vi.mocked(getSessionId).mockReturnValue('a-new-session');
  trackAudioBlock('video_audio_blocked', 'feed-active', 'post', 'profile', 'autoplay');
  expect(analyticsEvents.track).toHaveBeenCalledTimes(2);
});
it('omits unknown post metadata and keeps the minimal real-refusal payload', () => {
  trackAudioBlock('video_audio_blocked', 'fullscreen', null, 'fullscreen', 'resume');
  expect(analyticsEvents.track).toHaveBeenCalledWith('video_audio_blocked', {
    lane: 'fullscreen', surface: 'fullscreen', platform: expect.any(String), trigger: 'resume',
  });
});