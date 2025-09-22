/**
 * Safe video play utility with mobile-optimized autoplay handling
 * Handles readyState gating, iOS black frame fix, retry logic, and visibility handling
 */

// Removed feature flag - safe autoplay always enabled
import { logVideoTelemetry } from './videoTelemetry';

interface SafePlayOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxWaitTime?: number;
}

export async function safePlay(
  video: HTMLVideoElement, 
  options: SafePlayOptions = {}
): Promise<boolean> {
  // Safe autoplay v2 always enabled in production

  const { maxRetries = 4, baseDelay = 250, maxWaitTime = 1000 } = options;
  const videoId = video.src?.substring(video.src.lastIndexOf('/') + 1, video.src.lastIndexOf('/') + 9) || 'unknown';
  
  logVideoTelemetry('video_autoplay_attempted', { videoId });
  
  // Ensure proper preconditions for autoplay
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('webkit-playsinline', 'true');
  
  console.log(`[safePlay] Starting for video ${videoId}, readyState: ${video.readyState}, currentTime: ${video.currentTime}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // If document is hidden, wait for visibility
      if (document.hidden) {
        console.log(`[safePlay] Document hidden, waiting for visibility for video ${videoId}`);
        await waitForVisibility();
      }
      
      // Wait for video to have enough data to play (with timeout)
      if (video.readyState < 2) { // HAVE_CURRENT_DATA
        console.log(`[safePlay] Waiting for readyState >= 2 for video ${videoId}, attempt ${attempt}`);
        const readyStateReached = await Promise.race([
          waitForReadyState(video, 2),
          new Promise<boolean>(resolve => setTimeout(() => resolve(false), maxWaitTime))
        ]);
        
        if (!readyStateReached) {
          console.warn(`[safePlay] ReadyState timeout for video ${videoId}, attempt ${attempt}`);
          if (attempt === maxRetries) throw new Error('ReadyState timeout');
          await delay(baseDelay * attempt);
          continue;
        }
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
      
      console.log(`[safePlay] Attempting play() for video ${videoId}, attempt ${attempt}`);
      await video.play();
      console.log(`[safePlay] ✅ Successfully played video ${videoId} on attempt ${attempt}`);
      logVideoTelemetry('video_autoplay_succeeded', { videoId, attempt });
      return true;
      
    } catch (err: any) {
      console.warn(`[safePlay] Attempt ${attempt}/${maxRetries} failed for video ${videoId}:`, err?.name || err);
      
      if (err?.name === 'NotAllowedError' && attempt === maxRetries) {
        console.warn(`[safePlay] 🚫 Final NotAllowedError for video ${videoId} - marking as blocked`);
        video.setAttribute('data-autoplay-blocked', '1');
        logVideoTelemetry('video_autoplay_blocked', { videoId, error: err?.name });
        return false;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await delay(baseDelay * attempt);
      }
    }
  }
  
  console.warn(`[safePlay] ❌ All ${maxRetries} attempts failed for video ${videoId}`);
  video.setAttribute('data-autoplay-blocked', '1');
  logVideoTelemetry('video_autoplay_blocked', { videoId, reason: 'max_retries_exceeded' });
  return false;
}

/**
 * Legacy safe play for rollback capability
 */
function legacySafePlay(video: HTMLVideoElement): Promise<boolean> {
  return new Promise((resolve) => {
    video.muted = true;
    video.playsInline = true;
    
    video.play()
      .then(() => resolve(true))
      .catch(() => {
        video.setAttribute('data-autoplay-blocked', '1');
        resolve(false);
      });
  });
}

/**
 * Enhanced autoplay with modal visibility guard
 */
export async function safePlayAfterAnimation(video: HTMLVideoElement): Promise<boolean> {
  // Wait for paint cycles to ensure modal is fully visible
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  
  // Additional check for modal visibility
  const modal = document.getElementById('immersive-modal');
  if (modal) {
    const styles = getComputedStyle(modal);
    if (styles.opacity === '0' || styles.display === 'none') {
      console.log('[safePlayAfterAnimation] Modal not yet visible, waiting...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return safePlay(video);
}

/**
 * Wait for document to become visible
 */
function waitForVisibility(): Promise<void> {
  if (!document.hidden) return Promise.resolve();
  
  return new Promise<void>(resolve => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        resolve();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });
}

/**
 * Wait for video readyState to reach target level
 */
function waitForReadyState(video: HTMLVideoElement, targetState: number): Promise<boolean> {
  if (video.readyState >= targetState) return Promise.resolve(true);
  
  return new Promise<boolean>(resolve => {
    const checkReadyState = () => {
      if (video.readyState >= targetState) {
        video.removeEventListener('loadeddata', checkReadyState);
        video.removeEventListener('canplay', checkReadyState);
        resolve(true);
      }
    };
    
    video.addEventListener('loadeddata', checkReadyState);
    video.addEventListener('canplay', checkReadyState);
  });
}

/**
 * Simple delay utility
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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