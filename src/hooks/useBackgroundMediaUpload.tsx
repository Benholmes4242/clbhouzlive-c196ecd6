import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCloudflareStream } from './useCloudflareStream';
import { useR2Upload } from './useR2Upload';
import type { BackgroundUploadJob, StagedMediaItem } from '@/types/mediaManager';

export const useBackgroundMediaUpload = () => {
  const [uploadQueue, setUploadQueue] = useState<BackgroundUploadJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { uploadVideo } = useCloudflareStream();
  const { uploadImage } = useR2Upload();
  const processingRef = useRef(false);

  const queueUpload = useCallback((job: BackgroundUploadJob) => {
    setUploadQueue(prev => [...prev, job]);
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current || uploadQueue.length === 0) return;

    processingRef.current = true;
    setIsProcessing(true);

    while (uploadQueue.length > 0) {
      const job = uploadQueue[0];
      setUploadQueue(prev => prev.slice(1));

      try {
        job.onProgress?.(0);

        let result;
        if (job.type === 'video') {
          // Check video duration
          const video = document.createElement('video');
          video.preload = 'metadata';
          
          await new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
              if (video.duration > 20) {
                reject(new Error(`Video is ${Math.round(video.duration)}s long. Maximum 20 seconds allowed.`));
              } else {
                resolve(void 0);
              }
            };
            video.onerror = () => reject(new Error('Invalid video file'));
            video.src = URL.createObjectURL(job.file);
          });

          result = await uploadVideo(job.file);

          if (result.success) {
            job.onComplete?.({
              media_url: result.urls?.hls || result.videoId,
              thumbnail_url: result.thumbnail,
              duration: Math.round(Math.min(video.duration * 1000, 20000)),
              video_method: 'cloudflare_stream'
            });
          } else {
            throw new Error(result.error || 'Video upload failed');
          }
        } else {
          result = await uploadImage(job.file);
          job.onProgress?.(50);

          if (result.success) {
            job.onProgress?.(100);
            job.onComplete?.({
              media_url: result.imageUrl,
              duration: 3000
            });
          } else {
            throw new Error(result.error || 'Image upload failed');
          }
        }
      } catch (error) {
        console.error('Background upload failed:', error);
        job.onError?.(error instanceof Error ? error.message : 'Upload failed');
      }
    }

    processingRef.current = false;
    setIsProcessing(false);
  }, [uploadQueue, uploadVideo, uploadImage]);

  const startProcessing = useCallback(() => {
    if (!processingRef.current) {
      processQueue();
    }
  }, [processQueue]);

  const clearQueue = useCallback(() => {
    setUploadQueue([]);
  }, []);

  return {
    queueUpload,
    startProcessing,
    clearQueue,
    isProcessing,
    queueLength: uploadQueue.length
  };
};