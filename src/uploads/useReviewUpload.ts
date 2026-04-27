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
import type { UploadCompleteEvent, UploadFailedEvent, ReviewRatingCreatedEvent } from './uploadEvents';

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
  coverMediaId?: string | null;
}

export function useReviewUpload(options: UseReviewUploadOptions) {
  const { userId, onSuccess, onError } = options;
  const jobIdRef = useRef<string | null>(null);
  const successCallbackRef = useRef(onSuccess);
  const errorCallbackRef = useRef(onError);
  const hasCalledSuccessRef = useRef(false); // Prevent double-calling onSuccess
  
  // Keep refs updated
  // NOTE (Fix 10 audit, D28 stale-state risk): the consuming hook
  // (useReviewWizard) rebuilds `onSuccess` every render and reads its closed-over
  // state inside that callback. Because we sync `successCallbackRef.current` on
  // every change of `onSuccess`, the event handler below always invokes the
  // *latest* closure — which closes over the most recent `state.rating`
  // (including the derived verdict committed via setState before submitReview).
  // Conclusion: closure is fresh, no stale-state bug. If this ref-sync is ever
  // removed, audit downstream consumers that read state inside onSuccess.
  useEffect(() => {
    successCallbackRef.current = onSuccess;
    errorCallbackRef.current = onError;
  }, [onSuccess, onError]);
  
  // Listen for events
  useEffect(() => {
    // Handle rating created - navigate immediately!
    // This fires right after the rating record is created, BEFORE media uploads
    const handleRatingCreated = (event: ReviewRatingCreatedEvent) => {
      if (event.jobId === jobIdRef.current && !hasCalledSuccessRef.current) {
        console.log('[useReviewUpload] Rating created - navigating immediately:', event.ratingId);
        hasCalledSuccessRef.current = true;
        successCallbackRef.current?.(event.ratingId);
        // Don't clear jobIdRef yet - media uploads may still be in progress
      }
    };
    
    // Handle full completion (all media uploaded)
    const handleComplete = (event: UploadCompleteEvent) => {
      if (event.jobId === jobIdRef.current && event.ratingId) {
        console.log('[useReviewUpload] Upload complete:', event.ratingId);
        // Only call success if we haven't already (for reviews without media)
        if (!hasCalledSuccessRef.current) {
          hasCalledSuccessRef.current = true;
          successCallbackRef.current?.(event.ratingId);
        }
        jobIdRef.current = null;
        hasCalledSuccessRef.current = false;
      }
    };
    
    const handleFailed = (event: UploadFailedEvent) => {
      if (event.jobId === jobIdRef.current) {
        console.error('[useReviewUpload] Upload failed:', event.error);
        errorCallbackRef.current?.(new Error(event.error || 'Upload failed'));
        jobIdRef.current = null;
        hasCalledSuccessRef.current = false;
      }
    };
    
    const unsubRatingCreated = uploadEventBus.on('review:rating-created', handleRatingCreated);
    const unsubComplete = uploadEventBus.on('upload:complete', handleComplete);
    const unsubFailed = uploadEventBus.on('upload:failed', handleFailed);
    
    return () => {
      unsubRatingCreated();
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
        coverMediaId: data.coverMediaId ?? null,
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

