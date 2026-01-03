/**
 * Hook for upload-on-select review video handling
 * Videos are uploaded to Cloudflare Stream immediately on selection
 * and tracked with 'pending' status until review is submitted
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { edgePost } from '@/utils/callEdge';
import { generateStreamThumbnailUrl, generateStreamHlsUrl } from '@/config/cloudflareStream';
import { isVideoFile, getMediaType } from '@/utils/getMediaType';

export interface ReviewVideoDraft {
  fileKey: string;
  fileName: string;
  fileSize: number;
  status: 'uploading' | 'ready' | 'failed';
  streamId: string | null;
  posterUrl: string | null;
  dbRowId: string | null; // course_review_media row id
  error?: string;
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
  const abortControllerRef = useRef<Map<string, AbortController>>(new Map());

  /**
   * Upload a video file to Cloudflare Stream immediately
   * Creates a pending DB row once upload completes
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

      // Step 4: Create pending DB row
      const { data: dbRow, error: dbError } = await supabase
        .from('course_review_media')
        .insert({
          review_id: '00000000-0000-0000-0000-000000000000', // placeholder - will be updated on submit
          media_url: hlsUrl,
          media_type: 'video',
          stream_id: streamId,
          poster_url: posterUrl,
          file_name: file.name,
          file_size: file.size,
          status: 'pending',
          upload_session_id: uploadSessionId,
          owner_user_id: userId,
        } as any) // Type assertion since types aren't regenerated yet
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
      };

      setVideoDrafts(prev => 
        prev.map(d => d.fileKey === fileKey ? readyDraft : d)
      );

      console.log('[ReviewVideoUpload] Video ready with poster:', posterUrl);
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
   * Remove a video draft and clean up the pending DB row / Stream asset
   */
  const removeVideo = useCallback(async (fileKey: string) => {
    const draft = videoDrafts.find(d => d.fileKey === fileKey);
    if (!draft) return;

    console.log('[ReviewVideoUpload] Removing video:', fileKey, draft.streamId);

    // Remove from local state immediately
    setVideoDrafts(prev => prev.filter(d => d.fileKey !== fileKey));

    // Cleanup DB row and Stream asset if upload completed
    if (draft.streamId && draft.dbRowId) {
      try {
        // Delete DB row first
        await supabase
          .from('course_review_media')
          .delete()
          .eq('id', draft.dbRowId);

        // Then delete Stream asset via dedicated edge function
        await edgePost('delete-review-video', { 
          streamId: draft.streamId, 
          dbRowId: draft.dbRowId 
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
   */
  const cleanupPending = useCallback(async () => {
    const pendingVideos = videoDrafts.filter(d => d.status === 'ready' || d.status === 'uploading');
    
    console.log('[ReviewVideoUpload] Cleaning up', pendingVideos.length, 'pending videos');

    // Cancel any in-progress uploads
    abortControllerRef.current.forEach(controller => controller.abort());
    abortControllerRef.current.clear();

    // Cleanup completed uploads
    for (const draft of pendingVideos) {
      if (draft.streamId && draft.dbRowId) {
        try {
          await supabase
            .from('course_review_media')
            .delete()
            .eq('id', draft.dbRowId);

          await edgePost('delete-review-video', { 
            streamId: draft.streamId, 
            dbRowId: draft.dbRowId 
          });
        } catch (error) {
          console.error('[ReviewVideoUpload] Cleanup error for', draft.streamId, error);
        }
      }
    }

    setVideoDrafts([]);
  }, [videoDrafts]);

  /**
   * Reset state (without cleanup - for use after successful submit)
   */
  const reset = useCallback(() => {
    setVideoDrafts([]);
  }, []);

  return {
    videoDrafts,
    uploadVideo,
    removeVideo,
    attachToReview,
    cleanupPending,
    reset,
  };
}
