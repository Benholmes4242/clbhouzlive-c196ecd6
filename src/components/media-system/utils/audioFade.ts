import { TIMING } from '../types/media';

const FADE_DURATION = TIMING.AUDIO_FADE_MS;

/**
 * Fade a video element's volume to 0 then pause.
 * Uses requestAnimationFrame instead of setInterval to avoid leaked timers.
 */
export function fadeOut(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    if (video.muted || video.volume === 0) {
      video.pause();
      resolve();
      return;
    }

    const startVolume = video.volume;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / FADE_DURATION);
      video.volume = Math.max(0, startVolume * (1 - progress));

      if (progress >= 1) {
        video.volume = 0;
        video.pause();
        resolve();
      } else {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  });
}

/**
 * Fade a video element's volume from 0 to targetVolume.
 * Uses requestAnimationFrame instead of setInterval to avoid leaked timers.
 */
export function fadeIn(video: HTMLVideoElement, targetVolume: number): Promise<void> {
  return new Promise((resolve) => {
    if (video.muted) {
      resolve();
      return;
    }

    video.volume = 0;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / FADE_DURATION);
      video.volume = Math.min(targetVolume, targetVolume * progress);

      if (progress >= 1) {
        video.volume = targetVolume;
        resolve();
      } else {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  });
}

/**
 * Crossfade audio between outgoing and incoming video elements.
 * In muted mode or during rapid scrolling, just pause immediately.
 */
export async function crossfadeTransition(
  outgoing: HTMLVideoElement | null,
  incoming: HTMLVideoElement,
  isMuted: boolean,
  isRapid: boolean
): Promise<void> {
  if (isMuted || isRapid) {
    if (outgoing) {
      outgoing.pause();
      outgoing.volume = 0;
    }
    return;
  }

  const fadeOutPromise = outgoing ? fadeOut(outgoing) : Promise.resolve();
  await new Promise((r) => setTimeout(r, 50));
  const fadeInPromise = fadeIn(incoming, 1.0);

  await Promise.all([fadeOutPromise, fadeInPromise]);
}
