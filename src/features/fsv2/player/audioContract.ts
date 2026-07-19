/**
 * Audio contract (v1 defect 1 — full fix).
 *
 * Two rules make this work on iOS:
 *
 *   1. The first `.play()` MUST issue synchronously inside the tap
 *      handler's call stack, on an element that already has its `muted`
 *      flag set to the session's authoritative value. Any `await`
 *      before that call spends the gesture token and iOS refuses
 *      unmuted playback.
 *
 *   2. The mute button in chrome calls `useSessionAudio.toggle()` and
 *      NOTHING ELSE. The overlay subscribes to `useSessionAudio` and
 *      pushes `el.muted = state.isMuted` to the element. One source
 *      of truth, both directions live.
 *
 * The pre-warm registry hands the element created inside a tap over to
 * the overlay's VideoSlot at mount. If the unmuted play() rejects, we
 * degrade to muted, retry, and signal `needsTapForSound`.
 */

import { useSessionAudio } from '@/audio/sessionAudioStore';

import type { Fsv2Source } from './fsv2Player';
import { attach } from './fsv2Player';

interface PreWarmed {
  openId: string;
  el: HTMLVideoElement;
  detach: () => void;
  needsTapForSound: boolean;
}

const preWarmed = new Map<string, PreWarmed>();

const PARK_ATTR = 'data-fsv2-prewarm';

/**
 * Style an element as a full-viewport, in-DOM, invisible parked video.
 * Full layout size is REQUIRED at src-set time so iOS native HLS picks a
 * real video rendition rather than the audio-only Cloudflare variant.
 */
export function parkVideoElement(el: HTMLVideoElement): void {
  el.style.position = 'fixed';
  el.style.top = '0';
  el.style.left = '0';
  el.style.width = '100vw';
  el.style.height = '100dvh';
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  el.style.zIndex = '-1';
  el.style.background = 'transparent';
  el.style.transition = '';
  el.setAttribute(PARK_ATTR, 'parked');
  if (typeof document !== 'undefined' && el.parentElement !== document.body) {
    try { document.body.appendChild(el); } catch { /* ignore */ }
  }
}

/** Remove any stale parked video elements from prior opens. */
function purgeStaleParked(): void {
  if (typeof document === 'undefined') return;
  const nodes = document.querySelectorAll<HTMLVideoElement>(`video[${PARK_ATTR}]`);
  nodes.forEach((n) => {
    try { n.pause(); } catch { /* ignore */ }
    try { n.removeAttribute('src'); n.load(); } catch { /* ignore */ }
    try { n.remove(); } catch { /* ignore */ }
  });
}

/**
 * Create a <video> element synchronously inside a tap handler, attach
 * the source, and issue the first play(). Returns the element so the
 * overlay's VideoSlot can adopt it on mount.
 *
 * Idempotent per openId. Safe to no-op if the media isn't a video.
 */
export function preWarmVideoForGesture(
  openId: string,
  source: Fsv2Source,
  startPosition?: number,
): void {
  if (typeof document === 'undefined') return;
  if (!source.hlsUrl && !source.mp4Url) return;
  if (preWarmed.has(openId)) return;

  purgeStaleParked();

  const isMuted = useSessionAudio.getState().isMuted;

  const el = document.createElement('video');
  el.setAttribute(PARK_ATTR, openId);
  // Park sized BEFORE src is set inside attach() — full viewport layout so
  // Cloudflare/iOS pick a real video rendition, not audio-only.
  parkVideoElement(el);
  el.setAttribute(PARK_ATTR, openId);

  const record: PreWarmed = {
    openId,
    el,
    needsTapForSound: false,
    detach: () => {
      /* replaced after attach() */
    },
  };
  preWarmed.set(openId, record);

  // Kick play() SYNCHRONOUSLY inside the caller's tap stack. `attach()`
  // is async only for the hls.js dynamic import — the important call,
  // el.play(), fires immediately below to consume the gesture token.
  attach(el, source, {
    muted: isMuted,
    startPosition,
  }).then((handle) => {
    record.detach = () => {
      handle.detach();
      try { el.remove(); } catch { /* ignore */ }
    };
  }).catch(() => {
    record.detach = () => {
      try { el.remove(); } catch { /* ignore */ }
    };
  });

  // Fire the play() now, BEFORE any await lands, using whatever
  // src/hls.js state is available. On iOS Safari with a native-HLS
  // el.src assignment inside `attach()` this executes on the same
  // stack; the ordering is: attach() sets el.src synchronously (native
  // HLS path) OR queues an hls.js load (MSE path). Either way we call
  // play() now so the gesture is claimed.
  //
  // NOTE: we do NOT await the play() promise here; that would defeat
  // the point. If it rejects we handle it via the .catch() below.
  const p = el.play();
  if (p && typeof p.then === 'function') {
    p.catch(() => {
      // Unmuted play refused. Degrade to muted, retry, and flag.
      if (!isMuted) {
        el.muted = true;
        record.needsTapForSound = true;
        try { el.play().catch(() => { /* still no dice */ }); } catch { /* ignore */ }
      }
    });
  }
}

export function takePreWarmed(openId: string): PreWarmed | null {
  const rec = preWarmed.get(openId);
  if (!rec) return null;
  preWarmed.delete(openId);
  return rec;
}

export function dropPreWarmed(openId: string): void {
  const rec = preWarmed.get(openId);
  if (!rec) return;
  preWarmed.delete(openId);
  try { rec.detach(); } catch { /* ignore */ }
}
