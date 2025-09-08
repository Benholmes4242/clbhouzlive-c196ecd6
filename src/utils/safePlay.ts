/**
 * Safe video play utility with mobile-optimized autoplay handling
 * Handles readyState gating, iOS black frame fix, and autoplay errors
 */

export async function safePlay(video: HTMLVideoElement): Promise<boolean> {
  const videoId = video.src?.substring(video.src.lastIndexOf('/') + 1, video.src.lastIndexOf('/') + 9) || 'unknown';
  
  try {
    console.log(`[safePlay] Starting for video ${videoId}, readyState: ${video.readyState}, currentTime: ${video.currentTime}`);
    
    // Wait for video to have enough data to play
    if (video.readyState < 3) { // HAVE_FUTURE_DATA
      console.log(`[safePlay] Waiting for canplay event for video ${videoId}`);
      await new Promise<void>(resolve => {
        const onCanPlay = () => { 
          video.removeEventListener('canplay', onCanPlay); 
          console.log(`[safePlay] Got canplay for video ${videoId}, readyState: ${video.readyState}`);
          resolve(); 
        };
        video.addEventListener('canplay', onCanPlay, { once: true });
      });
    }
    
    // iOS black-frame nudge - only if at beginning
    if (video.currentTime === 0) {
      try { 
        video.currentTime = 0.001; 
        console.log(`[safePlay] Applied iOS nudge for video ${videoId}`);
      } catch {
        // Ignore errors setting currentTime
      }
    }
    
    console.log(`[safePlay] Attempting play() for video ${videoId}`);
    await video.play();
    console.log(`[safePlay] ✅ Successfully played video ${videoId}`);
    return true;
  } catch (err: any) {
    if (err?.name === 'NotAllowedError') {
      console.warn(`[safePlay] 🚫 NotAllowedError for video ${videoId} - marking as blocked`);
      // Respect environment; fall back to tap-to-play for this session
      video.setAttribute('data-autoplay-blocked', '1');
    } else {
      console.warn(`[safePlay] ❌ Play failed for video ${videoId}:`, err?.name || err);
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