// Draft media upload service
// Uploads media to R2 with drafts/ prefix for temporary storage
// Handles both images (R2) and videos (Cloudflare Stream)

import { supabase } from '@/integrations/supabase/client';
import { uploadToCloudflareR2 } from '@/utils/cloudflareUpload';
import { uploadToCloudflareStream } from '@/utils/cloudflareStreamUpload';
import { addDraftMedia, deleteDraftMedia } from './draftService';
import type { DraftMediaItem } from './types';
import type { ComposerMediaItem } from '@/hooks/useSnapModal';

// Custom bucket type for drafts - uses same R2 bucket with drafts/ prefix
const DRAFTS_BUCKET_TYPE = 'clbhouz-post-images' as const;
const DRAFTS_PATH_PREFIX = 'drafts';

export interface DraftMediaUploadResult {
  success: boolean;
  mediaItem?: DraftMediaItem;
  error?: string;
}

/**
 * Upload a single media file for a draft
 * - Images go to R2 with drafts/ prefix path
 * - Videos go to Cloudflare Stream (same as regular uploads)
 */
export async function uploadDraftMediaFile(
  draftId: string,
  file: File,
  displayOrder: number,
  options?: {
    studioEdits?: Record<string, unknown>;
    filterId?: string;
    width?: number;
    height?: number;
    aspectRatio?: number;
    durationSeconds?: number;
  }
): Promise<DraftMediaUploadResult> {
  const isVideo = file.type.startsWith('video/');
  
  try {
    console.log('[draftMediaUpload] Uploading:', file.name, isVideo ? '(video)' : '(image)');
    
    let mediaUrl: string;
    let streamId: string | undefined;
    let posterUrl: string | undefined;
    
    if (isVideo) {
      // Videos go to Cloudflare Stream
      const result = await uploadToCloudflareStream(file);
      if (!result.success || !result.videoUrl) {
        return { success: false, error: result.error || 'Video upload failed' };
      }
      mediaUrl = result.videoUrl;
      streamId = result.streamId;
      posterUrl = result.posterUrl;
    } else {
      // Images go to R2 with drafts prefix in filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 10);
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${DRAFTS_PATH_PREFIX}/${timestamp}-${randomId}.${ext}`;
      
      const result = await uploadToCloudflareR2(file, DRAFTS_BUCKET_TYPE, fileName);
      if (!result.success || !result.publicUrl) {
        return { success: false, error: result.error || 'Image upload failed' };
      }
      mediaUrl = result.publicUrl;
    }
    
    // Store reference in database
    const mediaItem = await addDraftMedia(
      draftId,
      mediaUrl,
      isVideo ? 'video' : 'image',
      displayOrder,
      {
        streamId,
        posterUrl,
        width: options?.width,
        height: options?.height,
        aspectRatio: options?.aspectRatio,
        durationSeconds: options?.durationSeconds,
        studioEdits: options?.studioEdits,
        filterId: options?.filterId,
        fileName: file.name,
        fileSize: file.size,
      }
    );
    
    if (!mediaItem) {
      return { success: false, error: 'Failed to save media reference' };
    }
    
    console.log('[draftMediaUpload] Upload complete:', mediaItem.id);
    return { success: true, mediaItem };
    
  } catch (error) {
    console.error('[draftMediaUpload] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Upload all media files for a draft
 * Returns array of successfully uploaded items
 */
export async function uploadAllDraftMedia(
  draftId: string,
  mediaItems: ComposerMediaItem[],
  getEdits?: (mediaId: string) => Record<string, unknown> | undefined
): Promise<{ 
  uploaded: DraftMediaItem[]; 
  failed: Array<{ index: number; error: string }>;
}> {
  const uploaded: DraftMediaItem[] = [];
  const failed: Array<{ index: number; error: string }> = [];
  
  for (let i = 0; i < mediaItems.length; i++) {
    const item = mediaItems[i];
    if (!item.file) {
      failed.push({ index: i, error: 'No file available' });
      continue;
    }
    
    const edits = getEdits?.(item.id);
    
    const result = await uploadDraftMediaFile(draftId, item.file, i, {
      studioEdits: edits,
      filterId: edits?.filter as string | undefined,
      width: item.width,
      height: item.height,
      aspectRatio: item.aspectRatio,
      durationSeconds: item.duration,
    });
    
    if (result.success && result.mediaItem) {
      uploaded.push(result.mediaItem);
    } else {
      failed.push({ index: i, error: result.error || 'Unknown error' });
    }
  }
  
  return { uploaded, failed };
}

/**
 * Convert DraftMediaItem to ComposerMediaItem for loading into composer
 * Note: The File object cannot be restored - only the URL can be used
 */
export function draftMediaToComposerItem(media: DraftMediaItem): ComposerMediaItem {
  const isVideo = media.mediaType === 'video';
  
  return {
    id: media.id,
    type: media.mediaType,
    // For videos, use poster as preview; for images, use the media URL
    previewUrl: isVideo ? (media.posterUrl || media.mediaUrl) : media.mediaUrl,
    thumbnailUrl: isVideo ? media.posterUrl || undefined : undefined,
    // No file available - it was uploaded to storage
    file: undefined,
    // Dimensions from stored metadata
    width: media.width || undefined,
    height: media.height || undefined,
    aspectRatio: media.aspectRatio || undefined,
    duration: media.durationSeconds || undefined,
    // Mark as restored so we know to use the URL directly instead of re-uploading
    isRestored: true,
    restoredMediaUrl: media.mediaUrl,
    restoredStreamId: isVideo ? (media.streamId || undefined) : undefined,
  };
}

/**
 * Delete draft media from storage
 * Note: R2 delete is a no-op currently (per cloudflareUpload.ts)
 * Stream assets are cleaned up by the orphan cleanup cron
 */
export async function cleanupDraftMedia(mediaItems: DraftMediaItem[]): Promise<void> {
  console.log('[draftMediaUpload] Cleanup requested for', mediaItems.length, 'items');
  
  // Clean up Stream videos
  for (const item of mediaItems) {
    if (item.streamId) {
      try {
        await supabase.functions.invoke('cloudflare-stream-delete', {
          body: { uid: item.streamId },
        });
        console.log('[draftMediaUpload] Deleted stream asset:', item.streamId);
      } catch (err) {
        console.warn('[draftMediaUpload] Failed to delete stream asset:', item.streamId, err);
      }
    }
  }

  // Clean up R2 images
  const imageItems = mediaItems.filter(m => m.mediaType === 'image' && m.mediaUrl);
  if (imageItems.length > 0) {
    const objectKeys = imageItems
      .map(m => {
        try {
          const url = new URL(m.mediaUrl);
          const path = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
          return path;
        } catch {
          console.error('[draftMediaUpload] Invalid media URL:', m.mediaUrl);
          return null;
        }
      })
      .filter((key): key is string => key !== null && key.startsWith('drafts/'));

    if (objectKeys.length > 0) {
      try {
        await supabase.functions.invoke('cloudflare-r2-delete', {
          body: { objectKeys },
        });
        console.log('[draftMediaUpload] Deleted R2 objects:', objectKeys);
      } catch (err) {
        // Non-fatal — R2 lifecycle rules serve as fallback
        console.warn('[draftMediaUpload] Failed to delete R2 draft images:', err);
      }
    }
  }
}
