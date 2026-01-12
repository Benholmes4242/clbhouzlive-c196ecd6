/**
 * Image Processing Service
 * 
 * Handles queuing and triggering image processing to bake filters
 * and text overlays into images for external sharing/download.
 */

import { supabase } from '@/integrations/supabase/client';
import { StudioEdits } from '@/types/studio';

interface ProcessableMedia {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
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
 * Check if media needs processing
 */
function needsProcessing(media: ProcessableMedia): boolean {
  if (media.mediaType === 'video') return false; // Phase 1: images only
  
  const filter = media.filterId || media.studioEdits?.filter;
  const hasFilter = filter && filter !== 'normal';
  const hasTextOverlays = media.studioEdits?.textOverlays && media.studioEdits.textOverlays.length > 0;
  const hasRotation = media.studioEdits?.rotate && media.studioEdits.rotate !== 0;
  
  return !!(hasFilter || hasTextOverlays || hasRotation);
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
 */
export function queueImageProcessing(mediaItems: ProcessableMedia[]): void {
  // Filter to only images that need processing
  const imagesToProcess = mediaItems.filter(needsProcessing);
  
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
  const imagesToProcess = mediaItems.filter(needsProcessing);
  
  if (imagesToProcess.length === 0) {
    return [];
  }

  return Promise.all(imagesToProcess.map(processImage));
}

/**
 * Mark media as skipped for processing (no edits to apply)
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
