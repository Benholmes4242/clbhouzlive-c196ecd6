import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CompressionProgress {
  status: 'pending' | 'compressing' | 'complete' | 'error';
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
  error?: string;
}

const COMPRESSION_THRESHOLD = 40 * 1024 * 1024; // 40MB

export const useVideoCompression = () => {
  const [compressionStatus, setCompressionStatus] = useState<Record<string, CompressionProgress>>({});

  const shouldCompress = useCallback((file: File): boolean => {
    return file.type.startsWith('video/') && file.size > COMPRESSION_THRESHOLD;
  }, []);

  const triggerCompression = useCallback(async (
    originalPath: string,
    postId: string,
    mediaId: string,
    originalSize: number
  ) => {
    console.log(`Triggering compression for ${originalPath} (${originalSize} bytes)`);
    
    setCompressionStatus(prev => ({
      ...prev,
      [mediaId]: {
        status: 'compressing',
        originalSize
      }
    }));

    try {
      // Trigger compression in background (don't await)
      supabase.functions.invoke('video-compression', {
        body: {
          originalPath,
          postId,
          mediaId,
          targetSizeMB: 30
        }
      }).then(({ data, error }) => {
        if (error || !data?.success) {
          console.error('Video compression failed:', error || data?.error);
          setCompressionStatus(prev => ({
            ...prev,
            [mediaId]: {
              status: 'error',
              originalSize,
              error: error?.message || data?.error || 'Compression failed'
            }
          }));
        } else {
          console.log('Video compression completed:', data);
          setCompressionStatus(prev => ({
            ...prev,
            [mediaId]: {
              status: 'complete',
              originalSize: data.originalSize,
              compressedSize: data.compressedSize,
              compressionRatio: data.compressionRatio
            }
          }));
        }
      }).catch(error => {
        console.error('Video compression error:', error);
        setCompressionStatus(prev => ({
          ...prev,
          [mediaId]: {
            status: 'error',
            originalSize,
            error: error.message || 'Compression failed'
          }
        }));
      });

      // Return immediately - compression happens in background
      return {
        success: true,
        compressionTriggered: true
      };

    } catch (error) {
      console.error('Failed to trigger compression:', error);
      setCompressionStatus(prev => ({
        ...prev,
        [mediaId]: {
          status: 'error',
          originalSize,
          error: error instanceof Error ? error.message : 'Failed to trigger compression'
        }
      }));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger compression'
      };
    }
  }, []);

  const getCompressionStatus = useCallback((mediaId: string): CompressionProgress | null => {
    return compressionStatus[mediaId] || null;
  }, [compressionStatus]);

  const clearCompressionStatus = useCallback((mediaId: string) => {
    setCompressionStatus(prev => {
      const { [mediaId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    shouldCompress,
    triggerCompression,
    getCompressionStatus,
    clearCompressionStatus,
    compressionStatus
  };
};