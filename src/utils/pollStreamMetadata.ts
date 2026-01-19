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
}

/**
 * Poll Cloudflare Stream until video is ready and metadata is available.
 * Returns metadata or null if polling times out.
 * 
 * Uses exponential backoff on errors to handle rate limiting and transient failures.
 */
export async function pollStreamMetadata(
  streamId: string,
  options: PollOptions = {}
): Promise<StreamMetadata | null> {
  const { 
    maxAttempts = 30, 
    intervalMs = 2000,
    exponentialBackoff = true 
  } = options;
  
  console.log(`[pollStreamMetadata] Starting poll for ${streamId}, max ${maxAttempts} attempts`);

  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke('cloudflare-stream-details', {
        body: { videoId: streamId },
      });

      if (error) {
        consecutiveErrors++;
        console.warn(`[pollStreamMetadata] Attempt ${attempt}: Edge function error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, error);
        
        // Use exponential backoff on consecutive errors
        const delay = exponentialBackoff 
          ? Math.min(intervalMs * Math.pow(1.5, consecutiveErrors - 1), 10000) + Math.random() * 500
          : intervalMs;
        
        await sleep(delay);
        continue;
      }

      // Reset error counter on successful response
      consecutiveErrors = 0;

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
      consecutiveErrors++;
      console.warn(`[pollStreamMetadata] Attempt ${attempt}: Error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, err);
      
      // Use exponential backoff on caught errors
      const delay = exponentialBackoff 
        ? Math.min(intervalMs * Math.pow(1.5, consecutiveErrors - 1), 10000) + Math.random() * 500
        : intervalMs;
      
      await sleep(delay);
    }
  }

  // CRITICAL: Log failure with full context for debugging
  console.error(`[pollStreamMetadata] FAILED - Timed out after ${maxAttempts} attempts for streamId: ${streamId}`, {
    streamId,
    maxAttempts,
    intervalMs,
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
 */
export async function updateCourseReviewMediaMetadata(
  mediaId: string,
  metadata: StreamMetadata
): Promise<boolean> {
  const { error } = await supabase
    .from('course_review_media')
    .update({
      width: metadata.width,
      height: metadata.height,
      duration_seconds: metadata.durationSeconds,
      aspect_ratio: metadata.aspectRatio,
    })
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
