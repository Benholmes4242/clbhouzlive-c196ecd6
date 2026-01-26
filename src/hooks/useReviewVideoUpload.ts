/**
 * @deprecated This hook is deprecated. Use useReviewMediaUpload from 
 * '@/components/courses/review-wizard/useReviewMediaUpload' instead.
 * 
 * The new unified upload system provides:
 * - Background upload processing that survives component unmount
 * - Progress tracking with speed/ETA
 * - Retry logic with exponential backoff
 * - Non-blocking navigation
 * 
 * This legacy hook is kept for backward compatibility but will be removed
 * in a future version.
 * 
 * @see useReviewMediaUpload
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { edgePost } from '@/utils/callEdge';
import { generateStreamThumbnailUrl, generateStreamHlsUrl } from '@/config/cloudflareStream';
import { pollStreamMetadata, updateCourseReviewMediaMetadata } from '@/utils/pollStreamMetadata';

export interface ReviewVideoDraft {
  fileKey: string;
  fileName: string;
  fileSize: number;
  status: 'uploading' | 'ready' | 'failed';
  streamId: string | null;
  posterUrl: string | null;
  dbRowId: string | null; // course_review_media row id
  error?: string;
  posterRetryCount?: number; // Track poster retry attempts
  // Dimension metadata
  width?: number;
  height?: number;
  durationSeconds?: number;
}

interface UseReviewVideoUploadOptions {
  uploadSessionId: string;
  userId: string | null;
  onError?: (message: string) => void;
}

// Generate stable file key for tracking (consistent across references)
export const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

export function useReviewVideoUpload({
  uploadSessionId,
  userId,
  onError,
}: UseReviewVideoUploadOptions) {
  const [videoDrafts, setVideoDrafts] = useState<ReviewVideoDraft[]>([]);
  
  // Track if cleanup has been called (to prevent double cleanup)
  const cleanupCalledRef = useRef(false);

  /**
   * Upload a video file to Cloudflare Stream immediately
   * Creates a pending DB row once upload completes (with NULL review_id)
   */
  const uploadVideo = useCallback(async (file: File): Promise<ReviewVideoDraft | null> => {
    if (!userId) {
      console.error('[ReviewVideoUpload] No user ID');
      return null;
    }

    const fileKey = getFileKey(file);
    
    // Create initial draft in uploading state
    const draft: ReviewVideoDraft = {
      fileKey,
      fileName: file.name,
      fileSize: file.size,
      status: 'uploading',
      streamId: null,
      posterUrl: null,
      dbRowId: null,
      posterRetryCount: 0,
    };

    setVideoDrafts(prev => [...prev, draft]);
    console.log('[ReviewVideoUpload] Starting upload:', file.name);

    try {
      // Step 1: Get direct upload URL from Cloudflare Stream
      const directUploadResult = await edgePost('cloudflare-stream-upload', {
        fileName: file.name,
        fileSize: file.size,
      });

      if (!directUploadResult?.uploadURL || !directUploadResult?.uid) {
        throw new Error('Failed to get upload URL from Cloudflare Stream');
      }

      const { uploadURL, uid: streamId } = directUploadResult;
      console.log('[ReviewVideoUpload] Got direct upload URL, streamId:', streamId);

      // Step 2: Upload file directly to Cloudflare Stream
      const formData = new FormData();
      formData.append('file', file);

      const uploadResp = await fetch(uploadURL, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResp.ok) {
        throw new Error(`Stream upload failed: ${uploadResp.status}`);
      }

      console.log('[ReviewVideoUpload] Upload complete:', streamId);

      // Step 3: Generate URLs
      const posterUrl = generateStreamThumbnailUrl(streamId);
      const hlsUrl = generateStreamHlsUrl(streamId);

      // Step 4: Create pending DB row with NULL review_id (Fix #1)
      const { data: dbRow, error: dbError } = await supabase
        .from('course_review_media')
        .insert({
          review_id: null, // NULL for pending - will be updated on submit
          media_url: hlsUrl,
          media_type: 'video',
          stream_id: streamId,
          poster_url: posterUrl,
          file_name: file.name,
          file_size: file.size,
          status: 'pending',
          upload_session_id: uploadSessionId,
          owner_user_id: userId,
        } as any)
        .select('id')
        .single();

      if (dbError) {
        console.error('[ReviewVideoUpload] DB insert error:', dbError);
        // Still consider upload successful - cleanup will handle orphans
      }

      // Update draft to ready state
      const readyDraft: ReviewVideoDraft = {
        ...draft,
        status: 'ready',
        streamId,
        posterUrl,
        dbRowId: dbRow?.id || null,
        posterRetryCount: 0,
      };

      setVideoDrafts(prev => 
        prev.map(d => d.fileKey === fileKey ? readyDraft : d)
      );

      console.log('[ReviewVideoUpload] Video ready with poster:', posterUrl);

      // Poll for video metadata in background (non-blocking)
      if (dbRow?.id && streamId) {
        pollStreamMetadata(streamId, { maxAttempts: 20, intervalMs: 4000, suppressRecoverableErrors: true })
          .then(metadata => {
            if (metadata && dbRow.id) {
              // Update the database with dimensions
              updateCourseReviewMediaMetadata(dbRow.id, metadata);
              
              // Update local state with dimensions
              setVideoDrafts(prev => prev.map(d => 
                d.fileKey === fileKey 
                  ? { ...d, width: metadata.width, height: metadata.height, durationSeconds: metadata.durationSeconds }
                  : d
              ));
              console.log('[ReviewVideoUpload] Video metadata populated:', metadata);
            }
          })
          .catch(err => {
            console.warn('[ReviewVideoUpload] Metadata polling failed:', err);
          });
      }

      return readyDraft;

    } catch (error) {
      console.error('[ReviewVideoUpload] Upload failed:', error);
      
      const failedDraft: ReviewVideoDraft = {
        ...draft,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Upload failed',
      };

      setVideoDrafts(prev =>
        prev.map(d => d.fileKey === fileKey ? failedDraft : d)
      );

      onError?.(`Failed to upload ${file.name}`);
      return failedDraft;
    }
  }, [uploadSessionId, userId, onError]);

  /**
   * Retry poster URL with cache-buster if the poster fails to load (Fix #7)
   */
  const retryPoster = useCallback((fileKey: string) => {
    setVideoDrafts(prev => prev.map(d => {
      if (d.fileKey === fileKey && d.streamId && (d.posterRetryCount || 0) < 3) {
        const retryCount = (d.posterRetryCount || 0) + 1;
        // Add cache-buster query param
        const newPosterUrl = `${generateStreamThumbnailUrl(d.streamId)}?t=${Date.now()}`;
        console.log('[ReviewVideoUpload] Retrying poster load:', d.streamId, 'attempt:', retryCount);
        return { ...d, posterUrl: newPosterUrl, posterRetryCount: retryCount };
      }
      return d;
    }));
  }, []);

  /**
   * Remove a video draft and clean up the pending DB row / Stream asset
   */
  const removeVideo = useCallback(async (fileKey: string) => {
    const draft = videoDrafts.find(d => d.fileKey === fileKey);
    if (!draft) return;

    console.log('[ReviewVideoUpload] Removing video:', fileKey, draft.streamId);

    // Remove from local state immediately
    setVideoDrafts(prev => prev.filter(d => d.fileKey !== fileKey));

    // Cleanup via edge function (Fix #2: standardized on delete-review-video)
    if (draft.streamId) {
      try {
        await edgePost('delete-review-video', { 
          streamId: draft.streamId, 
          dbRowId: draft.dbRowId || undefined,
        });
        console.log('[ReviewVideoUpload] Cleaned up stream asset:', draft.streamId);
      } catch (error) {
        console.error('[ReviewVideoUpload] Cleanup error:', error);
        // Non-blocking - TTL cleanup will catch orphans
      }
    }
  }, [videoDrafts]);

  /**
   * Attach all pending videos to a review (on submit)
   */
  const attachToReview = useCallback(async (reviewId: string) => {
    const pendingVideos = videoDrafts.filter(d => d.status === 'ready' && d.dbRowId);
    
    if (pendingVideos.length === 0) {
      console.log('[ReviewVideoUpload] No pending videos to attach');
      return { attached: 0 };
    }

    console.log('[ReviewVideoUpload] Attaching', pendingVideos.length, 'videos to review:', reviewId);

    const dbRowIds = pendingVideos.map(d => d.dbRowId).filter(Boolean) as string[];

    const { error } = await supabase
      .from('course_review_media')
      .update({ 
        review_id: reviewId, 
        status: 'attached' 
      } as any)
      .in('id', dbRowIds);

    if (error) {
      console.error('[ReviewVideoUpload] Attach error:', error);
      throw error;
    }

    console.log('[ReviewVideoUpload] Attached', pendingVideos.length, 'videos');
    return { attached: pendingVideos.length };
  }, [videoDrafts]);

  /**
   * Cleanup all pending uploads (on modal close/cancel)
   * Fix #6: This is called from handleClose and useEffect cleanup
   */
  const cleanupPending = useCallback(async () => {
    // Prevent double cleanup
    if (cleanupCalledRef.current) {
      console.log('[ReviewVideoUpload] Cleanup already called, skipping');
      return;
    }
    cleanupCalledRef.current = true;

    const pendingVideos = videoDrafts.filter(d => d.status === 'ready' || d.status === 'uploading');
    
    if (pendingVideos.length === 0) {
      console.log('[ReviewVideoUpload] No pending videos to clean up');
      return;
    }

    console.log('[ReviewVideoUpload] Cleaning up', pendingVideos.length, 'pending videos');

    // Cleanup completed uploads via edge function (Fix #2)
    for (const draft of pendingVideos) {
      if (draft.streamId) {
        try {
          await edgePost('delete-review-video', { 
            streamId: draft.streamId, 
            dbRowId: draft.dbRowId || undefined,
          });
          console.log('[ReviewVideoUpload] Cleaned up:', draft.streamId);
        } catch (error: any) {
          // Treat "Cannot delete attached media" as non-error (belt and braces)
          const msg = error?.message || String(error);
          if (msg.includes('attached')) {
            console.warn('[ReviewVideoUpload] Video already attached, skipping cleanup:', draft.streamId);
          } else {
            console.warn('[ReviewVideoUpload] Cleanup error for', draft.streamId, error);
          }
          // Non-blocking - TTL cleanup will catch orphans
        }
      }
    }

    setVideoDrafts([]);
  }, [videoDrafts]);

  /**
   * Reset state (without cleanup - for use after successful submit)
   */
  const reset = useCallback(() => {
    cleanupCalledRef.current = false;
    setVideoDrafts([]);
  }, []);

  /**
   * Reset cleanup flag when modal reopens (new session)
   */
  const resetCleanupFlag = useCallback(() => {
    cleanupCalledRef.current = false;
  }, []);

  return {
    videoDrafts,
    uploadVideo,
    removeVideo,
    attachToReview,
    cleanupPending,
    reset,
    resetCleanupFlag,
    retryPoster,
  };
}
