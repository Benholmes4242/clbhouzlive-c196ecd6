/**
 * Safe video play utility with mobile-optimized autoplay handling
 * Handles readyState gating, iOS black frame fix, retry logic, visibility handling,
 * and blob URL regeneration for HLS.js failures.
 * 
 * PLAYBACK_AUTHORITY_ALLOWED: This is the core safe playback utility used by MediaRuntime.
 * All playback in the app should go through safePlay or MediaRuntime.requestPlay.
 */

import { USE_SAFE_AUTOPLAY_V2 } from './featureFlags';
import { logVideoTelemetry } from './videoTelemetry';
import { DEBUG_SAFE_PLAY } from '@/media/debug';
import { BlobUrlManager } from '@/hooks/useBlobUrlManager';
import { 
  MOBILE_VIDEO_DEBUG, 
  logSafePlayStart, 
  logSafePlayMutedFallback, 
  logSafePlayResult 
} from '@/media/mobileVideoDebug';

// Dev-only logging helper (controlled by DEBUG_SAFE_PLAY flag OR MOBILE_VIDEO_DEBUG)
const devLog = (message: string, ...args: any[]) => {
  if (DEBUG_SAFE_PLAY || MOBILE_VIDEO_DEBUG) {
    console.log(message, ...args);
  }
};

const devWarn = (message: string, ...args: any[]) => {
  if (DEBUG_SAFE_PLAY || MOBILE_VIDEO_DEBUG) {
    console.warn(message, ...args);
  }
};

interface SafePlayOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxWaitTime?: number;
  generation?: number; // Play generation for blob URL tracking
  onRegenerateSource?: (mediaId: string) => Promise<void>; // Callback to regenerate HLS source
  skipReadyStateWait?: boolean; // NEW: For feed videos - skip readyState wait for faster playback
}

// Track elements currently attempting play to prevent duplicate calls
const playingAttempts = new WeakSet<HTMLVideoElement>();

// Maximum regeneration attempts to prevent infinite loops
const MAX_REGENERATIONS = 3;

/**
 * Validate that a blob URL is still accessible
 * 
 * IMPORTANT: Blob URLs CANNOT be validated via HTTP fetch/HEAD requests!
 * They are in-memory object references, not network resources.
 * 
 * Instead, we check:
 * 1. If registered in BlobUrlManager (proves it was created and not revoked)
 * 2. For HLS.js blob URLs (MediaSource), trust them if video has metadata
 * 
 * HLS.js creates blob URLs for MediaSource internally, so we can't explicitly
 * track them. We trust the blob URL is valid if:
 * - It's registered in our manager, OR
 * - The video element already has loaded data (readyState >= 1)
 */
function validateBlobUrl(blobUrl: string, mediaId: string, video?: HTMLVideoElement): boolean {
  // Check if this blob URL is registered in our manager
  const isRegistered = BlobUrlManager.hasBlobUrl(mediaId);
  
  // For HLS.js blob URLs, also trust if video has loaded metadata
  // This handles the case where HLS.js created the blob internally
  const hasVideoData = video && video.readyState >= 1;
  
  const isValid = isRegistered || hasVideoData;
  
  if (DEBUG_SAFE_PLAY) {
    devLog(`[safePlay] Blob URL validation for ${mediaId.slice(0, 8)}: registered=${isRegistered}, hasVideoData=${hasVideoData}, valid=${isValid}`);
  }
  
  return isValid;
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

  const { maxRetries = 2, baseDelay = 100, maxWaitTime = 500, generation, onRegenerateSource, skipReadyStateWait = false } = options;
  const videoId = video.src?.substring(video.src.lastIndexOf('/') + 1, video.src.lastIndexOf('/') + 9) || 'unknown';
  const mediaId = video.dataset.runtimeMediaId || videoId;
  
  // Gate #0: Prevent duplicate play attempts on same element
  if (playingAttempts.has(video)) {
    devLog(`[safePlay] 🔒 Play already in flight for video ${videoId}, skipping`);
    return false;
  }
  
  // MOBILE VIDEO DEBUG: Log start of safePlay
  logSafePlayStart(video, videoId);
  
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
    isConnected: video.isConnected,
    generation
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
  
  // Gate #3: Check blob URL validity and generation failures
  const currentSrc = video.currentSrc || video.src || '';
  
  // Check if this specific generation has failed before
  if (generation !== undefined && BlobUrlManager.hasGenerationFailed(mediaId, generation)) {
    devLog(`[safePlay] 🔄 Generation ${generation} previously failed for ${mediaId}, attempting regeneration...`);
    
    if (onRegenerateSource) {
      try {
        await onRegenerateSource(mediaId);
        // Wait for new source to be set
        await new Promise(resolve => requestAnimationFrame(resolve));
      } catch (err) {
        devWarn(`[safePlay] 🚫 Source regeneration failed for ${videoId}:`, err);
        return false;
      }
    } else {
      devWarn(`[safePlay] 🚫 Generation ${generation} failed and no regeneration handler available`);
      return false;
    }
  }
  
  // Validate blob URL if present
  // IMPORTANT: HLS.js creates MediaSource blob URLs that we DON'T validate
  // because they can appear invalid before data is loaded but work fine during playback.
  // The video.play() call itself is the best validation - it will fail if the blob is truly broken.
  if (currentSrc.startsWith('blob:')) {
    // Check regeneration limit to prevent infinite loops
    const regenCount = BlobUrlManager.getRegenerationCount(mediaId);
    if (regenCount >= MAX_REGENERATIONS) {
      devWarn(`[safePlay] 🚫 Max regenerations (${MAX_REGENERATIONS}) exceeded for ${mediaId}, giving up`);
      video.setAttribute('data-format-error', '1');
      return false;
    }
    
    // Check for previous format error marker - this means the blob was actually tried and failed
    if (video.getAttribute('data-format-error') === '1') {
      devWarn(`[safePlay] 🚫 Blob URL already failed for video ${videoId}, attempting regeneration...`);
      
      if (generation !== undefined) {
        BlobUrlManager.markGenerationFailed(mediaId, generation);
      }
      
      if (onRegenerateSource) {
        try {
          BlobUrlManager.incrementRegeneration(mediaId);
          video.removeAttribute('data-format-error');
          await onRegenerateSource(mediaId);
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          devWarn(`[safePlay] 🚫 Source regeneration failed for ${videoId}:`, err);
          video.setAttribute('data-format-error', '1');
          return false;
        }
      } else {
        return false;
      }
    }
    
    // SKIP blob URL validation for HLS.js MediaSource blobs
    // HLS.js manages its own MediaSource lifecycle and blob URLs may appear
    // "invalid" before data is loaded but work perfectly fine when played.
    // Let the actual play() call be the validator - if it fails, we'll handle it.
    devLog(`[safePlay] Skipping blob URL validation for HLS.js MediaSource blob ${mediaId.slice(0, 8)}`);
  }
  
  // Ensure proper preconditions for autoplay
  // NOTE: Do NOT force video.muted = true here - respect the muted state set by GlobalAudioContext
  // The video element's muted state is already set by HLSPlayer based on isGloballyMuted
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
        // COLD START FIX: Skip this wait for feed videos when skipReadyStateWait is true
        if (video.readyState === 0 && !skipReadyStateWait) {
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
        } else if (skipReadyStateWait) {
          devLog(`[safePlay] Skipping readyState wait for feed video ${videoId}`);
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
          attempt,
          generation
        });
        await video.play();
        const endTime = performance.now();
        devLog(`[${endTime.toFixed(2)}ms] [safePlay] ✅ SUCCESS`, {
          videoId,
          totalTime: (endTime - startTime).toFixed(2) + 'ms',
          attempt,
          generation
        });
        logVideoTelemetry('video_autoplay_succeeded', { videoId, attempt });
        
        // MOBILE VIDEO DEBUG: Log success
        logSafePlayResult(video, videoId, true, undefined, undefined, attempt, maxRetries);
        
        // Clear autoplay-blocked marker on success (important for tap-to-play after gesture unlock)
        try {
          video.removeAttribute('data-autoplay-blocked');
        } catch {
          // ignore
        }
        
        // Clear failures on success
        if (generation !== undefined) {
          BlobUrlManager.clearFailures(mediaId);
        }
        
        return true;
        
      } catch (err: any) {
        devWarn(`[${performance.now().toFixed(2)}ms] [safePlay] Attempt ${attempt}/${maxRetries} FAILED for video ${videoId}:`, err?.name || err);
        
        // Handle NotAllowedError (autoplay blocked)
        // NOTE: In iOS WebView, NotAllowedError will NOT resolve via timer-based retries.
        // A subsequent play() must be invoked from a real user gesture handler.
        if (err?.name === 'NotAllowedError') {
          // Common cause: trying to autoplay with sound. As a safety net, retry muted.
          // This preserves autoplay behavior while still allowing the user to unmute via a gesture.
          if (!video.muted && attempt < maxRetries) {
            devWarn(`[safePlay] 🔇 NotAllowedError for ${videoId} - retrying muted`);
            // MOBILE VIDEO DEBUG: Log muted fallback attempt
            logSafePlayMutedFallback(video, videoId, false);
            try {
              video.muted = true;
              video.setAttribute('data-autoplay-muted-fallback', '1');
              // Notify React state of the forced mute
              window.dispatchEvent(new CustomEvent('autoplay-muted-fallback'));
            } catch {
              // ignore
            }
            continue;
          }

          // If we're already muted (or cannot retry), treat as policy-blocked and stop here.
          // MediaRuntime will queue a gesture-based retry when it sees this attribute.
          devWarn(`[safePlay] 🚫 NotAllowedError for video ${videoId} - marking as autoplay blocked (needs user gesture)`);
          try {
            video.setAttribute('data-autoplay-blocked', '1');
          } catch {
            // ignore
          }
          logVideoTelemetry('video_autoplay_blocked', { videoId, error: err?.name });
          // MOBILE VIDEO DEBUG: Log failure
          logSafePlayResult(video, videoId, false, err?.name, err?.message, attempt, maxRetries);
          return false;
        }
        
        // Handle NotSupportedError / MediaError - these are fatal format errors
        if (err?.name === 'NotSupportedError' || err?.name === 'MediaError') {
          devWarn(`[safePlay] 🚫 Format error for video ${videoId}:`, err?.name);
          video.setAttribute('data-format-error', '1');
          
          // Mark generation as failed for blob URL tracking
          if (generation !== undefined) {
            BlobUrlManager.markGenerationFailed(mediaId, generation);
          }
          
          // Check regeneration limit before trying
          const regenCount = BlobUrlManager.getRegenerationCount(mediaId);
          if (regenCount >= MAX_REGENERATIONS) {
            devWarn(`[safePlay] 🚫 Max regenerations (${MAX_REGENERATIONS}) exceeded for ${mediaId}`);
            logVideoTelemetry('video_format_error', { videoId, error: err?.name, src: currentSrc.slice(-50), maxRegen: true });
            return false;
          }
          
          // Try regeneration if handler available
          if (onRegenerateSource && attempt < maxRetries) {
            devLog(`[safePlay] 🔄 Attempting source regeneration for ${videoId}...`);
            try {
              BlobUrlManager.incrementRegeneration(mediaId);
              video.removeAttribute('data-format-error');
              await onRegenerateSource(mediaId);
              await new Promise(resolve => setTimeout(resolve, 100));
              continue; // Retry with regenerated source
            } catch (regenErr) {
              devWarn(`[safePlay] 🚫 Source regeneration failed:`, regenErr);
            }
          }
          
          logVideoTelemetry('video_format_error', { videoId, error: err?.name, src: currentSrc.slice(-50) });
          return false;
        }
        
        // Handle AbortError - usually means source changed or element detached mid-play
        // STABILITY FIX: Suppress console warning for AbortError as it's expected during scrolling
        if (err?.name === 'AbortError') {
          // Only log in debug mode - this is expected during normal scrolling
          devLog(`[safePlay] AbortError for video ${videoId} - source likely changed (normal during scroll)`);
          // Don't mark as failed - this is expected when source changes
          return false;
        }
        
        // Blob URL failure - try regeneration if available
        if (currentSrc.startsWith('blob:')) {
          devWarn(`[safePlay] 🚫 Blob URL failed for video ${videoId}`);
          
          if (generation !== undefined) {
            BlobUrlManager.markGenerationFailed(mediaId, generation);
          }
          
          // Check regeneration limit
          const regenCount = BlobUrlManager.getRegenerationCount(mediaId);
          if (regenCount >= MAX_REGENERATIONS) {
            devWarn(`[safePlay] 🚫 Max regenerations (${MAX_REGENERATIONS}) exceeded for ${mediaId}`);
            video.setAttribute('data-format-error', '1');
            return false;
          }
          
          if (onRegenerateSource && attempt < maxRetries) {
            devLog(`[safePlay] 🔄 Attempting source regeneration for blob URL failure...`);
            try {
              BlobUrlManager.incrementRegeneration(mediaId);
              await onRegenerateSource(mediaId);
              await new Promise(resolve => setTimeout(resolve, 100));
              continue; // Retry with regenerated source
            } catch (regenErr) {
              devWarn(`[safePlay] 🚫 Source regeneration failed:`, regenErr);
            }
          }
          
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
    // NOTE: Do NOT force video.muted = true here - respect the muted state set by GlobalAudioContext
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
