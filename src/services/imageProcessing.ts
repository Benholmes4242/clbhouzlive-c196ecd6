/**
 * Media Processing Service
 * 
 * Handles queuing and triggering media processing to bake filters,
 * text overlays, and music into images and videos for external sharing/download.
 * 
 * Phase 1: Images - Full processing with SVG compositing
 * Phase 2: Videos - Deferred to external service (marked for future processing)
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
  deferred?: boolean;
  error?: string;
}

/**
 * Check if media needs processing
 */
function needsProcessing(media: ProcessableMedia): boolean {
  const filter = media.filterId || media.studioEdits?.filter;
  const hasFilter = filter && filter !== 'normal';
  const hasTextOverlays = media.studioEdits?.textOverlays && media.studioEdits.textOverlays.length > 0;
  const hasRotation = media.studioEdits?.rotate && media.studioEdits.rotate !== 0;
  const hasCrop = media.studioEdits?.crop?.ratio && media.studioEdits.crop.ratio !== 'original';
  const hasMusic = !!(media.studioEdits as any)?.music?.url;
  
  return !!(hasFilter || hasTextOverlays || hasRotation || hasCrop || hasMusic);
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
 * Process a single video (Phase 2 - deferred processing)
 */
async function processVideo(media: ProcessableMedia): Promise<ProcessingResult> {
  try {
    console.log('🎬 Queuing video for processing:', media.id);

    const { data, error } = await supabase.functions.invoke('process-video', {
      body: {
        mediaId: media.id,
        originalUrl: media.mediaUrl,
        streamId: media.streamId,
        studioEdits: media.studioEdits || {},
        filterId: media.filterId,
        width: media.width || 1080,
        height: media.height || 1920,
      },
    });

    if (error) {
      console.error('❌ Video processing error:', error);
      return { 
        mediaId: media.id, 
        success: false, 
        error: error.message 
      };
    }

    if (data.skipped) {
      console.log('⏭️ Video processing skipped:', data.reason);
      return { 
        mediaId: media.id, 
        success: true, 
        skipped: true 
      };
    }

    if (data.deferred) {
      console.log('📝 Video processing deferred:', data.reason);
      return {
        mediaId: media.id,
        success: true,
        deferred: true,
      };
    }

    console.log('✅ Video processing complete:', data.processedUrl);
    return {
      mediaId: media.id,
      success: true,
      processedUrl: data.processedUrl,
    };
  } catch (err) {
    console.error('❌ Video processing failed:', err);
    return {
      mediaId: media.id,
      success: false,
      error: (err as Error).message,
    };
  }
}

/**
 * Process a single media item (image or video)
 */
async function processMedia(media: ProcessableMedia): Promise<ProcessingResult> {
  if (media.mediaType === 'video') {
    return processVideo(media);
  }
  return processImage(media);
}

/**
 * Queue media processing for a list of post media items
 * Runs in background - does not block the caller
 * Handles both images (full processing) and videos (deferred processing)
 */
export function queueImageProcessing(mediaItems: ProcessableMedia[]): void {
  // Filter to only media that needs processing
  const mediaToProcess = mediaItems.filter(needsProcessing);
  
  if (mediaToProcess.length === 0) {
    console.log('📷 No media needs processing');
    return;
  }

  const imageCount = mediaToProcess.filter(m => m.mediaType === 'image').length;
  const videoCount = mediaToProcess.filter(m => m.mediaType === 'video').length;
  console.log(`🎨 Queuing ${imageCount} images and ${videoCount} videos for processing`);

  // Process in background - fire and forget
  Promise.all(mediaToProcess.map(processMedia))
    .then(results => {
      const successful = results.filter(r => r.success && !r.skipped && !r.deferred).length;
      const skipped = results.filter(r => r.skipped).length;
      const deferred = results.filter(r => r.deferred).length;
      const failed = results.filter(r => !r.success).length;
      console.log(`✅ Media processing complete: ${successful} processed, ${deferred} deferred, ${skipped} skipped, ${failed} failed`);
    })
    .catch(err => {
      console.error('❌ Background media processing error:', err);
    });
}

/**
 * Process media synchronously (for when you need to wait)
 */
export async function processMediaSync(mediaItems: ProcessableMedia[]): Promise<ProcessingResult[]> {
  const mediaToProcess = mediaItems.filter(needsProcessing);
  
  if (mediaToProcess.length === 0) {
    return [];
  }

  return Promise.all(mediaToProcess.map(processMedia));
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
