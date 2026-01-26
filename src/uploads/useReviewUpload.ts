/**
 * useReviewUpload - Hook for submitting reviews via unified upload pipeline
 * 
 * Uses the same infrastructure as post uploads:
 * - TUS resumable video uploads
 * - Client-side image compression
 * - Real-time progress tracking
 * - Network awareness
 * - UploadProgressBanner integration
 */

import { useCallback, useRef, useEffect } from 'react';
import { uploadEventBus } from './uploadEventBus';
import type { UploadCompleteEvent, UploadFailedEvent } from './uploadEvents';

interface UseReviewUploadOptions {
  userId: string | null;
  onSuccess?: (ratingId: string) => void;
  onError?: (error: Error) => void;
}

export interface ReviewSubmitData {
  courseId: string;
  courseName: string;
  ratingId?: string; // For editing existing review
  overallRating: number;
  breakdowns?: {
    design?: number | null;
    condition?: number | null;
    clubhouse?: number | null;
    facilities?: number | null;
  };
  title?: string;
  reviewText?: string;
  playedAt?: string;
  isPrivate?: boolean;
  files?: File[];
  selectedTags?: any[];
}

export function useReviewUpload(options: UseReviewUploadOptions) {
  const { userId, onSuccess, onError } = options;
  const jobIdRef = useRef<string | null>(null);
  const successCallbackRef = useRef(onSuccess);
  const errorCallbackRef = useRef(onError);
  
  // Keep refs updated
  useEffect(() => {
    successCallbackRef.current = onSuccess;
    errorCallbackRef.current = onError;
  }, [onSuccess, onError]);
  
  // Listen for completion events
  useEffect(() => {
    const handleComplete = (event: UploadCompleteEvent) => {
      if (event.jobId === jobIdRef.current && event.ratingId) {
        console.log('[useReviewUpload] Upload complete:', event.ratingId);
        successCallbackRef.current?.(event.ratingId);
        jobIdRef.current = null;
      }
    };
    
    const handleFailed = (event: UploadFailedEvent) => {
      if (event.jobId === jobIdRef.current) {
        console.error('[useReviewUpload] Upload failed:', event.error);
        errorCallbackRef.current?.(new Error(event.error || 'Upload failed'));
        jobIdRef.current = null;
      }
    };
    
    const unsubComplete = uploadEventBus.on('upload:complete', handleComplete);
    const unsubFailed = uploadEventBus.on('upload:failed', handleFailed);
    
    return () => {
      unsubComplete();
      unsubFailed();
    };
  }, []);
  
  const submitReview = useCallback(async (data: ReviewSubmitData): Promise<string> => {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Dynamically import to avoid circular dependencies
    const { enqueueReviewUpload } = await import('./uploadPipeline');
    
    const jobId = enqueueReviewUpload({
      type: 'review',
      userId,
      actorType: 'personal',
      actorId: userId,
      caption: '', // Not used for reviews
      files: data.files || [],
      reviewData: {
        courseId: data.courseId,
        courseName: data.courseName,
        ratingId: data.ratingId,
        overallRating: data.overallRating,
        breakdowns: data.breakdowns,
        title: data.title,
        reviewText: data.reviewText,
        playedAt: data.playedAt,
        isPrivate: data.isPrivate,
        selectedTags: data.selectedTags,
      },
    });
    
    jobIdRef.current = jobId;
    console.log('[useReviewUpload] Enqueued review upload:', jobId);
    
    return jobId;
  }, [userId]);
  
  const cancelUpload = useCallback(() => {
    if (jobIdRef.current) {
      console.log('[useReviewUpload] Cancelling upload:', jobIdRef.current);
      jobIdRef.current = null;
    }
  }, []);
  
  return {
    submitReview,
    cancelUpload,
    currentJobId: jobIdRef.current,
  };
}

