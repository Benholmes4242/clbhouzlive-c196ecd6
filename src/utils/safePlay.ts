/**
 * Safe video play utility with mobile-optimized autoplay handling
 * Handles readyState gating, iOS black frame fix, retry logic, and visibility handling
 * 
 * PLAYBACK_AUTHORITY_ALLOWED: This is the core safe playback utility used by MediaRuntime.
 * All playback in the app should go through safePlay or MediaRuntime.requestPlay.
 */

import { USE_SAFE_AUTOPLAY_V2 } from './featureFlags';
import { logVideoTelemetry } from './videoTelemetry';
import { DEBUG_SAFE_PLAY } from '@/media/debug';

// Dev-only logging helper (controlled by DEBUG_SAFE_PLAY flag)
const devLog = (message: string, ...args: any[]) => {
  if (DEBUG_SAFE_PLAY) {
    console.log(message, ...args);
  }
};

const devWarn = (message: string, ...args: any[]) => {
  if (DEBUG_SAFE_PLAY) {
    console.warn(message, ...args);
  }
};

interface SafePlayOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxWaitTime?: number;
}

export async function safePlay(
  video: HTMLVideoElement, 
  options: SafePlayOptions = {}
): Promise<boolean> {
  const startTime = performance.now();
  
  // Feature flag for rollback capability
  if (!USE_SAFE_AUTOPLAY_V2) {
    return legacySafePlay(video);
  }

  const { maxRetries = 2, baseDelay = 100, maxWaitTime = 200 } = options;
  const videoId = video.src?.substring(video.src.lastIndexOf('/') + 1, video.src.lastIndexOf('/') + 9) || 'unknown';
  
  logVideoTelemetry('video_autoplay_attempted', { videoId });
  
  // Enhanced debug logging
  const readyStateNames = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'];
  devLog(`[${startTime.toFixed(2)}ms] [safePlay] START`, {
    videoId,
    readyState: video.readyState,
    readyStateName: readyStateNames[video.readyState],
    currentTime: video.currentTime,
    paused: video.paused,
    networkState: video.networkState
  });
  
  // Ensure proper preconditions for autoplay
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('webkit-playsinline', 'true');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // If document is hidden, wait for visibility
      if (document.hidden) {
        devLog(`[safePlay] Document hidden, waiting for visibility for video ${videoId}`);
        await waitForVisibility();
      }
      
      // Don't wait for readyState >= 2, try playing immediately
      // Modern browsers buffer while playing, no need to preload
      if (video.readyState < 1) { // Only wait if HAVE_NOTHING
        // Kick off loading explicitly (helps some WebViews / iOS cases)
        try {
          video.load();
        } catch {
          // ignore
        }
        
        // Give it just 100ms to start loading
        await delay(100);
        
        devLog(`[safePlay] Quick load kick for ${videoId}, readyState: ${video.readyState}`);
      }
      
      // iOS black-frame nudge - only if at beginning
      if (video.currentTime === 0) {
        try { 
          video.currentTime = 0.001; 
          devLog(`[safePlay] Applied iOS nudge for video ${videoId}`);
        } catch {
          // Ignore errors setting currentTime
        }
      }
      
      devLog(`[${performance.now().toFixed(2)}ms] [safePlay] CALLING_PLAY`, {
        videoId,
        readyState: video.readyState,
        attempt
      });
      await video.play();
      const endTime = performance.now();
      devLog(`[${endTime.toFixed(2)}ms] [safePlay] ✅ SUCCESS`, {
        videoId,
        totalTime: (endTime - startTime).toFixed(2) + 'ms',
        attempt
      });
      logVideoTelemetry('video_autoplay_succeeded', { videoId, attempt });
      return true;
      
    } catch (err: any) {
      devWarn(`[${performance.now().toFixed(2)}ms] [safePlay] Attempt ${attempt}/${maxRetries} FAILED for video ${videoId}:`, err?.name || err);
      
      if (err?.name === 'NotAllowedError' && attempt === maxRetries) {
        devWarn(`[safePlay] 🚫 Final NotAllowedError for video ${videoId} - marking as blocked`);
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
  
  // Keep error logs in production for monitoring
  console.error(`[safePlay] ❌ All ${maxRetries} attempts failed for video ${videoId}`);
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
      devLog('[safePlayAfterAnimation] Modal not yet visible, waiting...');
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
