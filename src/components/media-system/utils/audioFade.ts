import { TIMING } from '../types/media';

const FADE_STEPS = TIMING.AUDIO_FADE_STEPS;
const STEP_INTERVAL = TIMING.AUDIO_FADE_MS / FADE_STEPS;

/**
 * Fade a video element's volume to 0 then pause.
 */
export function fadeOut(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    if (video.muted || video.volume === 0) {
      video.pause();
      resolve();
      return;
    }

    const startVolume = video.volume;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      video.volume = Math.max(0, startVolume * (1 - step / FADE_STEPS));

      if (step >= FADE_STEPS) {
        clearInterval(interval);
        video.volume = 0;
        video.pause();
        resolve();
      }
    }, STEP_INTERVAL);
  });
}

/**
 * Fade a video element's volume from 0 to targetVolume.
 */
export function fadeIn(video: HTMLVideoElement, targetVolume: number): Promise<void> {
  return new Promise((resolve) => {
    if (video.muted) {
      resolve();
      return;
    }

    video.volume = 0;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      video.volume = Math.min(targetVolume, targetVolume * (step / FADE_STEPS));

      if (step >= FADE_STEPS) {
        clearInterval(interval);
        video.volume = targetVolume;
        resolve();
      }
    }, STEP_INTERVAL);
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
