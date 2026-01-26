/**
 * @deprecated This hook is deprecated. Use the unified upload pipeline instead:
 * 
 * Import: import { useReviewUpload } from '@/uploads/useReviewUpload';
 * Usage: const { submitReview } = useReviewUpload({ userId, onSuccess, onError });
 * 
 * The new hook uses:
 * - TUS resumable video uploads (no more single POST failures)
 * - Client-side image compression (faster uploads, less storage)
 * - Real-time progress tracking with speed/ETA
 * - Network awareness (pause when offline, resume when back)
 * - UploadProgressBanner integration
 * 
 * This file will be removed in a future release.
 * 
 * ---
 * OLD DESCRIPTION:
 * useReviewMediaUpload - Unified hook for review media uploads
 * 
 * Uses the ReviewUploadManager singleton for:
 * - Background upload processing
 * - Progress tracking with speed/ETA
 * - Retry logic with exponential backoff
 * - State persistence across component unmount
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  reviewUploadManager, 
  type ReviewMediaUpload, 
  type ReviewUploadProgress 
} from './ReviewUploadManager';

export interface UseReviewMediaUploadOptions {
  userId: string | null;
  courseId: string;
}

export interface ReviewMediaItem {
  id: string;
  type: 'image' | 'video';
  status: 'queued' | 'uploading' | 'processing' | 'ready' | 'failed' | 'existing' | 'attached';
  previewUrl: string;
  uploadedUrl: string | null;
  progress: ReviewUploadProgress;
  error: string | null;
  streamId?: string | null;
  posterUrl?: string | null;
  dbRowId?: string | null;
  // Existing media from DB (edit mode)
  isExisting?: boolean;
}

export function useReviewMediaUpload({ userId, courseId }: UseReviewMediaUploadOptions) {
  const sessionIdRef = useRef<string | null>(null);
  const [uploads, setUploads] = useState<ReviewMediaUpload[]>([]);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Create session on mount (when userId is available)
  useEffect(() => {
    if (!userId || !courseId) return;

    // Create new session for this wizard instance
    sessionIdRef.current = reviewUploadManager.createSession(userId, courseId);
    
    console.log('[useReviewMediaUpload] Created session:', sessionIdRef.current);

    // Subscribe to events
    const unsubscribe = reviewUploadManager.subscribe(
      sessionIdRef.current,
      (event) => {
        // Refresh state on any event
        if (sessionIdRef.current) {
          setUploads([...reviewUploadManager.getSessionUploads(sessionIdRef.current)]);
        }
        setForceUpdate(n => n + 1);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, courseId]);

  // Sync state with manager periodically during uploads
  useEffect(() => {
    if (!sessionIdRef.current) return;

    const interval = setInterval(() => {
      const current = reviewUploadManager.getSessionUploads(sessionIdRef.current!);
      const hasActive = current.some(u => 
        u.status === 'queued' || u.status === 'uploading' || u.status === 'processing'
      );
      
      if (hasActive) {
        setUploads([...current]);
      }
    }, 100); // Update UI every 100ms during uploads

    return () => clearInterval(interval);
  }, [forceUpdate]);

  /**
   * Add files to upload queue
   */
  const addFiles = useCallback((files: File[]) => {
    if (!sessionIdRef.current) return;

    for (const file of files) {
      reviewUploadManager.addUpload(sessionIdRef.current, file);
    }

    setUploads([...reviewUploadManager.getSessionUploads(sessionIdRef.current)]);
  }, []);

  /**
   * Add a single image
   */
  const addImage = useCallback((file: File) => {
    addFiles([file]);
  }, [addFiles]);

  /**
   * Add a single video
   */
  const addVideo = useCallback((file: File) => {
    addFiles([file]);
  }, [addFiles]);

  /**
   * Remove an upload
   */
  const removeUpload = useCallback(async (uploadId: string) => {
    await reviewUploadManager.removeUpload(uploadId);
    
    if (sessionIdRef.current) {
      setUploads([...reviewUploadManager.getSessionUploads(sessionIdRef.current)]);
    }
  }, []);

  /**
   * Retry a failed upload
   */
  const retryUpload = useCallback((uploadId: string) => {
    reviewUploadManager.retryUpload(uploadId);
    
    if (sessionIdRef.current) {
      setUploads([...reviewUploadManager.getSessionUploads(sessionIdRef.current)]);
    }
  }, []);

  /**
   * Attach all completed uploads to a review
   */
  const attachToReview = useCallback(async (reviewId: string) => {
    if (!sessionIdRef.current) {
      return { attached: 0, pending: 0, failed: 0 };
    }

    return reviewUploadManager.attachToReview(sessionIdRef.current, reviewId);
  }, []);

  /**
   * Cancel session and cleanup (on wizard close without submit)
   */
  const cancelSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    await reviewUploadManager.cancelSession(sessionIdRef.current);
    sessionIdRef.current = null;
    setUploads([]);
  }, []);

  /**
   * Get session ID for external reference
   */
  const getSessionId = useCallback(() => sessionIdRef.current, []);

  /**
   * Check if any uploads are in progress
   */
  const hasUploadsInProgress = sessionIdRef.current 
    ? reviewUploadManager.hasUploadsInProgress(sessionIdRef.current)
    : false;

  /**
   * Get status summary
   */
  const status = sessionIdRef.current
    ? reviewUploadManager.getSessionStatus(sessionIdRef.current)
    : { total: 0, ready: 0, uploading: 0, failed: 0, overallPercent: 0 };

  /**
   * Convert uploads to ReviewMediaItem format for UI compatibility
   */
  const mediaItems: ReviewMediaItem[] = uploads.map(u => ({
    id: u.id,
    type: u.type,
    status: u.status,
    previewUrl: u.previewUrl,
    uploadedUrl: u.uploadedUrl,
    progress: u.progress,
    error: u.error,
    streamId: u.streamId,
    posterUrl: u.posterUrl,
    dbRowId: u.dbRowId,
    isExisting: false,
  }));

  return {
    uploads,
    mediaItems,
    addFiles,
    addImage,
    addVideo,
    removeUpload,
    retryUpload,
    attachToReview,
    cancelSession,
    getSessionId,
    hasUploadsInProgress,
    status,
  };
}
