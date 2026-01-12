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
  
  // Generate thumbnails for each file
  const thumbnails = await Promise.all(
    params.files.map(file => generateThumbnailDataUrl(file))
  );

  // Create media items for persistence
  const mediaItems: PersistedMediaItem[] = params.files.map((file, index) => ({
    id: params.mediaItems[index]?.id || nanoid(),
    fileName: file.name,
    fileSize: file.size,
    mediaType: file.type.startsWith('image/') ? 'image' : 'video',
    bytesUploaded: 0,
    totalBytes: file.size,
    status: 'pending',
    thumbnailDataUrl: thumbnails[index],
    retryCount: 0
  }));

  const totalBytes = params.files.reduce((sum, f) => sum + f.size, 0);

  // Create the persisted job
  const job: PersistedUploadJob = {
    id: jobId,
    postId: '', // Will be set when post is created
    userId: params.userId,
    mediaItems,
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
  
  console.log(`[usePostUploadResilience] Persisted upload job ${jobId} to IndexedDB`);
  
  return jobId;
}

/**
 * Enhanced post upload with IndexedDB persistence
 * Falls back to standard enqueuePostUpload if persistence fails
 */
export async function enqueuePostUploadWithResilience(params: UseResilienceParams): Promise<string> {
  try {
    // Persist to IndexedDB first
    const jobId = await persistUploadJobBeforeStart(params);
    
    // Then enqueue the actual upload (which will track its own progress)
    const pipelineJobId = enqueuePostUpload({
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
    
    console.log(`[usePostUploadResilience] Upload enqueued - IndexedDB job: ${jobId}, Pipeline job: ${pipelineJobId}`);
    
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
