/**
 * Safe video play utility with mobile-optimized autoplay handling
 * Handles readyState gating, iOS black frame fix, and autoplay errors
 */

export async function safePlay(video: HTMLVideoElement): Promise<boolean> {
  try {
    // Wait for video to have enough data to play
    if (video.readyState < 3) { // HAVE_FUTURE_DATA
      await new Promise<void>(resolve => {
        const onCanPlay = () => { 
          video.removeEventListener('canplay', onCanPlay); 
          resolve(); 
        };
        video.addEventListener('canplay', onCanPlay, { once: true });
      });
    }
    
    // iOS black-frame nudge - only if at beginning
    if (video.currentTime === 0) {
      try { 
        video.currentTime = 0.001; 
      } catch {
        // Ignore errors setting currentTime
      }
    }
    
    await video.play();
    return true;
  } catch (err: any) {
    if (err?.name === 'NotAllowedError') {
      // Respect environment; fall back to tap-to-play for this session
      video.setAttribute('data-autoplay-blocked', '1');
    }
    console.warn('[safePlay] play() failed', { 
      err, 
      readyState: video.readyState,
      src: video.src?.substring(0, 100) 
    });
    return false;
  }
}

/**
 * Environment detection utilities
 */
export const isInWebView = /(FBAN|FBAV|Instagram|Line|Messenger|Twitter|TikTok)/i.test(navigator.userAgent);

export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * iOS/iPad detection
 */
export const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);