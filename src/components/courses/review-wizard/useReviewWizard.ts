/**
 * Review Wizard State Management Hook
 * 
 * Uses the unified upload pipeline for:
 * - TUS resumable video uploads
 * - Client-side image compression
 * - Real-time progress tracking with speed/ETA
 * - Network awareness (pause when offline)
 * - UploadProgressBanner integration
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useReviewUpload } from '@/uploads/useReviewUpload';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { invalidateCourseRatingCaches } from '@/utils/invalidateCourseRatingCaches';
import { useOptimisticReviewUpdate } from '@/hooks/useOptimisticReviewUpdate';
import type { 
  WizardState, 
  ReviewWizardCourse, 
  ExistingRating, 
  ReviewMediaItem,
  ReviewBreakdowns,
  ReviewTaggableEntity,
  WizardStepExtended,
} from './types';

interface UseReviewWizardOptions {
  course: ReviewWizardCourse | null;
  isEditMode: boolean;
  existingRating?: ExistingRating;
  onSuccess?: (ratingId: string) => void;
  /** Pre-populated media files from Post Wizard bridge flow */
  initialMediaFiles?: File[];
}

/**
 * Create notifications for users tagged in a review
 */
async function createReviewMentionNotifications({
  reviewId,
  courseId,
  courseName,
  reviewerId,
  taggedEntities,
}: {
  reviewId: string;
  courseId: string;
  courseName: string;
  reviewerId: string;
  taggedEntities: ReviewTaggableEntity[];
}) {
  // Filter to only user entities (businesses don't receive mention notifications)
  const userTags = taggedEntities.filter(t => t.entity_type === 'user');
  
  if (userTags.length === 0) return;
  
  // Get user IDs from taggable_entities - entity_id is the actual user_profiles.id
  const userIds = userTags
    .map(t => t.entity_id)
    .filter(id => id !== reviewerId); // Don't notify yourself
  
  if (userIds.length === 0) return;
  
  // Create notifications
  const notifications = userIds.map(userId => ({
    user_id: userId,
    recipient_actor_type: 'personal',
    recipient_actor_id: userId,
    type: 'review_mention',
    title: 'Mentioned you in a review',
    message: `mentioned you in a review of ${courseName}`,
    data: {
      review_id: reviewId,
      course_id: courseId,
    },
    actor_id: reviewerId,
    entity_type: 'review',
    entity_id: reviewId,
    read: false,
  }));
  
  const { error } = await supabase.from('notifications').insert(notifications);
  
  if (error) {
    console.error('[ReviewWizard] Failed to create mention notifications:', error);
  }
}

const INITIAL_BREAKDOWNS: ReviewBreakdowns = {
  design: null,
  condition: null,
  clubhouse: null,
  facilities: null,
};

const INITIAL_STATE: WizardState = {
  step: 1,
  rating: 5,
  breakdowns: INITIAL_BREAKDOWNS,
  title: '',
  review: '',
  media: [],
  coverMediaId: null,
  selectedTags: [],
};

export function useReviewWizard({
  course,
  isEditMode,
  existingRating,
  onSuccess,
  initialMediaFiles,
}: UseReviewWizardOptions) {
  
  const queryClient = useQueryClient();
  const { optimisticDeleteReview, rollback: rollbackOptimistic, confirmUpdate } = useOptimisticReviewUpdate();
  
  // Use existing auth session hook
  const { user, loading: isLoadingUser } = useSupabaseSession();
  const currentUserId = user?.id || null;
  
  // Fix 2: Auth loading timeout safety net — force loading to false after 3s
  // Prevents permanent "loading" state on slow connections/mobile WebViews
  const [authTimedOut, setAuthTimedOut] = useState(false);
  useEffect(() => {
    if (!isLoadingUser) return; // Already resolved, no timer needed
    const timer = setTimeout(() => setAuthTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, [isLoadingUser]);
  
  const effectiveLoadingUser = isLoadingUser && !authTimedOut;
  
  // Track if submit completed successfully (to skip cleanup on close)
  const submitCompletedRef = useRef(false);
  
  // Track pending files selected in MediaStep (uploaded on submit)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Stable blob URL cache — one URL per File, revoked on removal/unmount
  const blobUrlCache = useRef<Map<File, string>>(new Map());

  const getOrCreateBlobUrl = useCallback((file: File): string => {
    const existing = blobUrlCache.current.get(file);
    if (existing) return existing;
    const url = URL.createObjectURL(file);
    blobUrlCache.current.set(file, url);
    return url;
  }, []);

  // Revoke blob URLs for files no longer in pendingFiles
  useEffect(() => {
    const currentFiles = new Set(pendingFiles);
    for (const [file, url] of blobUrlCache.current.entries()) {
      if (!currentFiles.has(file)) {
        URL.revokeObjectURL(url);
        blobUrlCache.current.delete(file);
      }
    }
  }, [pendingFiles]);

  const cleanupBlobUrls = useCallback(() => {
    for (const [, url] of blobUrlCache.current.entries()) {
      URL.revokeObjectURL(url);
    }
    blobUrlCache.current.clear();
  }, []);
  
  // Process initial media files from Post Wizard bridge flow
  const hasProcessedInitialMedia = useRef(false);
  useEffect(() => {
    if (initialMediaFiles && initialMediaFiles.length > 0 && !hasProcessedInitialMedia.current && !isEditMode) {
      hasProcessedInitialMedia.current = true;
      setPendingFiles(initialMediaFiles);
      // Auto-set first as cover
      setState(prev => ({ ...prev, coverMediaId: 'pending-0' }));
    }
  }, [initialMediaFiles, isEditMode]);
  
  // Track existing media deletions to defer until submit (prevents data loss on cancel)
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  
  // Track the submitted rating ID for preview/success screens
  const [submittedRatingId, setSubmittedRatingId] = useState<string | null>(null);
  
  // Ref to prevent re-initialization of edit mode data
  const hasInitializedFromExisting = useRef(false);

  // Wizard state
  const [state, setState] = useState<WizardState>(() => {
    console.log('[EditMode] useState init - isEditMode:', isEditMode, 'title:', existingRating?.title, 'existingRating:', existingRating);
    if (isEditMode && existingRating) {
      return {
        ...INITIAL_STATE,
        rating: existingRating.rating,
        breakdowns: {
          design: existingRating.design_score,
          condition: existingRating.condition_score,
          clubhouse: existingRating.clubhouse_score,
          facilities: existingRating.facilities_score,
        },
        title: existingRating.title || '',
        review: existingRating.review || '',
      };
    }
    return INITIAL_STATE;
  });

  // Initialize state when existingRating loads asynchronously (handles race condition)
  useEffect(() => {
    console.log('[EditMode] useEffect init - isEditMode:', isEditMode, 'hasInitialized:', hasInitializedFromExisting.current, 'title:', existingRating?.title);
    if (isEditMode && existingRating && !hasInitializedFromExisting.current) {
      hasInitializedFromExisting.current = true;
      
      setState(prev => ({
        ...prev,
        rating: existingRating.rating,
        breakdowns: {
          design: existingRating.design_score ?? null,
          condition: existingRating.condition_score ?? null,
          clubhouse: existingRating.clubhouse_score ?? null,
          facilities: existingRating.facilities_score ?? null,
        },
        title: existingRating.title || '',
        review: existingRating.review || '',
      }));
      
      console.log('[useReviewWizard] Initialized edit mode with existing rating:', existingRating.rating);
    }
  }, [isEditMode, existingRating]);

  const { submitReview } = useReviewUpload({
    userId: currentUserId,
    onSuccess: (ratingId) => {
      console.log('[useReviewWizard] Review submitted successfully:', ratingId);
      submissionInProgressRef.current = false; // Reset ref so user can submit again if needed
      submitCompletedRef.current = true;
      
      // Store the ratingId for preview/success screens
      setSubmittedRatingId(ratingId);
      
      // Track analytics
      analyticsEvents.ratings.submitted({
        courseId: course?.id || '',
        courseName: course?.name || '',
        isNewReview: !isEditMode,
        overallRating: state.rating || 0,
        design: state.breakdowns.design || undefined,
        condition: state.breakdowns.condition || undefined,
        clubhouse: state.breakdowns.clubhouse || undefined,
        facilities: state.breakdowns.facilities || undefined,
      });

      // --- Optimistic cache insert: show the review instantly ---
      if (course?.id && currentUserId) {
        try {
          const optimisticReview = {
            id: ratingId,
            course_id: course.id,
            user_id: currentUserId,
            rating: state.rating,
            design_score: state.breakdowns.design ?? null,
            condition_score: state.breakdowns.condition ?? null,
            clubhouse_score: state.breakdowns.clubhouse ?? null,
            facilities_score: state.breakdowns.facilities ?? null,
            review: state.review || null,
            review_date: new Date().toISOString(),
            helpful_count: 0,
            unhelpful_count: 0,
            is_mock: false,
            user_profiles: {
              id: currentUserId,
              username: user?.user_metadata?.username || '',
              display_name: user?.user_metadata?.display_name || '',
              profile_photo_url: user?.user_metadata?.profile_photo_url || null,
            },
            course_review_media: [],
            media: [],
            _isOptimistic: true,
          };

          queryClient.setQueriesData(
            { queryKey: ['course-reviews-full', course.id], exact: false },
            (old: any) => {
              if (!old || !Array.isArray(old)) return old;
              return [optimisticReview, ...old.filter((r: any) => r.user_id !== currentUserId)];
            }
          );

          // Optimistic aggregates update
          queryClient.setQueryData(
            ['course-rating-aggregates', course.id],
            (old: any) => {
              if (!old) return old;
              const prevRating = isEditMode ? (existingRating?.rating || 0) : 0;
              const newCount = isEditMode ? old.review_count : (old.review_count || 0) + 1;
              const totalRating = isEditMode
                ? (old.avg_overall_score || 0) * old.review_count - prevRating + (state.rating || 0)
                : (old.avg_overall_score || 0) * (old.review_count || 0) + (state.rating || 0);
              return {
                ...old,
                review_count: newCount,
                avg_overall_score: newCount > 0 ? totalRating / newCount : 0,
                text_review_count: (old.text_review_count || 0) + (state.review ? (isEditMode ? 0 : 1) : 0),
                _isOptimistic: true,
              };
            }
          );

          // Set user rating cache
          queryClient.setQueryData(
            ['user-course-rating', course.id, currentUserId],
            {
              id: ratingId,
              rating: state.rating,
              review: state.review || null,
              design_score: state.breakdowns.design ?? null,
              condition_score: state.breakdowns.condition ?? null,
              clubhouse_score: state.breakdowns.clubhouse ?? null,
              facilities_score: state.breakdowns.facilities ?? null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              _isOptimistic: true,
            }
          );
        } catch (e) {
          // Non-critical — refetch will fix it
        }
      }

      // --- Force refetch critical queries (not just invalidate) ---
      if (course?.id) {
        void queryClient.refetchQueries({ queryKey: ['course-reviews-full', course.id], exact: false, type: 'all' });
        void queryClient.refetchQueries({ queryKey: ['course-rating-aggregates', course.id], type: 'all' });
        void queryClient.refetchQueries({ queryKey: ['course-rating-distribution', course.id], type: 'all' });
        void queryClient.refetchQueries({ queryKey: ['course-detail', course.id], type: 'all' });
        
        if (currentUserId) {
          void queryClient.refetchQueries({ queryKey: ['user-course-rating', course.id, currentUserId], type: 'all' });
        }
        
        // Media tab - reviews can include media
        queryClient.invalidateQueries({ queryKey: ['club-media', course.id] });
        void queryClient.refetchQueries({ queryKey: ['club-media-paginated', course.id], type: 'all' });
        
        // Played status
        if (currentUserId) {
          void queryClient.refetchQueries({ queryKey: ['user-played-course', course.id, currentUserId], type: 'all' });
        }
        
        // Legacy keys for backwards compatibility
        queryClient.invalidateQueries({ queryKey: ['course', course.id] });
        queryClient.invalidateQueries({ queryKey: ['course-details', course.id] });
        queryClient.invalidateQueries({ queryKey: ['course-rating-summary', course.id] });
        queryClient.invalidateQueries({ queryKey: ['my-course-rating', course.id] });
        queryClient.invalidateQueries({ queryKey: ['course-ratings', course.id] });
      }
      
      // Global queries
      queryClient.invalidateQueries({ queryKey: ['course-ratings'] });
      if (currentUserId) {
        // Clear exclusion for this course so it can auto-populate back
        if (course?.id) {
          supabase
            .from('user_top10_exclusions')
            .delete()
            .eq('user_id', currentUserId)
            .eq('course_id', course.id)
            .then(() => {});
        }
      }
      queryClient.invalidateQueries({ queryKey: ['review-media'] });
      queryClient.invalidateQueries({ queryKey: ['reviews-of-the-week'] });
      queryClient.invalidateQueries({ queryKey: ['user-exploration-status'] });
      queryClient.invalidateQueries({ queryKey: ['exploration-leaderboard'] });

      // Invalidate all course rating caches via shared helper
      invalidateCourseRatingCaches(queryClient);

      // Force immediate refetch of active profile queries
      void queryClient.refetchQueries({ queryKey: ['userTop100Courses'], type: 'active', exact: false });
      void queryClient.refetchQueries({ queryKey: ['user-played-courses-full'], type: 'active', exact: false });
      void queryClient.refetchQueries({ queryKey: ['user-top-ten-courses'], type: 'active', exact: false });

      // Refetch userProfile to reflect DB trigger updates (courses_logged)
      if (!isEditMode && currentUserId) {
        void queryClient.refetchQueries({
          queryKey: ['userProfile', currentUserId],
          type: 'active',
          exact: false
        });
      }

      // Friend review notifications are handled by the DB trigger
      // (notify_friends_on_course_review) which fires on course_ratings INSERT.
      // Do NOT also call the notify-friend-review edge function — that causes duplicates.

      // Both edit and new reviews go to success
      onSuccess?.(ratingId);
    },
    onError: (error) => {
      console.error('[useReviewWizard] Submit error:', error);
      submissionInProgressRef.current = false; // Reset ref so user can retry
      toast.error("Couldn't save review", { description: "Please try again" });
    },
  });

  // Fetch existing media for edit mode
  // Ref to prevent re-initialization of media
  const hasInitializedMediaFromExisting = useRef(false);
  
  const { data: existingMedia } = useQuery({
    queryKey: ['review-media', existingRating?.id],
    queryFn: async () => {
      if (!existingRating?.id) return [];
      const { data, error } = await supabase
        .from('course_review_media')
        .select('id, media_url, media_type, poster_url, stream_id, is_cover')
        .eq('review_id', existingRating.id)
        .eq('status', 'attached')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isEditMode && !!existingRating?.id,
  });

  // Initialize media state from existing media (with guard to prevent re-initialization)
  useEffect(() => {
    if (isEditMode && existingMedia && existingMedia.length > 0 && !hasInitializedMediaFromExisting.current) {
      hasInitializedMediaFromExisting.current = true;
      
      const mediaItems: ReviewMediaItem[] = existingMedia.map((m: any) => {
        const isVideo = m.media_type === 'video';
        return {
          id: m.id,
          type: m.media_type as 'image' | 'video',
          previewUrl: isVideo ? m.media_url : (m.poster_url || m.media_url),
          uploadedUrl: m.media_url,
          status: 'existing' as const,
          isCover: m.is_cover || false,
          dbRowId: m.id,
          streamId: m.stream_id,
          posterUrl: m.poster_url,
        };
      });
      
      setState(prev => ({
        ...prev,
        media: mediaItems,
        coverMediaId: mediaItems.find(m => m.isCover)?.id || mediaItems[0]?.id || null,
      }));
      
      console.log('[useReviewWizard] Loaded existing media:', mediaItems.length, 'items');
      
      // Load existing tags for edit mode
      if (existingRating?.id) {
        (async () => {
          try {
            const { data: existingTagData } = await supabase
              .from('review_tags')
              .select(`
                tagged_entity_id,
                start_index,
                end_index,
                taggable_entities!inner(
                  id,
                  entity_type,
                  entity_id,
                  name,
                  username
                )
              `)
              .eq('review_id', existingRating.id);

            const loadedTags: ReviewTaggableEntity[] = (existingTagData || []).map((t: any) => ({
              id: t.taggable_entities.id,
              entity_type: t.taggable_entities.entity_type,
              entity_id: t.taggable_entities.entity_id,
              name: t.taggable_entities.name,
              username: t.taggable_entities.username,
            }));

            if (loadedTags.length > 0) {
              setState(prev => ({ ...prev, selectedTags: loadedTags }));
              console.log('[useReviewWizard] Loaded existing tags:', loadedTags.length);
            }
          } catch (err) {
            console.warn('[useReviewWizard] Failed to load existing tags:', err);
          }
        })();
      }
    }
  }, [isEditMode, existingMedia]);

  // Combine existing media with pending files for UI display
  // CRITICAL: Pass file reference so CarouselSlide can create stable object URLs
  // This prevents videos from showing grey screen when blob URLs are revoked on re-render
  const allMedia: ReviewMediaItem[] = useMemo(() => [
    // Existing media from edit mode
    ...state.media.filter(m => m.status === 'existing'),
    // Pending files (local previews, not uploaded yet)
    // Use cached blob URLs to prevent memory leaks on recompute
    ...pendingFiles.map((file, index) => ({
      id: `pending-${index}`,
      type: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video',
      previewUrl: getOrCreateBlobUrl(file),  // Cached — one URL per File
      uploadedUrl: null,
      status: 'pending' as const,
      isCover: state.coverMediaId === `pending-${index}`,
      dbRowId: null,
      streamId: null,
      posterUrl: null,
      file: file,  // Keep file reference for stable blob URL in CarouselSlide
    } as ReviewMediaItem)),
  ], [state.media, pendingFiles, state.coverMediaId, getOrCreateBlobUrl]);

  // Navigation - handles extended step types
  const goToStep = useCallback((step: WizardStepExtended) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      // Only increment for numeric steps, cap at 3
      if (typeof prev.step === 'number' && prev.step < 3) {
        return { ...prev, step: (prev.step + 1) as WizardStepExtended };
      }
      return prev;
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => {
      // Only decrement for numeric steps
      if (typeof prev.step === 'number' && prev.step > 1) {
        return { ...prev, step: (prev.step - 1) as WizardStepExtended };
      }
      return prev;
    });
  }, []);

  // State updates - normalize to 1 decimal place for 0-10 scale
  const setRating = useCallback((rating: number) => {
    const normalizedRating = parseFloat(rating.toFixed(1));
    setState(prev => ({ ...prev, rating: normalizedRating }));
  }, []);

  // Handle breakdown changes - normalize to 1 decimal place for 0-10 scale
  const setBreakdown = useCallback((key: keyof ReviewBreakdowns, value: number | null) => {
    const normalizedValue = value !== null ? parseFloat(value.toFixed(1)) : null;
    setState(prev => ({
      ...prev,
      breakdowns: { ...prev.breakdowns, [key]: normalizedValue },
    }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setState(prev => ({ ...prev, title }));
  }, []);

  const setReview = useCallback((review: string) => {
    setState(prev => ({ ...prev, review }));
  }, []);

  const setTags = useCallback((tags: ReviewTaggableEntity[]) => {
    setState(prev => ({ ...prev, selectedTags: tags }));
  }, []);

  const setCoverMedia = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, coverMediaId: id }));
  }, []);

  // Media handlers - store files locally (upload-on-submit pattern)
  const addImages = useCallback(async (files: File[]) => {
    setPendingFiles(prev => [...prev, ...files]);
    
    // Auto-set first media as cover if none set
    if (!state.coverMediaId && allMedia.length === 0 && files.length > 0) {
      setState(prev => ({ ...prev, coverMediaId: 'pending-0' }));
    }
  }, [state.coverMediaId, allMedia.length]);

  const addVideo = useCallback(async (file: File) => {
    setPendingFiles(prev => [...prev, file]);
    
    // Auto-set first media as cover if none set
    if (!state.coverMediaId && allMedia.length === 0) {
      setState(prev => ({ ...prev, coverMediaId: `pending-${pendingFiles.length}` }));
    }
  }, [state.coverMediaId, allMedia.length, pendingFiles.length]);

  const removeMedia = useCallback(async (id: string) => {
    // Check if it's existing media
    const existingItem = state.media.find(m => m.id === id && m.status === 'existing');
    if (existingItem && existingItem.dbRowId) {
      // Defer deletion — add to pending list, remove from UI state only
      setPendingDeletions(prev => [...prev, existingItem.dbRowId!]);
      setState(prev => ({
        ...prev,
        media: prev.media.filter(m => m.id !== id),
        coverMediaId: prev.coverMediaId === id ? null : prev.coverMediaId,
      }));
      return;
    }

    // Remove from pending files if it's a pending item
    if (id.startsWith('pending-')) {
      const index = parseInt(id.replace('pending-', ''), 10);
      setPendingFiles(prev => prev.filter((_, i) => i !== index));
      if (state.coverMediaId === id) {
        setState(prev => ({ ...prev, coverMediaId: null }));
      }
    }
  }, [state.media, state.coverMediaId]);

  // Reorder media - updates pendingFiles order for drag-and-drop persistence
  const reorderMedia = useCallback((fromIndex: number, toIndex: number) => {
    // Get count of existing media (edit mode)
    const existingCount = state.media.filter(m => m.status === 'existing').length;
    
    // Determine if we're reordering within existing media, pending files, or across both
    if (fromIndex < existingCount && toIndex < existingCount) {
      // Both indices are within existing media - update state.media
      setState(prev => {
        const existingItems = prev.media.filter(m => m.status === 'existing');
        const [moved] = existingItems.splice(fromIndex, 1);
        existingItems.splice(toIndex, 0, moved);
        
        // Preserve any non-existing items and merge
        const otherItems = prev.media.filter(m => m.status !== 'existing');
        return { ...prev, media: [...existingItems, ...otherItems] };
      });
    } else if (fromIndex >= existingCount && toIndex >= existingCount) {
      // Both indices are within pending files
      const pendingFromIndex = fromIndex - existingCount;
      const pendingToIndex = toIndex - existingCount;
      
      setPendingFiles(prev => {
        const items = [...prev];
        const [moved] = items.splice(pendingFromIndex, 1);
        items.splice(pendingToIndex, 0, moved);
        return items;
      });
    } else {
      // Cross-boundary reorder (rare case) - for simplicity, we just handle pending files
      // This would require converting between existing media and pending files
      console.log('[useReviewWizard] Cross-boundary reorder not supported');
    }
  }, [state.media]);

  // Retry failed upload (no-op in new system - handled by pipeline)
  const retryMedia = useCallback((id: string) => {
    console.log('[useReviewWizard] Retry not needed with unified pipeline - files upload on submit');
  }, []);

  // Track submission state with ref guard to prevent double submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInProgressRef = useRef(false);


  // Submit handler - uses unified upload pipeline
  const handleSubmit = useCallback(async () => {
    // Guard against double submission
    if (submissionInProgressRef.current || isSubmitting) {
      console.log('[useReviewWizard] Submission already in progress, ignoring');
      return;
    }
    
    // Auth check inside handleSubmit — by Step 4, user was already authenticated.
    // This catches session expiry edge case.
    if (!currentUserId) {
      toast.error('Session expired', { description: 'Please sign in again' });
      return;
    }
    
    if (!course) {
      toast.error('Course not found');
      return;
    }
    
    if (!state.rating) {
      toast.error('Rating required');
      return;
    }
    
    submissionInProgressRef.current = true;
    setIsSubmitting(true);
    
    try {
      // Reorder files so cover is at index 0 for the pipeline
      const effectiveCoverMediaId = state.coverMediaId
        ?? (() => {
          const firstVideoIdx = pendingFiles.findIndex(f => f.type.startsWith('video/'));
          return firstVideoIdx >= 0 ? `pending-${firstVideoIdx}` : 'pending-0';
        })();

      const coverFileIndex = pendingFiles.findIndex(
        (_, i) => `pending-${i}` === effectiveCoverMediaId
      );
      const orderedFiles = coverFileIndex > 0
        ? [pendingFiles[coverFileIndex], ...pendingFiles.filter((_, i) => i !== coverFileIndex)]
        : pendingFiles;

      await submitReview({
        courseId: course.id,
        courseName: course.name,
        ratingId: isEditMode ? existingRating?.id : undefined,
        overallRating: state.rating,
        breakdowns: {
          design: state.breakdowns.design ?? null,
          condition: state.breakdowns.condition ?? null,
          clubhouse: state.breakdowns.clubhouse ?? null,
          facilities: state.breakdowns.facilities ?? null,
        },
        title: state.title || undefined,
        reviewText: state.review || undefined,
        isPrivate: false,
        files: orderedFiles,
        coverMediaId: effectiveCoverMediaId,
        selectedTags: state.selectedTags,
      });
      
      // Execute deferred media deletions after successful submit
      if (pendingDeletions.length > 0) {
        const { error: delError } = await supabase
          .from('course_review_media')
          .delete()
          .in('id', pendingDeletions);
        
        if (delError) {
          console.warn('[useReviewWizard] Failed to delete deferred media:', delError);
        } else {
          console.log('[useReviewWizard] Deleted', pendingDeletions.length, 'deferred media items');
          setPendingDeletions([]);
        }
      }
      
      // submitReview only enqueues the job — actual processing is async.
      // submissionInProgressRef is reset by onSuccess/onError callbacks.
      
    } catch (error) {
      console.error('[useReviewWizard] Submit error:', error);
      submissionInProgressRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }, [course, state, currentUserId, isEditMode, existingRating, submitReview, pendingFiles, pendingDeletions, toast, isSubmitting]);

  // Delete mutation for removing existing reviews
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!existingRating?.id) {
        throw new Error('No existing rating to delete');
      }

      const reviewId = existingRating.id;

      // 1. First, fetch ALL media attached to this review for cleanup
      const { data: allMediaData } = await supabase
        .from('course_review_media')
        .select('id, media_url, media_type, stream_id')
        .eq('review_id', reviewId);

      // 2. Delete any shared posts linked to this review
      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .eq('source_review_id', reviewId);

      if (postsError) {
        console.warn('[ReviewWizard] Failed to delete shared posts:', postsError);
      }

      // 2b. Delete associated friend_course_review notifications
      const { error: notifError } = await supabase
        .from('notifications')
        .delete()
        .eq('entity_id', reviewId)
        .eq('type', 'friend_course_review');

      if (notifError) {
        console.warn('[ReviewWizard] Failed to delete notifications:', notifError);
      }

      // 3. Delete the rating - cascade will handle course_review_media and votes
      const { error } = await supabase
        .from('course_ratings')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      // 4. Cleanup external storage (Cloudflare Stream + R2) - fire and forget
      if (allMediaData && allMediaData.length > 0) {
        const mediaItems = allMediaData.map(m => ({
          id: m.id,
          media_url: m.media_url,
          media_type: m.media_type as 'image' | 'video',
          stream_id: m.stream_id,
        }));

        supabase.functions.invoke('cleanup-review-media', {
          body: { mediaItems },
        }).catch(err => {
          console.warn('[ReviewWizard] Failed to cleanup media:', err);
        });
      }

      return reviewId;
    },
    onMutate: async () => {
      // Optimistically remove the review from all caches before the server call
      if (course?.id && currentUserId) {
        const snapshot = await optimisticDeleteReview(course.id, currentUserId);
        return { snapshot };
      }
      return {};
    },
    onSuccess: () => {
      // Confirm optimistic update with server truth
      if (course?.id && currentUserId) {
        confirmUpdate(course.id, currentUserId);
      }

      // Force refetch critical queries for immediate UI update
      if (course?.id) {
        void queryClient.refetchQueries({ queryKey: ['course-reviews-full', course.id], exact: false, type: 'all' });
        void queryClient.refetchQueries({ queryKey: ['course-rating-aggregates', course.id], type: 'all' });
        void queryClient.refetchQueries({ queryKey: ['course-rating-distribution', course.id], type: 'all' });
        void queryClient.refetchQueries({ queryKey: ['course-detail', course.id], type: 'all' });
      }

      // Global queries
      queryClient.invalidateQueries({ queryKey: ['course-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating'] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews-full'] });
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: ['user-top-ten-courses', currentUserId], refetchType: 'all' });
        
        // Clear exclusion for this course on delete too
        if (course?.id) {
          supabase
            .from('user_top10_exclusions')
            .delete()
            .eq('user_id', currentUserId)
            .eq('course_id', course.id)
            .then(() => {});
        }
      }
      queryClient.invalidateQueries({ queryKey: ['review-media'] });
      queryClient.invalidateQueries({ queryKey: ['club-media-paginated'] });
      if (course?.id && currentUserId) {
        void queryClient.refetchQueries({ queryKey: ['user-played-course', course.id, currentUserId], type: 'all' });
      }
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-feed'] });
      queryClient.invalidateQueries({ queryKey: ['clubhouse-posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
      queryClient.invalidateQueries({ queryKey: ['actor-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-exploration-status'] });
      queryClient.invalidateQueries({ queryKey: ['exploration-leaderboard'] });
      // Profile page queries
      queryClient.invalidateQueries({ queryKey: ['user-course-ratings-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['user-played-courses-full'] });
      queryClient.invalidateQueries({ queryKey: ['user-course-activity'] });
      // Previously missing
      queryClient.invalidateQueries({ queryKey: ['user-course-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews-of-the-week'] });
    },
    onError: (error, _variables, context) => {
      console.error('[ReviewWizard] Delete error:', error);
      // Rollback optimistic update
      if (context?.snapshot && course?.id && currentUserId) {
        rollbackOptimistic(course.id, currentUserId, context.snapshot);
      }
      toast.error("Couldn't remove review", { description: "Please try again" });
    },
  });

  // Cleanup on unmount - revoke all cached blob URLs
  const cleanup = useCallback(async () => {
    cleanupBlobUrls();
    setPendingFiles([]);
    setPendingDeletions([]); // Discard deferred deletions on cancel
  }, [cleanupBlobUrls]);

  // Check if can proceed to next step
  // Step 1: requires rating; all other steps: always true
  const canProceed = state.step === 1 ? state.rating !== null : true;
  
  // Check if any uploads are in progress (always false with upload-on-submit)
  const hasUploadsInProgress = isSubmitting;

  return {
    state,
    allMedia,
    canProceed,
    hasUploadsInProgress,
    isSubmitting,
    isLoadingUser: effectiveLoadingUser,
    isDeleting: deleteMutation.isPending,
    submittedRatingId,
    uploadStatus: { total: pendingFiles.length, ready: 0, uploading: 0, failed: 0, overallPercent: 0 },
    
    // Navigation
    goToStep,
    nextStep,
    prevStep,
    
    // State updates
    setRating,
    setBreakdown,
    setTitle,
    setReview,
    setTags,
    setCoverMedia,
    
    // Media
    addImages,
    addVideo,
    removeMedia,
    retryMedia,
    reorderMedia,
    
    // Actions
    submit: handleSubmit,
    deleteReview: deleteMutation.mutateAsync,
    cleanup,
    reset: () => {
      cleanupBlobUrls();
      setState(INITIAL_STATE);
      setPendingFiles([]);
      setPendingDeletions([]);
      submitCompletedRef.current = false;
      submissionInProgressRef.current = false;
      setSubmittedRatingId(null);
    },
  };
}
