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

// Track elements currently attempting play to prevent duplicate calls
const playingAttempts = new WeakSet<HTMLVideoElement>();

export async function safePlay(
  video: HTMLVideoElement, 
  options: SafePlayOptions = {}
): Promise<boolean> {
  const startTime = performance.now();
  
  // Feature flag for rollback capability
  if (!USE_SAFE_AUTOPLAY_V2) {
    return legacySafePlay(video);
  }

  const { maxRetries = 2, baseDelay = 100, maxWaitTime = 500 } = options;
  const videoId = video.src?.substring(video.src.lastIndexOf('/') + 1, video.src.lastIndexOf('/') + 9) || 'unknown';
  
  // Gate #0: Prevent duplicate play attempts on same element
  if (playingAttempts.has(video)) {
    devLog(`[safePlay] 🔒 Play already in flight for video ${videoId}, skipping`);
    return false;
  }
  
  logVideoTelemetry('video_autoplay_attempted', { videoId });
  
  // Enhanced debug logging
  const readyStateNames = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'];
  devLog(`[${startTime.toFixed(2)}ms] [safePlay] START`, {
    videoId,
    readyState: video.readyState,
    readyStateName: readyStateNames[video.readyState],
    currentTime: video.currentTime,
    paused: video.paused,
    networkState: video.networkState,
    isConnected: video.isConnected
  });
  
  // Gate #1: Element must be connected to DOM
  if (!video.isConnected) {
    devWarn(`[safePlay] 🚫 Video element not connected to DOM for video ${videoId}`);
    logVideoTelemetry('video_autoplay_blocked', { videoId, reason: 'not_connected' });
    return false;
  }
  
  // Gate #2: Must have a valid source
  if (!video.src && !video.currentSrc) {
    devWarn(`[safePlay] 🚫 No valid src for video ${videoId}`);
    logVideoTelemetry('video_autoplay_blocked', { videoId, reason: 'no_src' });
    return false;
  }
  
  // Gate #3: If blob URL failed previously, don't retry - caller must re-init source
  const currentSrc = video.currentSrc || video.src || '';
  if (currentSrc.startsWith('blob:') && video.getAttribute('data-format-error') === '1') {
    devWarn(`[safePlay] 🚫 Blob URL already failed for video ${videoId}, caller must re-init`);
    return false;
  }
  
  // Ensure proper preconditions for autoplay
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('webkit-playsinline', 'true');
  
  // Lock this element
  playingAttempts.add(video);
  
  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // If document is hidden, wait for visibility
        if (document.hidden) {
          devLog(`[safePlay] Document hidden, waiting for visibility for video ${videoId}`);
          await waitForVisibility();
        }
        
        // Wait for loadedmetadata if readyState is HAVE_NOTHING
        if (video.readyState === 0) {
          // Kick off loading explicitly
          try {
            video.load();
          } catch {
            // ignore
          }
          
          // Wait for loadedmetadata with timeout
          const gotMetadata = await waitForReadyStateWithTimeout(video, 1, maxWaitTime);
          devLog(`[safePlay] Waited for metadata for ${videoId}, got: ${gotMetadata}, readyState: ${video.readyState}`);
          
          // If still HAVE_NOTHING after timeout, try play anyway (might work on some browsers)
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
        
        // Handle NotAllowedError (autoplay blocked)
        if (err?.name === 'NotAllowedError' && attempt === maxRetries) {
          devWarn(`[safePlay] 🚫 Final NotAllowedError for video ${videoId} - marking as blocked`);
          video.setAttribute('data-autoplay-blocked', '1');
          logVideoTelemetry('video_autoplay_blocked', { videoId, error: err?.name });
          return false;
        }
        
        // Handle NotSupportedError / MediaError - these are fatal format errors
        // Don't retry, just fail immediately and let caller handle MP4 fallback
        if (err?.name === 'NotSupportedError' || err?.name === 'MediaError') {
          devWarn(`[safePlay] 🚫 Format error for video ${videoId}:`, err?.name);
          video.setAttribute('data-format-error', '1');
          logVideoTelemetry('video_format_error', { videoId, error: err?.name, src: currentSrc.slice(-50) });
          return false;
        }
        
        // Handle AbortError - usually means source changed or element detached mid-play
        if (err?.name === 'AbortError') {
          devWarn(`[safePlay] ⚠️ AbortError for video ${videoId} - source likely changed`);
          // Don't retry, the element state is likely invalid
          return false;
        }
        
        // Blob URL failure - don't retry, caller must re-init source
        if (currentSrc.startsWith('blob:')) {
          devWarn(`[safePlay] 🚫 Blob URL failed for video ${videoId}, not retrying`);
          video.setAttribute('data-format-error', '1');
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
  } finally {
    // Always release the lock
    playingAttempts.delete(video);
  }
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
 * Wait for video readyState to reach target level with timeout
 */
function waitForReadyStateWithTimeout(video: HTMLVideoElement, targetState: number, timeoutMs: number): Promise<boolean> {
  if (video.readyState >= targetState) return Promise.resolve(true);
  
  return new Promise<boolean>(resolve => {
    let resolved = false;
    
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', checkReadyState);
      video.removeEventListener('loadeddata', checkReadyState);
      video.removeEventListener('canplay', checkReadyState);
      video.removeEventListener('error', handleError);
    };
    
    const checkReadyState = () => {
      if (!resolved && video.readyState >= targetState) {
        resolved = true;
        cleanup();
        resolve(true);
      }
    };
    
    const handleError = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(false);
      }
    };
    
    video.addEventListener('loadedmetadata', checkReadyState);
    video.addEventListener('loadeddata', checkReadyState);
    video.addEventListener('canplay', checkReadyState);
    video.addEventListener('error', handleError);
    
    // Timeout fallback
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(false);
      }
    }, timeoutMs);
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
