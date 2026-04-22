// Poll Cloudflare Stream for video metadata once processing is complete
// This ensures width/height/duration are populated for all uploads

import { supabase } from '@/integrations/supabase/client';

export interface StreamMetadata {
  width: number;
  height: number;
  durationSeconds: number;
  aspectRatio: number;
}

interface PollOptions {
  maxAttempts?: number;
  intervalMs?: number;
  /** Enable exponential backoff on errors (default: true) */
  exponentialBackoff?: boolean;
  /** Suppress error logging for rate limits that eventually recover (default: true) */
  suppressRecoverableErrors?: boolean;
}

// Rate limit constants
const DEFAULT_POLL_INTERVAL = 6000; // 6 seconds (increased from 4s to reduce rate limiting)
const DEFAULT_MAX_ATTEMPTS = 15; // ~90 seconds total at 6s intervals
const MAX_BACKOFF_DELAY = 30000; // 30 seconds max backoff
const MAX_CONSECUTIVE_ERRORS = 5;

/**
 * Poll Cloudflare Stream until video is ready and metadata is available.
 * Returns metadata or null if polling times out.
 * 
 * Uses exponential backoff on errors to handle rate limiting and transient failures.
 * Rate limit errors (429) trigger aggressive backoff and don't count toward error limit.
 */
export async function pollStreamMetadata(
  streamId: string,
  options: PollOptions = {}
): Promise<StreamMetadata | null> {
  const { 
    maxAttempts = DEFAULT_MAX_ATTEMPTS, 
    intervalMs = DEFAULT_POLL_INTERVAL,
    exponentialBackoff = true,
    suppressRecoverableErrors = true,
  } = options;
  
  console.log(`[pollStreamMetadata] Starting poll for ${streamId}, max ${maxAttempts} attempts, interval ${intervalMs}ms`);

  let consecutiveErrors = 0;
  let rateLimitBackoffs = 0;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    
    try {
      const { data, error } = await supabase.functions.invoke('cloudflare-stream-details', {
        body: { videoId: streamId },
      });

      if (error) {
        const errorMessage = error.message || String(error);
        const isRateLimit = errorMessage.includes('429') || 
                           errorMessage.includes('Too Many Requests') ||
                           errorMessage.includes('rate limit');
        
        if (isRateLimit) {
          // Rate limit: aggressive backoff, don't count as error attempt
          rateLimitBackoffs++;
          const backoffDelay = Math.min(
            intervalMs * Math.pow(2, rateLimitBackoffs),
            MAX_BACKOFF_DELAY
          );
          console.log(`[pollStreamMetadata] Rate limited (429), backing off for ${backoffDelay}ms (backoff #${rateLimitBackoffs})`);
          await sleep(backoffDelay);
          attempt--; // Don't count rate limit as an attempt
          continue;
        }
        
        consecutiveErrors++;
        if (!suppressRecoverableErrors || consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.warn(`[pollStreamMetadata] Attempt ${attempt}: Edge function error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, error);
        }
        
        // Use exponential backoff on consecutive errors
        const delay = exponentialBackoff 
          ? Math.min(intervalMs * Math.pow(1.5, consecutiveErrors - 1), 10000) + Math.random() * 500
          : intervalMs;
        
        await sleep(delay);
        continue;
      }

      // Reset error counters on successful response
      consecutiveErrors = 0;
      rateLimitBackoffs = 0;

      // Cloudflare returns { result: { ... } }
      const video = data?.result;
      
      if (!video) {
        console.warn(`[pollStreamMetadata] Attempt ${attempt}: No result in response`);
        await sleep(intervalMs);
        continue;
      }

      // Check if video is ready (status.state = 'ready')
      const state = video.status?.state;
      if (state !== 'ready') {
        console.log(`[pollStreamMetadata] Attempt ${attempt}: Video not ready yet (state: ${state})`);
        await sleep(intervalMs);
        continue;
      }

      // Extract metadata from input object
      const width = video.input?.width;
      const height = video.input?.height;
      const duration = video.duration;

      if (!width || !height) {
        console.warn(`[pollStreamMetadata] Attempt ${attempt}: Video ready but missing dimensions`);
        await sleep(intervalMs);
        continue;
      }

      const metadata: StreamMetadata = {
        width,
        height,
        durationSeconds: typeof duration === 'number' ? Math.round(duration) : 0,
        aspectRatio: parseFloat((width / height).toFixed(4)),
      };

      console.log(`[pollStreamMetadata] Success after ${attempt} attempts:`, metadata);
      return metadata;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isRateLimit = errorMessage.includes('429') || 
                         errorMessage.includes('Too Many Requests') ||
                         errorMessage.includes('rate limit');
      
      if (isRateLimit) {
        // Rate limit: aggressive backoff, don't count as error attempt
        rateLimitBackoffs++;
        const backoffDelay = Math.min(
          intervalMs * Math.pow(2, rateLimitBackoffs),
          MAX_BACKOFF_DELAY
        );
        console.log(`[pollStreamMetadata] Rate limited (429), backing off for ${backoffDelay}ms (backoff #${rateLimitBackoffs})`);
        await sleep(backoffDelay);
        attempt--; // Don't count rate limit as an attempt
        continue;
      }
      
      consecutiveErrors++;
      if (!suppressRecoverableErrors || consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.warn(`[pollStreamMetadata] Attempt ${attempt}: Error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, err);
      }
      
      // Use exponential backoff on caught errors
      const delay = exponentialBackoff 
        ? Math.min(intervalMs * Math.pow(1.5, consecutiveErrors - 1), 10000) + Math.random() * 500
        : intervalMs;
      
      await sleep(delay);
    }
  }

  // CRITICAL: Log failure with full context for debugging
  console.error(`[pollStreamMetadata] FAILED - Timed out after ${attempt} attempts for streamId: ${streamId}`, {
    streamId,
    maxAttempts,
    intervalMs,
    rateLimitBackoffs,
    timestamp: new Date().toISOString(),
  });
  
  return null;
}

/**
 * Update post_media row with video metadata
 */
export async function updatePostMediaMetadata(
  postMediaId: string,
  metadata: StreamMetadata
): Promise<boolean> {
  const { error } = await supabase
    .from('post_media')
    .update({
      width: metadata.width,
      height: metadata.height,
      duration_seconds: metadata.durationSeconds,
      duration_ms: metadata.durationSeconds != null
        ? metadata.durationSeconds * 1000
        : null,
      aspect_ratio: metadata.aspectRatio,
    })
    .eq('id', postMediaId);

  if (error) {
    console.error(`[updatePostMediaMetadata] Failed to update ${postMediaId}:`, error);
    return false;
  }

  console.log(`[updatePostMediaMetadata] Updated ${postMediaId} with metadata`);
  return true;
}

/**
 * Update course_review_media row with video metadata
 * Note: Uses type assertion as columns were added via migration
 */
export async function updateCourseReviewMediaMetadata(
  mediaId: string,
  metadata: StreamMetadata
): Promise<boolean> {
  // Type assertion needed as types.ts hasn't regenerated yet with new columns
  const { error } = await supabase
    .from('course_review_media')
    .update({
      width: metadata.width,
      height: metadata.height,
      duration_seconds: metadata.durationSeconds,
      aspect_ratio: metadata.aspectRatio,
    } as any)
    .eq('id', mediaId);

  if (error) {
    console.error(`[updateCourseReviewMediaMetadata] Failed to update ${mediaId}:`, error);
    return false;
  }

  console.log(`[updateCourseReviewMediaMetadata] Updated ${mediaId} with metadata`);
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
