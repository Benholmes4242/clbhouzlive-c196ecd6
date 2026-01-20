/**
 * Hook to use resilient upload from CreateMomentModal
 * Wraps the context with safe fallback if provider not available
 */

import { useContext } from 'react';
import { UploadResilienceProvider, useUploadResilience } from '@/contexts/UploadResilienceContext';
import { enqueuePostUpload } from '@/uploads/uploadPipeline';
import { 
  saveUploadJob, 
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
  selectedTags: any[];
  files: File[];
  mediaItems: any[];
  studioEditsByMediaId: Record<string, any>;
  categories: string[];
  visibility: string;
  badges: string[];
  scheduledAt?: Date;
}

/**
 * Helper to persist upload job to IndexedDB before starting
 * This ensures job can be recovered if page closes during upload
 */
export async function persistUploadJobBeforeStart(params: UseResilienceParams): Promise<string> {
  const jobId = nanoid();
  
  // Separate new files from restored media
  const newFiles = params.files || [];
  const restoredItems = params.mediaItems?.filter(m => m.isRestored && m.restoredMediaUrl) || [];
  
  // Generate thumbnails for new files
  const fileThumbnails = await Promise.all(
    newFiles.map(file => generateThumbnailDataUrl(file))
  );

  // Create media items for persistence - new files
  const newMediaItems: PersistedMediaItem[] = newFiles.map((file, index) => ({
    id: params.mediaItems[index]?.id || nanoid(),
    fileName: file.name,
    fileSize: file.size,
    mediaType: file.type.startsWith('image/') ? 'image' : 'video',
    bytesUploaded: 0,
    totalBytes: file.size,
    status: 'pending',
    thumbnailDataUrl: fileThumbnails[index],
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
    status: 'complete' as const, // Already uploaded
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
    postId: '', // Will be set when post is created
    userId: params.userId,
    mediaItems: allMediaItems,
    postData: {
      content: params.caption,
      actorType: params.actorType,
      actorId: params.actorId,
      visibility: params.visibility,
      categories: params.categories,
      badges: params.badges,
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

  // Save to IndexedDB
  await saveUploadJob(job);
  
  console.log(`[usePostUploadResilience] Persisted upload job ${jobId} to IndexedDB (${newFiles.length} new files, ${restoredItems.length} restored)`);
  
  return jobId;
}

/**
 * Enhanced post upload with IndexedDB persistence
 * Falls back to standard enqueuePostUpload if persistence fails
 */
export async function enqueuePostUploadWithResilience(params: UseResilienceParams): Promise<string> {
  try {
    // Persist to IndexedDB first - this generates the shared job ID
    const jobId = await persistUploadJobBeforeStart(params);
    
    // Then enqueue the actual upload with THE SAME job ID
    // This ensures progress events use the same ID that the UI is tracking
    enqueuePostUpload({
      jobId, // Pass the same job ID to the pipeline
      userId: params.userId,
      actorType: params.actorType as 'personal' | 'business',
      actorId: params.actorId,
      caption: params.caption,
      courseInfo: params.courseInfo,
      selectedTags: params.selectedTags,
      files: params.files,
      mediaItems: params.mediaItems,
      studioEditsByMediaId: params.studioEditsByMediaId,
      categories: params.categories,
      visibility: params.visibility as 'anyone' | 'followers' | 'private',
      badges: params.badges,
      scheduledAt: params.scheduledAt,
    });
    
    console.log(`[usePostUploadResilience] Upload enqueued with shared job ID: ${jobId}`);
    
    return jobId;
  } catch (error) {
    console.error('[usePostUploadResilience] Failed to persist, falling back to standard upload:', error);
    
    // Fallback to standard upload
    return enqueuePostUpload({
      userId: params.userId,
      actorType: params.actorType as 'personal' | 'business',
      actorId: params.actorId,
      caption: params.caption,
      courseInfo: params.courseInfo,
      selectedTags: params.selectedTags,
      files: params.files,
      mediaItems: params.mediaItems,
      studioEditsByMediaId: params.studioEditsByMediaId,
      categories: params.categories,
      visibility: params.visibility as 'anyone' | 'followers' | 'private',
      badges: params.badges,
      scheduledAt: params.scheduledAt,
    });
  }
}
