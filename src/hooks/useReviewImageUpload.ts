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

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReviewImageDraft {
  fileKey: string;
  fileName: string;
  fileSize: number;
  status: 'uploading' | 'ready' | 'failed';
  previewUrl: string; // blob URL for immediate display
  uploadedUrl: string | null; // R2 URL once uploaded
  dbRowId: string | null; // course_review_media row id
  error?: string;
  // Dimension metadata
  width?: number;
  height?: number;
  orientation?: 'portrait' | 'landscape' | 'square';
}

interface UseReviewImageUploadOptions {
  uploadSessionId: string;
  userId: string | null;
  onError?: (message: string) => void;
}

// Generate stable file key for tracking (consistent across references)
export const getImageFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

export function useReviewImageUpload({
  uploadSessionId,
  userId,
  onError,
}: UseReviewImageUploadOptions) {
  const [imageDrafts, setImageDrafts] = useState<ReviewImageDraft[]>([]);
  
  // Track if cleanup has been called (to prevent double cleanup)
  const cleanupCalledRef = useRef(false);

  /**
   * Extract image dimensions from a File object
   */
  const getImageDimensions = useCallback((file: File): Promise<{ width: number; height: number; orientation: 'portrait' | 'landscape' | 'square' }> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const orientation = width === height ? 'square' : width > height ? 'landscape' : 'portrait';
        URL.revokeObjectURL(url);
        resolve({ width, height, orientation });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to read image dimensions'));
      };
      img.src = url;
    });
  }, []);

  /**
   * Upload an image file to Cloudflare R2 immediately
   * Creates a pending DB row once upload completes (with NULL review_id)
   */
  const uploadImage = useCallback(async (file: File): Promise<ReviewImageDraft | null> => {
    if (!userId) {
      console.error('[ReviewImageUpload] No user ID');
      return null;
    }

    const fileKey = getImageFileKey(file);
    
    // Create blob URL for immediate preview
    const previewUrl = URL.createObjectURL(file);
    
    // Create initial draft in uploading state
    const draft: ReviewImageDraft = {
      fileKey,
      fileName: file.name,
      fileSize: file.size,
      status: 'uploading',
      previewUrl,
      uploadedUrl: null,
      dbRowId: null,
    };

    setImageDrafts(prev => [...prev, draft]);
    console.log('[ReviewImageUpload] Starting upload:', file.name);

    try {
      // Extract image dimensions before upload
      let dimensions: { width: number; height: number; orientation: 'portrait' | 'landscape' | 'square' } | null = null;
      try {
        dimensions = await getImageDimensions(file);
        console.log('[ReviewImageUpload] Extracted dimensions:', dimensions);
      } catch (dimError) {
        console.warn('[ReviewImageUpload] Failed to extract dimensions:', dimError);
        // Continue with upload even if dimension extraction fails
      }

      // Upload to Cloudflare R2
      const { uploadToCloudflareR2 } = await import('@/utils/cloudflareUpload');
      const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
      
      const uploadResult = await uploadToCloudflareR2(file, 'clbhouz-review-images', fileName);
      
      if (!uploadResult.success || !uploadResult.publicUrl) {
        throw new Error(uploadResult.error || 'Failed to upload image');
      }

      console.log('[ReviewImageUpload] Upload complete:', uploadResult.publicUrl);

      // Create pending DB row with NULL review_id and dimensions
      const insertData: Record<string, any> = {
        review_id: null, // NULL for pending - will be updated on submit
        media_url: uploadResult.publicUrl,
        media_type: 'image',
        file_name: file.name,
        file_size: file.size,
        status: 'pending',
        upload_session_id: uploadSessionId,
        owner_user_id: userId,
      };

      // Add dimensions if available
      if (dimensions) {
        insertData.width = dimensions.width;
        insertData.height = dimensions.height;
        insertData.aspect_ratio = parseFloat((dimensions.width / dimensions.height).toFixed(4));
        insertData.orientation = dimensions.orientation;
      }

      const { data: dbRow, error: dbError } = await supabase
        .from('course_review_media')
        .insert(insertData as any)
        .select('id')
        .single();

      if (dbError) {
        console.error('[ReviewImageUpload] DB insert error:', dbError);
        // Still consider upload successful - cleanup will handle orphans
      }

      // Update draft to ready state with dimensions
      const readyDraft: ReviewImageDraft = {
        ...draft,
        status: 'ready',
        uploadedUrl: uploadResult.publicUrl,
        dbRowId: dbRow?.id || null,
        width: dimensions?.width,
        height: dimensions?.height,
        orientation: dimensions?.orientation,
      };

      setImageDrafts(prev => 
        prev.map(d => d.fileKey === fileKey ? readyDraft : d)
      );

      console.log('[ReviewImageUpload] Image ready:', uploadResult.publicUrl, dimensions);
      return readyDraft;

    } catch (error) {
      console.error('[ReviewImageUpload] Upload failed:', error);
      
      const failedDraft: ReviewImageDraft = {
        ...draft,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Upload failed',
      };

      setImageDrafts(prev =>
        prev.map(d => d.fileKey === fileKey ? failedDraft : d)
      );

      onError?.(`Failed to upload ${file.name}`);
      return failedDraft;
    }
  }, [uploadSessionId, userId, onError]);

  /**
   * Remove an image draft and clean up the pending DB row
   */
  const removeImage = useCallback(async (fileKey: string) => {
    const draft = imageDrafts.find(d => d.fileKey === fileKey);
    if (!draft) return;

    console.log('[ReviewImageUpload] Removing image:', fileKey);

    // Remove from local state immediately
    setImageDrafts(prev => prev.filter(d => d.fileKey !== fileKey));

    // Revoke blob URL to prevent memory leaks
    if (draft.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(draft.previewUrl);
    }

    // Delete pending DB row if it exists
    if (draft.dbRowId) {
      try {
        await supabase
          .from('course_review_media')
          .delete()
          .eq('id', draft.dbRowId);
        console.log('[ReviewImageUpload] Cleaned up DB row:', draft.dbRowId);
      } catch (error) {
        console.error('[ReviewImageUpload] Cleanup error:', error);
        // Non-blocking - orphan cleanup will catch this
      }
    }
  }, [imageDrafts]);

  /**
   * Attach all pending images to a review (on submit)
   */
  const attachToReview = useCallback(async (reviewId: string) => {
    const pendingImages = imageDrafts.filter(d => d.status === 'ready' && d.dbRowId);
    
    if (pendingImages.length === 0) {
      console.log('[ReviewImageUpload] No pending images to attach');
      return { attached: 0 };
    }

    console.log('[ReviewImageUpload] Attaching', pendingImages.length, 'images to review:', reviewId);

    const dbRowIds = pendingImages.map(d => d.dbRowId).filter(Boolean) as string[];

    const { error } = await supabase
      .from('course_review_media')
      .update({ 
        review_id: reviewId, 
        status: 'attached' 
      } as any)
      .in('id', dbRowIds);

    if (error) {
      console.error('[ReviewImageUpload] Attach error:', error);
      throw error;
    }

    console.log('[ReviewImageUpload] Attached', pendingImages.length, 'images');
    return { attached: pendingImages.length };
  }, [imageDrafts]);

  /**
   * Cleanup all pending uploads (on modal close/cancel)
   */
  const cleanupPending = useCallback(async () => {
    // Prevent double cleanup
    if (cleanupCalledRef.current) {
      console.log('[ReviewImageUpload] Cleanup already called, skipping');
      return;
    }
    cleanupCalledRef.current = true;

    const pendingImages = imageDrafts.filter(d => d.status === 'ready' || d.status === 'uploading');
    
    if (pendingImages.length === 0) {
      console.log('[ReviewImageUpload] No pending images to clean up');
      return;
    }

    console.log('[ReviewImageUpload] Cleaning up', pendingImages.length, 'pending images');

    // Revoke all blob URLs
    for (const draft of pendingImages) {
      if (draft.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(draft.previewUrl);
      }
    }

    // Delete pending DB rows
    const dbRowIds = pendingImages
      .map(d => d.dbRowId)
      .filter(Boolean) as string[];

    if (dbRowIds.length > 0) {
      try {
        await supabase
          .from('course_review_media')
          .delete()
          .in('id', dbRowIds);
        console.log('[ReviewImageUpload] Cleaned up', dbRowIds.length, 'pending DB rows');
      } catch (error) {
        console.error('[ReviewImageUpload] Cleanup error:', error);
        // Non-blocking
      }
    }

    setImageDrafts([]);
  }, [imageDrafts]);

  /**
   * Reset state (without cleanup - for use after successful submit)
   */
  const reset = useCallback(() => {
    cleanupCalledRef.current = false;
    
    // Revoke blob URLs before clearing
    imageDrafts.forEach(d => {
      if (d.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(d.previewUrl);
      }
    });
    
    setImageDrafts([]);
  }, [imageDrafts]);

  /**
   * Reset cleanup flag when modal reopens (new session)
   */
  const resetCleanupFlag = useCallback(() => {
    cleanupCalledRef.current = false;
  }, []);

  /**
   * Check if any uploads are still in progress
   */
  const hasUploadsInProgress = imageDrafts.some(d => d.status === 'uploading');

  /**
   * Get count of ready images
   */
  const readyCount = imageDrafts.filter(d => d.status === 'ready').length;

  return {
    imageDrafts,
    uploadImage,
    removeImage,
    attachToReview,
    cleanupPending,
    reset,
    resetCleanupFlag,
    hasUploadsInProgress,
    readyCount,
  };
}
