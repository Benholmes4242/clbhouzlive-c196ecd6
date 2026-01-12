/**
 * useImageProcessing - Hook to trigger and track image processing
 * 
 * Triggers the process-image Edge Function to bake filters and text overlays
 * into images for external sharing/download.
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StudioEdits } from '@/types/studio';

interface ProcessImageParams {
  mediaId: string;
  originalUrl: string;
  studioEdits: StudioEdits;
  filterId?: string | null;
  width?: number;
  height?: number;
}

interface ProcessImageResult {
  success: boolean;
  processedUrl?: string;
  skipped?: boolean;
  error?: string;
}

export function useImageProcessing() {
  const processImage = useCallback(async (params: ProcessImageParams): Promise<ProcessImageResult> => {
    try {
      console.log('🎨 Triggering image processing:', params.mediaId);

      const { data, error } = await supabase.functions.invoke('process-image', {
        body: {
          mediaId: params.mediaId,
          originalUrl: params.originalUrl,
          studioEdits: params.studioEdits,
          filterId: params.filterId,
          width: params.width || 1080,
          height: params.height || 1080,
        },
      });

      if (error) {
        console.error('❌ Image processing error:', error);
        return { success: false, error: error.message };
      }

      if (data.skipped) {
        console.log('⏭️ Image processing skipped:', data.reason);
        return { success: true, skipped: true };
      }

      console.log('✅ Image processing complete:', data.processedUrl);
      return {
        success: true,
        processedUrl: data.processedUrl,
      };
    } catch (err) {
      console.error('❌ Image processing failed:', err);
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  }, []);

  /**
   * Process multiple images in parallel
   */
  const processImages = useCallback(async (items: ProcessImageParams[]): Promise<ProcessImageResult[]> => {
    return Promise.all(items.map(item => processImage(item)));
  }, [processImage]);

  /**
   * Queue image processing after post creation
   * This is called after media is uploaded and post is created
   */
  const queuePostProcessing = useCallback(async (
    postId: string,
    mediaItems: Array<{
      id: string;
      media_type: string;
      media_url: string;
      studio_edits?: StudioEdits;
      filter_id?: string | null;
      width?: number;
      height?: number;
    }>
  ): Promise<void> => {
    // Only process images, not videos (Phase 1)
    const imagesToProcess = mediaItems.filter(m => m.media_type === 'image');
    
    if (imagesToProcess.length === 0) {
      console.log('📷 No images to process for post:', postId);
      return;
    }

    console.log(`🎨 Queuing ${imagesToProcess.length} images for processing`);

    // Process in background - don't await
    Promise.all(
      imagesToProcess.map(media =>
        processImage({
          mediaId: media.id,
          originalUrl: media.media_url,
          studioEdits: media.studio_edits || {},
          filterId: media.filter_id,
          width: media.width,
          height: media.height,
        })
      )
    ).then(results => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      console.log(`✅ Image processing complete: ${successful} successful, ${failed} failed`);
    }).catch(err => {
      console.error('❌ Background image processing error:', err);
    });
  }, [processImage]);

  return {
    processImage,
    processImages,
    queuePostProcessing,
  };
}

export default useImageProcessing;
