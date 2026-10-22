/** CB50: 30 visible stalls per product analytics session, persisted across reloads.
 * Unlike audio refusals, separate stalls of the same post are separate events.
 */
import { analyticsEvents } from '@/utils/analyticsEvents';
import { getSessionId } from '@/utils/analyticsSession';
import type { LaneId } from './lanePolicy';
import type { VisibleStall } from './bufferingMonitor';
let sessionId = '';
let count = 0;
const STORAGE_KEY = 'clbhouz-stall-event-budget';
export function trackVisibleStall(lane: LaneId, surface: string, postId: string | null, stall: VisibleStall): void {
  const id = getSessionId();
  if (id !== sessionId) {
    sessionId = id;
    count = 0;
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
      if (saved?.id === id && Number.isInteger(saved.count) && saved.count >= 0) count = saved.count;
    } catch { /* in-memory budget still applies */ }
  }
  if (count >= 30) return;
  count++;
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id, count })); } catch {}
  const post = postId?.split(':')[0];
  void analyticsEvents.track('video_stall', { lane, surface, ...stall, ...(post ? { post_id: post } : {}) });
}