/**
 * Resilient upload hook with IndexedDB persistence, retry logic, and connection handling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { 
  saveUploadJob, 
  getUploadJob, 
  deleteUploadJob,
  updateMediaItemStatus,
  generateThumbnailDataUrl,
  PersistedUploadJob,
  PersistedMediaItem,
  PersistedPostData
} from '@/lib/uploadDatabase';
import { useCloudflareStream } from './useCloudflareStream';
import { useCloudflareR2 } from './useCloudflareR2';

interface StudioEditsPayload {
  filter?: string;
  crop?: { ratio: string };
  rotate?: number;
  contrast?: number;
  brightness?: number;
  textOverlays?: any[];
  music?: any;
  audioMode?: string;
}

interface ResilientUploadParams {
  postId: string;
  mediaFiles: File[];
  userId: string;
  postData: PersistedPostData;
  studioEditsByIndex?: (StudioEditsPayload | null)[];
  onProgress?: (progress: UploadJobProgress) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export interface UploadJobProgress {
  jobId: string;
  postId: string;
  totalFiles: number;
  completedFiles: number;
  currentFileIndex: number;
  currentFileName: string;
  totalBytes: number;
  uploadedBytes: number;
  percentage: number;
  status: 'uploading' | 'paused' | 'failed' | 'complete' | 'waiting_connection';
  estimatedTimeRemaining?: number;
  failedFiles: string[];
}

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000; // 1 second

export function useResilientUpload() {
  const { isOnline, wasOffline } = useConnectionStatus();
  const cloudflareStream = useCloudflareStream();
  const { uploadToR2 } = useCloudflareR2();
  
  const [activeJobs, setActiveJobs] = useState<Map<string, UploadJobProgress>>(new Map());
  const uploadStartTimesRef = useRef<Map<string, number>>(new Map());
  const pausedJobsRef = useRef<Set<string>>(new Set());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Auto-resume paused jobs when connection is restored
  useEffect(() => {
    if (wasOffline && isOnline) {
      console.log('[ResilientUpload] Connection restored, resuming paused jobs');
      pausedJobsRef.current.forEach(jobId => {
        resumeUpload(jobId);
      });
      pausedJobsRef.current.clear();
    }
  }, [isOnline, wasOffline]);

  const calculateProgress = useCallback((job: PersistedUploadJob): UploadJobProgress => {
    const completedFiles = job.mediaItems.filter(m => m.status === 'complete').length;
    const failedFiles = job.mediaItems.filter(m => m.status === 'failed').map(m => m.fileName);
    const currentItem = job.mediaItems.find(m => m.status === 'uploading' || m.status === 'pending');
    
    const percentage = job.totalBytes > 0 
      ? Math.round((job.uploadedBytes / job.totalBytes) * 100) 
      : 0;

    // Calculate estimated time remaining
    let estimatedTimeRemaining: number | undefined;
    const startTime = uploadStartTimesRef.current.get(job.id);
    if (startTime && job.uploadedBytes > 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const bytesPerSecond = job.uploadedBytes / elapsed;
      const remainingBytes = job.totalBytes - job.uploadedBytes;
      estimatedTimeRemaining = Math.ceil(remainingBytes / bytesPerSecond);
    }

    return {
      jobId: job.id,
      postId: job.postId,
      totalFiles: job.mediaItems.length,
      completedFiles,
      currentFileIndex: job.mediaItems.findIndex(m => m.status === 'uploading' || m.status === 'pending'),
      currentFileName: currentItem?.fileName || '',
      totalBytes: job.totalBytes,
      uploadedBytes: job.uploadedBytes,
      percentage,
      status: job.overallStatus === 'paused' ? 'paused' 
        : job.overallStatus === 'failed' ? 'failed'
        : job.overallStatus === 'complete' ? 'complete'
        : !isOnline ? 'waiting_connection'
        : 'uploading',
      estimatedTimeRemaining,
      failedFiles
    };
  }, [isOnline]);

  const updateJobProgress = useCallback((job: PersistedUploadJob, onProgress?: (progress: UploadJobProgress) => void) => {
    const progress = calculateProgress(job);
    setActiveJobs(prev => new Map(prev.set(job.id, progress)));
    onProgress?.(progress);
  }, [calculateProgress]);

  const uploadSingleFile = async (
    file: File,
    mediaItem: PersistedMediaItem,
    job: PersistedUploadJob,
    index: number,
    studioEdits: StudioEditsPayload | null,
    onProgress?: (progress: UploadJobProgress) => void
  ): Promise<{ success: boolean; mediaUrl?: string; error?: string }> => {
    // Update status to uploading
    await updateMediaItemStatus(job.id, mediaItem.id, { status: 'uploading' });
    
    const updatedJob = await getUploadJob(job.id);
    if (updatedJob) {
      updateJobProgress(updatedJob, onProgress);
    }

    const fileName = `${Date.now()}-${index}-${nanoid(10)}`;
    const fileExtension = file.name.split('.').pop() || 'unknown';
    const fullFileName = `${fileName}.${fileExtension}`;

    let retryCount = mediaItem.retryCount || 0;

    while (retryCount < MAX_RETRIES) {
      // Check if we should pause (offline or explicitly paused)
      if (!navigator.onLine) {
        await updateMediaItemStatus(job.id, mediaItem.id, { 
          status: 'pending',
          retryCount 
        });
        pausedJobsRef.current.add(job.id);
        
        // Update job status to paused
        const pausedJob = await getUploadJob(job.id);
        if (pausedJob) {
          pausedJob.overallStatus = 'paused';
          await saveUploadJob(pausedJob);
          updateJobProgress(pausedJob, onProgress);
        }
        
        return { success: false, error: 'Connection lost - upload paused' };
      }

      try {
        let publicUrl = '';
        
        if (file.type.startsWith('video/')) {
          console.log(`[ResilientUpload] Uploading video to Cloudflare Stream: ${file.name}`);
          const streamResult = await cloudflareStream.uploadVideo(file);
          
          if (streamResult.success && streamResult.videoUrl) {
            publicUrl = streamResult.videoUrl;
          } else {
            throw new Error(streamResult.error || 'Cloudflare Stream upload failed');
          }
        } else {
          console.log(`[ResilientUpload] Uploading image to Cloudflare R2: ${file.name}`);
          const r2Result = await uploadToR2(file, `post-media/${fullFileName}`);
          
          if (r2Result.success && r2Result.url) {
            publicUrl = r2Result.url;
          } else {
            throw new Error(r2Result.error || 'R2 upload failed');
          }
        }

        // Update IndexedDB with success
        await updateMediaItemStatus(job.id, mediaItem.id, {
          status: 'complete',
          mediaUrl: publicUrl,
          bytesUploaded: file.size
        });

        // Create post_media record
        const { error: mediaError } = await supabase
          .from('post_media')
          .insert([{
            post_id: job.postId,
            media_type: file.type.startsWith('image/') ? 'image' : 'video',
            media_url: publicUrl,
            display_order: index,
            studio_edits: studioEdits as any,
            filter_id: studioEdits?.filter ?? null
          }]);

        if (mediaError) {
          console.error(`[ResilientUpload] Failed to create media record:`, mediaError);
          // Don't fail the upload, just log
        }

        const successJob = await getUploadJob(job.id);
        if (successJob) {
          updateJobProgress(successJob, onProgress);
        }

        return { success: true, mediaUrl: publicUrl };

      } catch (error) {
        retryCount++;
        console.error(`[ResilientUpload] Upload attempt ${retryCount} failed for ${file.name}:`, error);
        
        await updateMediaItemStatus(job.id, mediaItem.id, { retryCount });

        if (retryCount < MAX_RETRIES) {
          // Exponential backoff
          const delay = RETRY_BASE_DELAY * Math.pow(2, retryCount - 1);
          console.log(`[ResilientUpload] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Max retries reached
          await updateMediaItemStatus(job.id, mediaItem.id, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Upload failed'
          });
          
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Upload failed after max retries' 
          };
        }
      }
    }

    return { success: false, error: 'Upload failed after max retries' };
  };

  const startUpload = useCallback(async ({
    postId,
    mediaFiles,
    userId,
    postData,
    studioEditsByIndex,
    onProgress,
    onComplete,
    onError
  }: ResilientUploadParams): Promise<string> => {
    const jobId = nanoid();
    
    console.log(`[ResilientUpload] Starting upload job ${jobId} for post ${postId}`);

    // Generate thumbnails for recovery preview
    const thumbnails = await Promise.all(
      mediaFiles.map(file => generateThumbnailDataUrl(file))
    );

    // Create media items
    const mediaItems: PersistedMediaItem[] = mediaFiles.map((file, index) => ({
      id: nanoid(),
      fileName: file.name,
      fileSize: file.size,
      mediaType: file.type.startsWith('image/') ? 'image' : 'video',
      bytesUploaded: 0,
      totalBytes: file.size,
      status: 'pending',
      thumbnailDataUrl: thumbnails[index],
      retryCount: 0
    }));

    const totalBytes = mediaFiles.reduce((sum, f) => sum + f.size, 0);

    // Create and persist the job
    const job: PersistedUploadJob = {
      id: jobId,
      postId,
      userId,
      mediaItems,
      postData,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
      overallStatus: 'uploading',
      totalBytes,
      uploadedBytes: 0
    };

    await saveUploadJob(job);
    uploadStartTimesRef.current.set(jobId, Date.now());
    updateJobProgress(job, onProgress);

    // Process uploads sequentially
    let hasFailures = false;
    
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      const mediaItem = mediaItems[i];
      const studioEdits = studioEditsByIndex?.[i] ?? null;

      const result = await uploadSingleFile(file, mediaItem, job, i, studioEdits, onProgress);
      
      if (!result.success) {
        hasFailures = true;
        
        // If connection lost (paused), break the loop
        if (result.error?.includes('Connection lost')) {
          break;
        }
      }
    }

    // Final status check
    const finalJob = await getUploadJob(jobId);
    if (finalJob) {
      if (finalJob.overallStatus === 'paused') {
        toast("Upload paused", {
          description: "Waiting for internet connection...",
          duration: 5000
        });
      } else if (hasFailures) {
        finalJob.overallStatus = 'failed';
        await saveUploadJob(finalJob);
        updateJobProgress(finalJob, onProgress);
        
        const failedCount = finalJob.mediaItems.filter(m => m.status === 'failed').length;
        toast.error("Some uploads failed", {
          description: `${failedCount} file(s) couldn't be uploaded. Tap to retry.`,
          duration: 5000
        });
        
        onError?.(`${failedCount} file(s) failed to upload`);
      } else {
        finalJob.overallStatus = 'complete';
        await saveUploadJob(finalJob);
        updateJobProgress(finalJob, onProgress);
        
        // Clean up after successful completion
        setTimeout(async () => {
          await deleteUploadJob(jobId);
          setActiveJobs(prev => {
            const next = new Map(prev);
            next.delete(jobId);
            return next;
          });
        }, 5000);
        
        onComplete?.();
      }
    }

    return jobId;
  }, [cloudflareStream, uploadToR2, updateJobProgress]);

  const resumeUpload = useCallback(async (
    jobId: string,
    mediaFiles?: File[],
    onProgress?: (progress: UploadJobProgress) => void,
    onComplete?: () => void,
    onError?: (error: string) => void
  ) => {
    const job = await getUploadJob(jobId);
    if (!job) {
      console.error('[ResilientUpload] Job not found:', jobId);
      return;
    }

    console.log(`[ResilientUpload] Resuming job ${jobId}`);
    
    job.overallStatus = 'uploading';
    await saveUploadJob(job);
    uploadStartTimesRef.current.set(jobId, Date.now());
    updateJobProgress(job, onProgress);

    // Find items that need to be uploaded
    const pendingItems = job.mediaItems.filter(m => 
      m.status === 'pending' || m.status === 'failed' || m.status === 'uploading'
    );

    if (pendingItems.length === 0) {
      job.overallStatus = 'complete';
      await saveUploadJob(job);
      updateJobProgress(job, onProgress);
      onComplete?.();
      return;
    }

    // Note: For true resume, we'd need to store file references or use TUS
    // For now, if mediaFiles aren't provided, we can only retry failed items that have uploadUrl
    if (!mediaFiles) {
      console.warn('[ResilientUpload] No files provided for resume - cannot continue without original files');
      toast.error("Cannot resume", {
        description: "Original files are no longer available. Please re-select your media.",
      });
      onError?.('Original files not available');
      return;
    }

    let hasFailures = false;
    
    for (let i = 0; i < job.mediaItems.length; i++) {
      const mediaItem = job.mediaItems[i];
      
      if (mediaItem.status === 'complete') continue;
      
      const file = mediaFiles.find(f => f.name === mediaItem.fileName);
      if (!file) {
        console.warn(`[ResilientUpload] File not found for resume: ${mediaItem.fileName}`);
        continue;
      }

      const studioEdits = job.postData.studioEditsByIndex?.[i] ?? null;
      const result = await uploadSingleFile(file, mediaItem, job, i, studioEdits, onProgress);
      
      if (!result.success) {
        hasFailures = true;
        if (result.error?.includes('Connection lost')) break;
      }
    }

    const finalJob = await getUploadJob(jobId);
    if (finalJob) {
      if (hasFailures && finalJob.overallStatus !== 'paused') {
        finalJob.overallStatus = 'failed';
        await saveUploadJob(finalJob);
        onError?.('Some files failed to upload');
      } else if (!hasFailures) {
        finalJob.overallStatus = 'complete';
        await saveUploadJob(finalJob);
        await deleteUploadJob(jobId);
        onComplete?.();
      }
      updateJobProgress(finalJob, onProgress);
    }
  }, [updateJobProgress]);

  const pauseUpload = useCallback(async (jobId: string) => {
    const job = await getUploadJob(jobId);
    if (job) {
      job.overallStatus = 'paused';
      await saveUploadJob(job);
      pausedJobsRef.current.add(jobId);
      
      // Abort any active upload
      const controller = abortControllersRef.current.get(jobId);
      controller?.abort();
      
      setActiveJobs(prev => {
        const current = prev.get(jobId);
        if (current) {
          return new Map(prev.set(jobId, { ...current, status: 'paused' }));
        }
        return prev;
      });
    }
  }, []);

  const cancelUpload = useCallback(async (jobId: string) => {
    await deleteUploadJob(jobId);
    pausedJobsRef.current.delete(jobId);
    
    const controller = abortControllersRef.current.get(jobId);
    controller?.abort();
    abortControllersRef.current.delete(jobId);
    
    setActiveJobs(prev => {
      const next = new Map(prev);
      next.delete(jobId);
      return next;
    });
  }, []);

  const retryFailedFiles = useCallback(async (
    jobId: string,
    mediaFiles: File[],
    onProgress?: (progress: UploadJobProgress) => void,
    onComplete?: () => void,
    onError?: (error: string) => void
  ) => {
    const job = await getUploadJob(jobId);
    if (!job) return;

    // Reset failed items to pending
    for (const item of job.mediaItems) {
      if (item.status === 'failed') {
        await updateMediaItemStatus(jobId, item.id, {
          status: 'pending',
          retryCount: 0,
          errorMessage: undefined
        });
      }
    }

    await resumeUpload(jobId, mediaFiles, onProgress, onComplete, onError);
  }, [resumeUpload]);

  return {
    startUpload,
    resumeUpload,
    pauseUpload,
    cancelUpload,
    retryFailedFiles,
    activeJobs: Array.from(activeJobs.values()),
    isOnline
  };
}
