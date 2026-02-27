/**
 * Hook to use resilient upload from CreateMomentModal
 * Wraps the context with safe fallback if provider not available
 * 
 * CRITICAL FIX: Thumbnail generation is now non-blocking to ensure
 * immediate success screen on mobile. Thumbnails are generated in
 * background and updated via IndexedDB.
 */

import { useContext } from 'react';
import { UploadResilienceProvider, useUploadResilience } from '@/contexts/UploadResilienceContext';
import { enqueuePostUpload } from '@/uploads/uploadPipeline';
import { 
  saveUploadJob,
  getUploadJob,
  generateThumbnailDataUrl,
  PersistedUploadJob,
  PersistedMediaItem 
} from '@/lib/uploadDatabase';
import { nanoid } from 'nanoid';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';

interface UseResilienceParams {
  userId: string;
  actorType: string;
  actorId: string;
  caption: string;
  courseInfo?: { id: string; name: string; country: string };
  courseIds?: string[]; // Multi-course support for junction table
  selectedTags: any[];
  files: File[];
  mediaItems: any[];
  studioEditsByMediaId: Record<string, any>;
  visibility: string;
  scheduledAt?: Date;
}

/**
 * Helper to persist upload job to IndexedDB before starting
 * This ensures job can be recovered if page closes during upload
 * 
 * CRITICAL: This function must return IMMEDIATELY to not block the UI.
 * Thumbnail generation happens in background after job is persisted.
 */
export async function persistUploadJobBeforeStart(params: UseResilienceParams): Promise<string> {
  const jobId = nanoid();
  
  // Separate new files from restored media
  const newFiles = params.files || [];
  const restoredItems = params.mediaItems?.filter(m => m.isRestored && m.restoredMediaUrl) || [];
  
  // Create media items for persistence - new files (without thumbnails initially)
  const newMediaItems: PersistedMediaItem[] = newFiles.map((file, index) => ({
    id: params.mediaItems[index]?.id || nanoid(),
    fileName: file.name,
    fileSize: file.size,
    mediaType: file.type.startsWith('image/') ? 'image' : 'video',
    bytesUploaded: 0,
    totalBytes: file.size,
    status: 'pending',
    thumbnailDataUrl: undefined,
    retryCount: 0
  }));
  
  // Create media items for restored media (already uploaded)
  const restoredMediaItems: PersistedMediaItem[] = restoredItems.map(item => ({
    id: item.id || nanoid(),
    fileName: 'restored',
    fileSize: 0,
    mediaType: item.type || (item.restoredStreamId ? 'video' : 'image'),
    bytesUploaded: 0,
    totalBytes: 0,
    status: 'complete' as const,
    thumbnailDataUrl: item.restoredStreamId 
      ? generateStreamThumbnailUrl(item.restoredStreamId, { width: 320, height: 180, time: 1 })
      : item.restoredMediaUrl,
    retryCount: 0
  }));

  const allMediaItems = [...newMediaItems, ...restoredMediaItems];
  const totalBytes = newFiles.reduce((sum, f) => sum + f.size, 0);

  // Create the persisted job
  const job: PersistedUploadJob = {
    id: jobId,
    postId: '',
    userId: params.userId,
    mediaItems: allMediaItems,
    postData: {
      content: params.caption,
      actorType: params.actorType,
      actorId: params.actorId,
      visibility: params.visibility,
      categories: [],
      badges: [],
      courseId: params.courseInfo?.id,
      courseName: params.courseInfo?.name,
      scheduledAt: params.scheduledAt?.toISOString(),
      studioEditsByIndex: Object.values(params.studioEditsByMediaId)
    },
    createdAt: Date.now(),
    lastUpdatedAt: Date.now(),
    overallStatus: 'uploading',
    totalBytes,
    uploadedBytes: 0
  };

  // Save to IndexedDB immediately (fast operation)
  await saveUploadJob(job);
  
  console.log(`[usePostUploadResilience] Persisted upload job ${jobId} to IndexedDB (${newFiles.length} new files, ${restoredItems.length} restored)`);
  
  // Generate thumbnails in BACKGROUND (non-blocking)
  if (newFiles.length > 0) {
    generateThumbnailsInBackground(jobId, newFiles, newMediaItems.map(m => m.id));
  }
  
  return jobId;
}

/**
 * Generate thumbnails in background and update IndexedDB
 * This is non-blocking and runs after the job is already persisted
 */
async function generateThumbnailsInBackground(
  jobId: string, 
  files: File[], 
  mediaItemIds: string[]
): Promise<void> {
  try {
    const scheduleWork = typeof requestIdleCallback !== 'undefined' 
      ? requestIdleCallback 
      : (fn: () => void) => setTimeout(fn, 0);
    
    scheduleWork(async () => {
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const mediaItemId = mediaItemIds[i];
          
          try {
            const thumbnail = await generateThumbnailDataUrl(file);
            
            if (thumbnail) {
              const job = await getUploadJob(jobId);
              
              if (job) {
                const mediaIndex = job.mediaItems.findIndex(m => m.id === mediaItemId);
                if (mediaIndex !== -1) {
                  job.mediaItems[mediaIndex].thumbnailDataUrl = thumbnail;
                  await saveUploadJob(job);
                }
              }
            }
          } catch (err) {
            console.warn(`[usePostUploadResilience] Failed to generate thumbnail for file ${i}:`, err);
          }
        }
        
        console.log(`[usePostUploadResilience] Background thumbnail generation complete for job ${jobId}`);
      } catch (err) {
        console.warn('[usePostUploadResilience] Background thumbnail generation failed:', err);
      }
    });
  } catch (err) {
    console.warn('[usePostUploadResilience] Failed to schedule thumbnail generation:', err);
  }
}

/**
 * Enhanced post upload with IndexedDB persistence
 * Falls back to standard enqueuePostUpload if persistence fails
 */
export async function enqueuePostUploadWithResilience(params: UseResilienceParams): Promise<string> {
  try {
    const jobId = await persistUploadJobBeforeStart(params);
    
    enqueuePostUpload({
      jobId,
      userId: params.userId,
      actorType: params.actorType as 'personal' | 'business',
      actorId: params.actorId,
      caption: params.caption,
      courseInfo: params.courseInfo,
      courseIds: params.courseIds,
      selectedTags: params.selectedTags,
      files: params.files,
      mediaItems: params.mediaItems,
      studioEditsByMediaId: params.studioEditsByMediaId,
      visibility: params.visibility as 'anyone' | 'followers' | 'private',
      scheduledAt: params.scheduledAt,
    });
    
    console.log(`[usePostUploadResilience] Upload enqueued with shared job ID: ${jobId}`);
    
    return jobId;
  } catch (error) {
    console.error('[usePostUploadResilience] Failed to persist, falling back to standard upload:', error);
    
    return enqueuePostUpload({
      userId: params.userId,
      actorType: params.actorType as 'personal' | 'business',
      actorId: params.actorId,
      caption: params.caption,
      courseInfo: params.courseInfo,
      courseIds: params.courseIds,
      selectedTags: params.selectedTags,
      files: params.files,
      mediaItems: params.mediaItems,
      studioEditsByMediaId: params.studioEditsByMediaId,
      visibility: params.visibility as 'anyone' | 'followers' | 'private',
      scheduledAt: params.scheduledAt,
    });
  }
}
