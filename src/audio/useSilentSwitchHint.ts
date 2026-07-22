/**
 * silentSwitchHint — iOS silent-switch "tap to unmute" affordance.
 *
 * The iOS hardware silent switch silences all HTML5 <video> playback with
 * no reliable JS-side signal. Rather than pretend we can detect it, we
 * surface a one-time transient hint the first few times a user unmutes on
 * an iOS device: "If you can't hear audio, check your device silent
 * switch." Honest, low-cost, non-blocking.
 *
 * Deduped via sessionStorage — max 3 hints per session, then quiet.
 */

import { useEffect } from 'react';
import { useSessionAudio } from '@/audio/sessionAudioStore';
import { toast } from '@/lib/toast';
import { emitVideoTelemetry } from '@/video/telemetry';

const HINT_KEY = 'clbhouz-silent-switch-hint-count';
const MAX_HINTS = 3;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iPadOS = /Mac/.test(ua) && 'ontouchend' in document;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
}

function readCount(): number {
  try { return parseInt(sessionStorage.getItem(HINT_KEY) || '0', 10) || 0; } catch { return 0; }
}
function bumpCount() {
  try { sessionStorage.setItem(HINT_KEY, String(readCount() + 1)); } catch { /* ignore */ }
}

/** Mount once at the app root. Watches session-audio flips → hint on unmute. */
export function useSilentSwitchHint() {
  useEffect(() => {
    if (!isIOS()) return;
    let prev = useSessionAudio.getState().isMuted;
    const unsub = useSessionAudio.subscribe((s) => {
      const nowMuted = s.isMuted;
      if (prev && !nowMuted) {
        // muted → unmuted transition (user gesture).
        if (readCount() < MAX_HINTS) {
          bumpCount();
          emitVideoTelemetry('video.audio_denied', { hint: 'silent-switch', platform: 'ios' });
          try {
            toast('No sound? Check your device silent switch', {
              duration: 3500,
              id: 'silent-switch-hint',
            });
          } catch { /* toast optional */ }
        }
      }
      prev = nowMuted;
    });
    return () => unsub();
  }, []);
}
