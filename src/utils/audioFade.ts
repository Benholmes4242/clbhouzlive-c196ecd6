/**
 * Audio fade utility for smooth mute/unmute transitions
 * Apple-level polish: 150ms fade with ease-out curve
 */

const AUDIO_FADE_DURATION = 150; // ms

/**
 * Smoothly fade audio volume to a target level
 */
export const fadeAudio = (
  video: HTMLVideoElement,
  targetVolume: number,
  onComplete?: () => void
): (() => void) => {
  const startVolume = video.volume;
  const startTime = performance.now();
  let rafId: number;

  const fade = () => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / AUDIO_FADE_DURATION, 1);

    // Ease-out curve for natural feel
    const easeOut = 1 - Math.pow(1 - progress, 2);
    video.volume = startVolume + (targetVolume - startVolume) * easeOut;

    if (progress < 1) {
      rafId = requestAnimationFrame(fade);
    } else {
      video.volume = targetVolume; // Ensure exact target
      onComplete?.();
    }
  };

  rafId = requestAnimationFrame(fade);

  // Return cancel function
  return () => {
    cancelAnimationFrame(rafId);
  };
};

/**
 * Fade out audio then mute the video
 */
export const fadeOutAndMute = (video: HTMLVideoElement): Promise<void> => {
  return new Promise((resolve) => {
    if (video.muted || video.volume === 0) {
      video.muted = true;
      resolve();
      return;
    }

    fadeAudio(video, 0, () => {
      video.muted = true;
      resolve();
    });
  });
};

/**
 * Unmute then fade in audio
 */
export const unmuteAndFadeIn = (video: HTMLVideoElement): Promise<void> => {
  return new Promise((resolve) => {
    video.muted = false;
    video.volume = 0;

    fadeAudio(video, 1, () => {
      resolve();
    });
  });
};

/**
 * Toggle mute with smooth fade
 */
export const toggleMuteWithFade = async (video: HTMLVideoElement): Promise<boolean> => {
  if (video.muted || video.volume === 0) {
    await unmuteAndFadeIn(video);
    return false; // Not muted anymore
  } else {
    await fadeOutAndMute(video);
    return true; // Now muted
  }
};
