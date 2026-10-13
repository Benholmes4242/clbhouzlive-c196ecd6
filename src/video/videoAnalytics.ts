/**
 * VIDEO IS RECORDED (BRIEF_MEMBERS_RADAR 1.6). One tracker per lane, fed by
 * VideoEngine.wireElementEvents. Emits video_play, video_progress (25/50/75),
 * video_complete and video_watch { seconds actually played }.
 * At most one of each milestone per post+media per session.
 */
import { analyticsEvents } from '@/utils/analyticsEvents';
import { getSessionId } from '@/utils/analyticsSession';

type Surface = 'feed' | 'fullscreen' | 'carousel';

const fired = new Set<string>();

export function surfaceForLane(laneId: string): Surface {
  if (laneId.startsWith('fullscreen')) return 'fullscreen';
  if (laneId.startsWith('rail-')) return 'carousel';
  return 'feed';
}

export function splitLanePostId(raw: string): { postId: string; mediaIndex: number } {
  const i = raw.lastIndexOf(':');
  if (i > 0 && /^\d+$/.test(raw.slice(i + 1))) {
    return { postId: raw.slice(0, i), mediaIndex: Number(raw.slice(i + 1)) };
  }
  return { postId: raw, mediaIndex: 0 };
}

function once(kind: string, postId: string, mediaIndex: number): boolean {
  const key = `${getSessionId()}|${postId}|${mediaIndex}|${kind}`;
  if (fired.has(key)) return false;
  fired.add(key);
  return true;
}

export class LaneVideoTracker {
  private rawPostId: string | null = null;
  private played = 0;
  private lastTime: number | null = null;
  private passed90 = false;

  constructor(private laneId: string) {}

  private props(el: HTMLVideoElement) {
    const { postId, mediaIndex } = splitLanePostId(this.rawPostId!);
    const d = el.duration;
    return {
      post_id: postId,
      media_index: mediaIndex,
      duration_sec: isFinite(d) && d > 0 ? Math.round(d * 10) / 10 : null,
      surface: surfaceForLane(this.laneId),
    };
  }

  private sync(rawPostId: string | null, el: HTMLVideoElement) {
    if (rawPostId === this.rawPostId) return;
    this.flush(el);
    this.rawPostId = rawPostId;
    this.played = 0;
    this.lastTime = null;
    this.passed90 = false;
  }

  onPlay(rawPostId: string | null, el: HTMLVideoElement) {
    this.sync(rawPostId, el);
    if (!this.rawPostId) return;
    this.lastTime = el.currentTime || 0;
    const p = this.props(el);
    if (once('play', p.post_id, p.media_index)) analyticsEvents.track('video_play', p);
  }

  onTime(rawPostId: string | null, el: HTMLVideoElement) {
    this.sync(rawPostId, el);
    if (!this.rawPostId || el.paused) return;
    const t = el.currentTime || 0;
    const d = el.duration;
    if (this.lastTime !== null) {
      const delta = t - this.lastTime;
      if (delta > 0 && delta < 1.5) this.played += delta;
      // Short-clip JS loop: wrap after having passed 90% = a completion.
      if (delta < 0 && this.passed90) this.complete(el);
    }
    this.lastTime = t;
    if (!(isFinite(d) && d > 0)) return;
    const pct = t / d;
    if (pct >= 0.9) this.passed90 = true;
    if (pct < 0.5 && delta0(this.lastTime)) this.passed90 = this.passed90 && pct >= 0.9;
    const p = this.props(el);
    for (const m of [25, 50, 75] as const) {
      if (pct * 100 >= m && once(`p${m}`, p.post_id, p.media_index)) {
        analyticsEvents.track('video_progress', { ...p, pct: m });
      }
    }
  }

  private complete(el: HTMLVideoElement) {
    this.passed90 = false;
    if (!this.rawPostId) return;
    const p = this.props(el);
    if (once('complete', p.post_id, p.media_index)) analyticsEvents.track('video_complete', p);
  }

  onEnded(el: HTMLVideoElement) {
    this.complete(el);
  }

  /** Lane deactivated, paused, detached, or post changed. */
  flush(el: HTMLVideoElement) {
    if (!this.rawPostId || this.played < 0.5) { this.played = 0; return; }
    const seconds = Math.round(this.played);
    this.played = 0;
    const p = this.props(el);
    if (once('watch', p.post_id, p.media_index)) analyticsEvents.track('video_watch', { ...p, seconds });
  }
}

function delta0(_t: number | null) { return false; }
