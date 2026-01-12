/**
 * Image Processing Service
 * 
 * Handles queuing and triggering image processing to bake filters,
 * text overlays, crop, and rotation into images for external sharing/download.
 * 
 * Note: Videos are NOT processed - edits are CSS-only preview.
 * Video edits will display in-app but won't persist to downloads/external shares.
 */

import { supabase } from '@/integrations/supabase/client';
import { StudioEdits } from '@/types/studio';

interface ProcessableMedia {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  streamId?: string | null;
  studioEdits?: StudioEdits | null;
  filterId?: string | null;
  width?: number;
  height?: number;
}

interface ProcessingResult {
  mediaId: string;
  success: boolean;
  processedUrl?: string;
  skipped?: boolean;
  error?: string;
}

/**
 * Check if IMAGE needs processing (videos always return false)
 */
function needsProcessing(media: ProcessableMedia): boolean {
  // Videos are NEVER processed - CSS-only preview
  if (media.mediaType === 'video') {
    return false;
  }

  const filter = media.filterId || media.studioEdits?.filter;
  const hasFilter = filter && filter !== 'normal';
  const hasTextOverlays = media.studioEdits?.textOverlays && media.studioEdits.textOverlays.length > 0;
  const hasRotation = media.studioEdits?.rotate && media.studioEdits.rotate !== 0;
  const hasCrop = media.studioEdits?.crop?.ratio && media.studioEdits.crop.ratio !== 'original';
  
  return !!(hasFilter || hasTextOverlays || hasRotation || hasCrop);
}

/**
 * Check if a video has studio edits applied (for showing user warnings)
 */
export function videoHasEdits(edits?: StudioEdits | null): boolean {
  if (!edits) return false;

  const hasFilter = edits.filter && edits.filter !== 'normal';
  const hasTextOverlays = edits.textOverlays && edits.textOverlays.length > 0;
  const hasCrop = edits.crop?.ratio && edits.crop.ratio !== 'original';
  const hasRotation = edits.rotate && edits.rotate !== 0;
  const hasMusic = !!edits.music?.url;

  return !!(hasFilter || hasTextOverlays || hasCrop || hasRotation || hasMusic);
}

/**
 * Process a single image
 */
async function processImage(media: ProcessableMedia): Promise<ProcessingResult> {
  try {
    console.log('🎨 Processing image:', media.id);

    const { data, error } = await supabase.functions.invoke('process-image', {
      body: {
        mediaId: media.id,
        originalUrl: media.mediaUrl,
        studioEdits: media.studioEdits || {},
        filterId: media.filterId,
        width: media.width || 1080,
        height: media.height || 1080,
      },
    });

    if (error) {
      console.error('❌ Image processing error:', error);
      return { 
        mediaId: media.id, 
        success: false, 
        error: error.message 
      };
    }

    if (data.skipped) {
      console.log('⏭️ Image processing skipped:', data.reason);
      return { 
        mediaId: media.id, 
        success: true, 
        skipped: true 
      };
    }

    console.log('✅ Image processing complete:', data.processedUrl);
    return {
      mediaId: media.id,
      success: true,
      processedUrl: data.processedUrl,
    };
  } catch (err) {
    console.error('❌ Image processing failed:', err);
    return {
      mediaId: media.id,
      success: false,
      error: (err as Error).message,
    };
  }
}

/**
 * Queue image processing for a list of post media items
 * Runs in background - does not block the caller
 * 
 * Note: Videos are automatically skipped (CSS-only preview)
 */
export function queueImageProcessing(mediaItems: ProcessableMedia[]): void {
  // Filter to only IMAGES that need processing (videos are excluded)
  const imagesToProcess = mediaItems.filter(m => m.mediaType === 'image' && needsProcessing(m));
  
  // Mark videos as skipped immediately
  const videos = mediaItems.filter(m => m.mediaType === 'video');
  videos.forEach(v => {
    markMediaSkipped(v.id).catch(err => 
      console.warn('Failed to mark video as skipped:', err)
    );
  });

  if (imagesToProcess.length === 0) {
    console.log('📷 No images need processing');
    return;
  }

  console.log(`🎨 Queuing ${imagesToProcess.length} images for processing`);

  // Process in background - fire and forget
  Promise.all(imagesToProcess.map(processImage))
    .then(results => {
      const successful = results.filter(r => r.success && !r.skipped).length;
      const skipped = results.filter(r => r.skipped).length;
      const failed = results.filter(r => !r.success).length;
      console.log(`✅ Image processing complete: ${successful} processed, ${skipped} skipped, ${failed} failed`);
    })
    .catch(err => {
      console.error('❌ Background image processing error:', err);
    });
}

/**
 * Process images synchronously (for when you need to wait)
 */
export async function processImagesSync(mediaItems: ProcessableMedia[]): Promise<ProcessingResult[]> {
  const imagesToProcess = mediaItems.filter(m => m.mediaType === 'image' && needsProcessing(m));
  
  if (imagesToProcess.length === 0) {
    return [];
  }

  return Promise.all(imagesToProcess.map(processImage));
}

/**
 * Mark media as skipped for processing (no edits to apply or is a video)
 */
export async function markMediaSkipped(mediaId: string): Promise<void> {
  await supabase
    .from('post_media')
    .update({
      processing_status: 'skipped',
      processed_at: new Date().toISOString(),
    })
    .eq('id', mediaId);
}
