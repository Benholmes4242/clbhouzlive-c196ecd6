import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VideoOptimizationResult {
  success: boolean;
  originalUrl: string;
  optimizedUrl?: string;
  thumbnailUrl?: string;
  compressionRatio?: number;
  error?: string;
}

interface UseVideoOptimizationOptions {
  bucketName?: string;
  generateThumbnail?: boolean;
}

export const useVideoOptimization = (options: UseVideoOptimizationOptions = {}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);

  const optimizeVideo = useCallback(async (
    videoUrl: string,
    customOptions?: Partial<UseVideoOptimizationOptions>
  ): Promise<VideoOptimizationResult> => {
    setIsOptimizing(true);
    setOptimizationProgress(0);

    try {
      const finalOptions = { ...options, ...customOptions };
      
      // Call the video optimizer edge function
      const { data, error } = await supabase.functions.invoke('video-optimizer', {
        body: {
          videoUrl,
          bucketName: finalOptions.bucketName || 'post-media',
          generateThumbnail: finalOptions.generateThumbnail ?? true,
        },
      });

      if (error) {
        throw new Error(error.message || 'Video optimization failed');
      }

      setOptimizationProgress(100);
      
      return {
        success: true,
        originalUrl: videoUrl,
        optimizedUrl: data.optimizedUrl,
        thumbnailUrl: data.thumbnailUrl,
        compressionRatio: data.compressionRatio,
      };

    } catch (error) {
      console.error('Video optimization error:', error);
      return {
        success: false,
        originalUrl: videoUrl,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      setIsOptimizing(false);
      setOptimizationProgress(0);
    }
  }, [options]);

  // Batch optimize multiple videos
  const optimizeMultipleVideos = useCallback(async (
    videoUrls: string[],
    customOptions?: Partial<UseVideoOptimizationOptions>
  ): Promise<VideoOptimizationResult[]> => {
    setIsOptimizing(true);
    const results: VideoOptimizationResult[] = [];
    
    for (let i = 0; i < videoUrls.length; i++) {
      setOptimizationProgress((i / videoUrls.length) * 100);
      const result = await optimizeVideo(videoUrls[i], customOptions);
      results.push(result);
      
      // Small delay to prevent overwhelming the server
      if (i < videoUrls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setIsOptimizing(false);
    setOptimizationProgress(100);
    
    return results;
  }, [optimizeVideo]);

  return {
    optimizeVideo,
    optimizeMultipleVideos,
    isOptimizing,
    optimizationProgress,
  };
};