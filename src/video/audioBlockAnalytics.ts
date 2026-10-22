/** CB48: real refusals use the product analytics session, never sampled video telemetry.
 * Each event has its own lane/post dedupe and 20-event ceiling, persisted so a
 * same-session reload cannot reset the ceiling. No member/WHS metadata is added.
 */
import { analyticsEvents } from '@/utils/analyticsEvents';
import { getSessionId } from '@/utils/analyticsSession';
import type { LaneId } from './lanePolicy';

export type AudioBlockTrigger = 'autoplay' | 'unmute' | 'resume';
type AudioEvent = 'video_audio_blocked' | 'video_audio_unblocked';
type Budget = { blocked: string[]; unblocked: string[] };
let sessionId = '';
let budget: Budget = { blocked: [], unblocked: [] };
const STORAGE_KEY = 'clbhouz-audio-event-budget';

export function trackAudioBlock(
  event: AudioEvent,
  lane: LaneId,
  postId: string | null,
  surface: string,
  trigger?: AudioBlockTrigger,
): void {
  const id = getSessionId();
  if (id !== sessionId) {
    sessionId = id;
    budget = { blocked: [], unblocked: [] };
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
      if (saved?.id === id && Array.isArray(saved.blocked) && Array.isArray(saved.unblocked)) {
        budget = { blocked: saved.blocked, unblocked: saved.unblocked };
      }
    } catch { /* in-memory caps still apply */ }
  }
  // Engine ownership may be postId:mediaIndex. Analytics dedupes by POST.
  const post = postId?.split(':')[0] ?? null;
  const key = JSON.stringify([lane, post]);
  const seen = event === 'video_audio_blocked' ? budget.blocked : budget.unblocked;
  if (seen.length >= 20 || seen.includes(key)) return;
  seen.push(key);
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id, ...budget })); } catch {}
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Mac/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document);
  const platform = ios ? 'ios' : /Android/.test(ua) ? 'android' : 'web';
  void analyticsEvents.track(event, {
    lane, surface, platform,
    ...(trigger ? { trigger } : {}),
    ...(post ? { post_id: post } : {}),
  });
}