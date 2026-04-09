// Upload pipeline - processes jobs asynchronously
// Includes stream asset tracking for orphan cleanup
// Includes video metadata polling for dimension/duration population
// Includes image dimension extraction before upload
// Includes image processing for baking filters/text overlays
// Includes per-file upload events for progress UI
// Includes TUS resumable video uploads
// Includes client-side image compression
// Includes network awareness for offline handling

import { supabase } from '@/integrations/supabase/client';
import { uploadManager } from './UploadManager';
import { uploadEventBus } from './uploadEventBus';
import { createPost } from '@/services/posts/createPost';
import { handlePostTags } from '@/hooks/usePostSubmission/uploadUtils';
import { pollStreamMetadata, updatePostMediaMetadata } from '@/utils/pollStreamMetadata';
import { queueImageProcessing } from '@/services/imageProcessing';
import { toast } from 'sonner';
import { generateStreamThumbnailUrl, generateStreamHlsUrl } from '@/config/cloudflareStream';
import type { UploadJobInput } from './types';
import { POST_LIMITS } from '@/constants/postLimits';

// Static imports - avoids dynamic/static import conflicts that cause memory issues during build
import { uploadToCloudflareR2 } from '@/utils/cloudflareUpload';
import { uploadVideoWithTus } from './tusVideoUpload';
import { compressImage, isCompressibleImage } from './imageCompression';
import { UploadSpeedTracker } from './uploadSpeedTracker';
import { waitForOnline } from './networkStatus';
import { uploadWakeLock } from './uploadWakeLock';
import { uploadVisibilityMonitor } from './uploadVisibilityMonitor';
import { getBackgroundUploadWarning } from './medianBridge';

/**
 * Extract image dimensions from a File object
 * Returns null if extraction fails (non-blocking)
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number; aspectRatio: number; orientation: 'portrait' | 'landscape' | 'square' } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const aspectRatio = parseFloat((width / height).toFixed(4));
      const orientation = width === height ? 'square' : width > height ? 'landscape' : 'portrait';
      URL.revokeObjectURL(url);
      resolve({ width, height, aspectRatio, orientation });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Enqueue and immediately start processing a post upload.
 * Returns the jobId synchronously - processing happens in background.
 * 
 * @throws Error if no files are provided (posts require at least one media file)
 */
export function enqueuePostUpload(input: UploadJobInput): string {
  // Safety net: cap media at limit
  if (input.files && input.files.length > POST_LIMITS.MAX_MEDIA_COUNT) {
    console.warn(`[uploadPipeline] Post exceeded media limit: ${input.files.length} items, truncating to ${POST_LIMITS.MAX_MEDIA_COUNT}`);
    input.files = input.files.slice(0, POST_LIMITS.MAX_MEDIA_COUNT);
  }

  // Check for restored media (already uploaded, no File objects)
  const hasRestoredMedia = input.mediaItems?.some(m => m.isRestored && m.restoredMediaUrl);
  const hasNewFiles = input.files && input.files.length > 0;
  const hasCompiledVideo = input.mediaItems?.some(m => m.compiledVideo);
  
  // Validate: posts MUST have at least one media source (files, restored, or compiled)
  if (!hasNewFiles && !hasRestoredMedia && !hasCompiledVideo) {
    console.error('[uploadPipeline] enqueuePostUpload called with no media - rejecting');
    throw new Error('At least one media file is required to create a post');
  }

  // Calculate total file count for progress tracking
  const fileCount = (input.files?.length || 0) + 
    (input.mediaItems?.filter(m => m.isRestored).length || 0) +
    (hasCompiledVideo ? 1 : 0);

  console.log('[uploadPipeline] Enqueueing job:', {
    newFiles: input.files?.length || 0,
    restoredMedia: input.mediaItems?.filter(m => m.isRestored).length || 0,
    hasCompiledVideo,
    totalFileCount: fileCount,
  });

  const jobId = uploadManager.enqueue(input);
  
  // Emit enqueued event for the progress banner
  uploadEventBus.emit('upload:enqueued', {
    type: 'upload:enqueued',
    jobId,
    actorType: input.actorType,
    actorId: input.actorId,
    fileCount,
  });
  
  // Start processing in background (don't await)
  processJob(jobId).catch(err => {
    console.error(`[uploadPipeline] processJob error for ${jobId}:`, err);
  });

  return jobId;
}

/**
 * Enqueue and immediately start processing a review upload.
 * Returns the jobId synchronously - processing happens in background.
 * 
 * Reviews can have no media (unlike posts which require media).
 */
export function enqueueReviewUpload(input: UploadJobInput): string {
  // Validate review-specific requirements
  if (!input.reviewData) {
    throw new Error('reviewData is required for review uploads');
  }
  
  if (!input.reviewData.courseId) {
    throw new Error('courseId is required for review uploads');
  }
  
  // Calculate total file count for progress tracking
  const fileCount = input.files?.length || 0;

  console.log('[uploadPipeline] Enqueueing review job:', {
    courseId: input.reviewData.courseId,
    courseName: input.reviewData.courseName,
    newFiles: fileCount,
  });

  // Ensure type is set to 'review'
  const reviewInput: UploadJobInput = {
    ...input,
    type: 'review',
  };

  const jobId = uploadManager.enqueue(reviewInput);
  
  // Emit enqueued event for the progress banner
  uploadEventBus.emit('upload:enqueued', {
    type: 'upload:enqueued',
    jobId,
    uploadType: 'review',
    actorType: input.actorType,
    actorId: input.actorId,
    fileCount,
    metadata: {
      courseName: input.reviewData.courseName,
    },
  });
  
  // Start processing in background (don't await)
  processJob(jobId).catch(err => {
    console.error(`[uploadPipeline] processJob error for review ${jobId}:`, err);
  });

  return jobId;
}

/**
 * Clean up orphaned Cloudflare Stream assets
 */
async function cleanupStreamAssets(streamUids: string[]): Promise<void> {
  for (const uid of streamUids) {
    try {
      console.log(`[uploadPipeline] Cleaning up orphaned stream asset: ${uid}`);
      const { error } = await supabase.functions.invoke('cloudflare-stream-delete', {
        body: { uid },
      });
      if (error) {
        console.warn(`[uploadPipeline] Failed to cleanup stream asset ${uid}:`, error);
      } else {
        console.log(`[uploadPipeline] Cleaned up stream asset: ${uid}`);
      }
    } catch (err) {
      console.warn(`[uploadPipeline] Error cleaning up stream asset ${uid}:`, err);
    }
  }
}

/**
 * Poll for video metadata and update post_media record (background task)
 */
async function pollAndUpdateVideoMetadata(streamId: string, postMediaId: string): Promise<void> {
  try {
    console.log(`[uploadPipeline] Starting metadata poll for streamId: ${streamId}, postMediaId: ${postMediaId}`);
    
    const metadata = await pollStreamMetadata(streamId, {
      maxAttempts: 40, // 4 minutes max (6s intervals)
      intervalMs: 6000,
      suppressRecoverableErrors: true,
    });

    if (metadata) {
      const success = await updatePostMediaMetadata(postMediaId, metadata);
      if (success) {
        console.log(`[uploadPipeline] Video metadata populated: ${postMediaId}`, metadata);
      }
    } else {
      console.warn(`[uploadPipeline] Failed to get metadata for ${streamId} - video may need backfill`);
    }
  } catch (err) {
    console.error(`[uploadPipeline] Metadata poll error for ${streamId}:`, err);
  }
}

/**
 * Poll for video metadata and update course_review_media record (background task)
 * Similar to pollAndUpdateVideoMetadata but for review videos
 */
async function pollAndUpdateReviewVideoMetadata(streamId: string, reviewMediaId: string): Promise<void> {
  try {
    console.log(`[uploadPipeline] Starting review video metadata poll for streamId: ${streamId}, reviewMediaId: ${reviewMediaId}`);
    
    const metadata = await pollStreamMetadata(streamId, {
      maxAttempts: 40, // 4 minutes max (6s intervals)
      intervalMs: 6000,
      suppressRecoverableErrors: true,
    });

    if (metadata) {
      // Update course_review_media record with video dimensions and duration
      const { error } = await supabase
        .from('course_review_media')
        .update({
          width: metadata.width || null,
          height: metadata.height || null,
          aspect_ratio: metadata.aspectRatio || null,
          duration_seconds: metadata.durationSeconds || null,
        } as any)
        .eq('id', reviewMediaId);
      
      if (error) {
        console.warn(`[uploadPipeline] Failed to update review video metadata:`, error);
      } else {
        console.log(`[uploadPipeline] Review video metadata populated: ${reviewMediaId}`, metadata);
      }
    } else {
      console.warn(`[uploadPipeline] Failed to get review video metadata for ${streamId} - may need backfill`);
    }
  } catch (err) {
    console.error(`[uploadPipeline] Review video metadata poll error for ${streamId}:`, err);
  }
}

/**
 * Mark stream assets as attached after successful post creation
 */
async function markStreamAssetsAttached(streamUids: string[], postId: string): Promise<void> {
  for (const uid of streamUids) {
    try {
      const { error } = await supabase
        .from('stream_assets')
        .update({ status: 'attached', post_id: postId })
        .eq('uid', uid);
      
      if (error) {
        console.warn(`[uploadPipeline] Failed to mark stream asset ${uid} as attached:`, error);
      } else {
        console.log(`[uploadPipeline] Marked stream asset ${uid} as attached`);
      }
    } catch (err) {
      console.warn(`[uploadPipeline] Error marking stream asset ${uid} as attached:`, err);
    }
  }
}

/**
 * Process a single upload job
 */
async function processJob(jobId: string): Promise<void> {
  // Prevent double-processing
  if (!uploadManager.markProcessing(jobId)) {
    console.log(`[uploadPipeline] Job ${jobId} already processing, skipping`);
    return;
  }

  const job = uploadManager.getJob(jobId);
  if (!job) {
    console.error(`[uploadPipeline] Job ${jobId} not found`);
    uploadManager.clearProcessing(jobId);
    return;
  }

  // Skip if already complete
  if (job.status === 'complete') {
    uploadManager.clearProcessing(jobId);
    return;
  }

  // Branch based on job type - route BEFORE any post-specific validation
  const jobType = job.type || 'post'; // Default to 'post' for backwards compatibility
  
  console.log(`[uploadPipeline] Processing ${jobType} job ${jobId}`);
  
  if (jobType === 'review') {
    await processReviewJob(jobId, job);
    return;
  }
  
  // Continue with post processing...
  await processPostJob(jobId, job);
}

/**
 * Process a post upload job (original logic)
 */
async function processPostJob(jobId: string, job: any): Promise<void> {
  // Check for compiled video (Smart Compilation - already uploaded to Stream)
  const hasCompiledVideo = job.mediaItems?.some((m: any) => m.compiledVideo);
  
  // Check for restored media (from drafts/scheduled posts - already uploaded)
  const restoredMedia = job.mediaItems?.filter((m: any) => m.isRestored && m.restoredMediaUrl) || [];
  const hasRestoredMedia = restoredMedia.length > 0;
  const hasNewFiles = job.files && job.files.length > 0;
  
  // CRITICAL: Fail fast if no media sources - don't create orphaned posts
  if (!hasNewFiles && !hasCompiledVideo && !hasRestoredMedia) {
    console.error(`[uploadPipeline] Job ${jobId} has no media - aborting`);
    uploadManager.markFailed(jobId, 'No media files to upload');
    return;
  }

  console.log(`[uploadPipeline] Processing post job ${jobId}: ${job.files?.length || 0} new files, ${restoredMedia.length} restored, hasCompiledVideo: ${hasCompiledVideo}`);

  // Track uploaded stream UIDs for cleanup on failure
  const uploadedStreamUids: string[] = [];

  try {
    // Acquire wake lock and start visibility monitoring
    await uploadWakeLock.acquire();
    uploadVisibilityMonitor.start();

    // Show background limitation warning for large uploads
    const totalSizeMB = (job.files || []).reduce((sum: number, f: File) => sum + f.size, 0) / (1024 * 1024);
    const bgWarning = getBackgroundUploadWarning(totalSizeMB);
    if (bgWarning) {
      toast.info(bgWarning, { duration: 8000 });
    }

    // Phase A: Create post shell
    uploadManager.updateStatus(jobId, 'creating_post');

    const postData = await createPost({
      userId: job.userId,
      content: job.caption || null,
      achievementId: job.achievementId || null,
      actorType: job.actorType,
      actorId: job.actorId,
      courseId: job.courseInfo?.id || null,
      courseIds: job.courseIds, // Multi-course support for junction table
      categories: job.categories || [],
      visibility: job.visibility || 'anyone',
      badges: job.badges || [],
      // Scheduling support
      scheduledAt: job.scheduledAt || null,
      // Always start as 'uploading' — set 'published' or 'scheduled' only in finalizePost after all media uploaded
      status: 'uploading',
    });

    const postId = postData.id;
    uploadManager.updateStatus(jobId, 'uploading_media', postId);

    console.log(`[uploadPipeline] Created post ${postId} for job ${jobId}`);

    // Handle compiled video specially (no file upload needed)
    if (hasCompiledVideo) {
      const compiledMedia = job.mediaItems?.find(m => m.compiledVideo);
      if (compiledMedia?.compiledVideo) {
        const { streamId, playbackUrl, posterUrl } = compiledMedia.compiledVideo;
        
        console.log(`[uploadPipeline] Using compiled video: ${streamId}`);
        
        // Create media record for compiled video
        const { error: mediaError } = await supabase
          .from('post_media')
          .insert({
            post_id: postId,
            media_type: 'video',
            media_url: playbackUrl,
            display_order: 0,
            stream_id: streamId,
            poster_url: posterUrl,
            studio_edits: { isCompilation: true },
          });

        if (mediaError) {
          console.error(`[uploadPipeline] Compiled media record error:`, mediaError);
          throw mediaError;
        }

        uploadManager.updateProgress(jobId, 1);
        uploadedStreamUids.push(streamId);
      }
    } else if (hasNewFiles && job.files.length > 0) {
      // Phase B: Upload new media files sequentially (normal flow)
      // Now using TUS for videos and compression for images
      // PARTIAL FAILURE: continue on error, track per-file results

    // Track uploaded media for image processing
    const uploadedMediaForProcessing: Array<{
      id: string;
      mediaUrl: string;
      mediaType: 'image' | 'video';
      streamId?: string | null;
      studioEdits?: any;
      filterId?: string | null;
    }> = [];

    // Track per-file upload results for partial failure recovery
    interface FileUploadResult {
      index: number;
      status: 'completed' | 'failed';
      error?: string;
    }
    const fileUploadResults: FileUploadResult[] = [];

    for (let index = 0; index < job.files.length; index++) {
      const file = job.files[index];
      const mediaItem = job.mediaItems?.[index];
      const fileId = mediaItem?.id || `file-${index}`;
      
      console.log(`[uploadPipeline] Uploading file ${index + 1}/${job.files.length}: ${file.name}`);

      // Check network status before upload - wait if offline
      if (!navigator.onLine) {
        console.log('[uploadPipeline] Offline, waiting for connection...');
        uploadEventBus.emit('file:upload-progress', {
          type: 'file:upload-progress',
          jobId,
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'paused',
        });
        
        await waitForOnline();
        console.log('[uploadPipeline] Back online, resuming...');
      }

      // Emit file upload start event
      uploadEventBus.emit('file:upload-start', {
        type: 'file:upload-start',
        jobId,
        fileId,
        fileIndex: index,
        totalFiles: job.files.length,
      });

      try {
        const fileName = `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 15)}`;
        const fileExtension = file.name.split('.').pop() || 'unknown';
        const fullFileName = `${fileName}.${fileExtension}`;

        let publicUrl = '';
        const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
        

        // Track stream_id and poster_url for videos
        let streamId: string | null = null;
        let posterUrl: string | null = null;
        
        // Dimensions for both images and videos
        let width: number | null = null;
        let height: number | null = null;
        let aspectRatio: number | null = null;
        let orientation: string | null = null;

        // Upload based on file type
        if (file.type.startsWith('video/') || (!file.type && /\.(mov|mp4|m4v)$/i.test(file.name))) {
          // === TUS RESUMABLE VIDEO UPLOAD ===
          
          console.log(`[uploadPipeline] Using TUS for video: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
          
          const speedTracker = new UploadSpeedTracker();
          
          const result = await new Promise<{ streamId: string }>((resolve, reject) => {
            uploadVideoWithTus({
              file,
              metadata: {
                postId,
                userId: job.userId,
              },
              onProgress: (bytesUploaded, bytesTotal) => {
                speedTracker.addSample(bytesUploaded);
                
                const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
                const speed = speedTracker.getSpeed();
                const eta = speedTracker.getETA(bytesTotal - bytesUploaded);
                
                // Emit detailed progress event for the banner
                uploadEventBus.emit('file:upload-progress', {
                  type: 'file:upload-progress',
                  jobId,
                  fileId,
                  fileName: file.name,
                  progress: percentage,
                  bytesUploaded,
                  bytesTotal,
                  speed,
                  eta,
                });
              },
              onSuccess: (streamId) => {
                
                console.log(`[uploadPipeline] TUS upload complete: ${streamId}`);
                resolve({ streamId });
              },
              onError: (error) => {
                
                console.error(`[uploadPipeline] TUS upload failed:`, error);
                reject(error);
              },
            }).catch(reject);
          });
          
          streamId = result.streamId;
          publicUrl = generateStreamHlsUrl(streamId);
          const posterTime = mediaItem?.posterTimestamp ?? 1;
          posterUrl = generateStreamThumbnailUrl(streamId, { width: 1280, height: 720, time: posterTime });
          
          // Track for potential cleanup
          if (streamId) {
            uploadedStreamUids.push(streamId);
          }
          
          
          console.log(`[uploadPipeline] Video uploaded via TUS, streamId: ${streamId}`);
          
        } else {
          // === IMAGE UPLOAD WITH COMPRESSION ===
          let fileToUpload = file;
          
          // Compress image if it's compressible and large enough
          if (isCompressibleImage(file)) {
            // Emit preparing status
            uploadEventBus.emit('file:upload-progress', {
              type: 'file:upload-progress',
              jobId,
              fileId,
              fileName: file.name,
              progress: 0,
              status: 'preparing',
            });
            
            console.log(`[uploadPipeline] Compressing image: ${file.name}`);
            
            const compressionResult = await compressImage(file, {
              maxSizeMB: 2,
              maxWidthOrHeight: 2048,
              quality: 0.85,
              preserveExif: true,
            });
            
            fileToUpload = compressionResult.file;
            width = compressionResult.width;
            height = compressionResult.height;
            aspectRatio = parseFloat((width / height).toFixed(4));
            orientation = width === height ? 'square' : width > height ? 'landscape' : 'portrait';
            
            if (compressionResult.wasCompressed) {
              console.log(
                `[uploadPipeline] Compressed ${file.name}: ` +
                `${Math.round(compressionResult.originalSize / 1024)}KB → ` +
                `${Math.round(compressionResult.compressedSize / 1024)}KB`
              );
            }
          } else {
            // For non-compressible images, just get dimensions
            const imageDimensions = await getImageDimensions(file);
            if (imageDimensions) {
              width = imageDimensions.width;
              height = imageDimensions.height;
              aspectRatio = imageDimensions.aspectRatio;
              orientation = imageDimensions.orientation;
            }
          }
          
          // Upload with progress tracking
          const speedTracker = new UploadSpeedTracker();
          
          // Emit uploading status
          uploadEventBus.emit('file:upload-progress', {
            type: 'file:upload-progress',
            jobId,
            fileId,
            fileName: file.name,
            progress: 0,
            bytesUploaded: 0,
            bytesTotal: fileToUpload.size,
          });

          const result = await uploadToCloudflareR2(fileToUpload, 'clbhouz-post-images', fullFileName);
          if (result.success && result.publicUrl) {
            publicUrl = result.publicUrl;
            
            // Emit complete progress
            uploadEventBus.emit('file:upload-progress', {
              type: 'file:upload-progress',
              jobId,
              fileId,
              fileName: file.name,
              progress: 100,
              bytesUploaded: fileToUpload.size,
              bytesTotal: fileToUpload.size,
            });
          } else {
            throw new Error(result.error || 'Image upload failed');
          }
        }

        // Get studio edits for this file
        const mediaId = mediaItem?.id;
        const edits = mediaId ? job.studioEditsByMediaId?.[mediaId] : undefined;
        const filterId = edits?.filter ?? null;

        // Create media record with stream_id and poster_url for videos
        // Cast studio_edits to Json type for Supabase
        const studioEditsJson = edits ? JSON.parse(JSON.stringify(edits)) : null;
        
        const { data: mediaRecord, error: mediaError } = await supabase
          .from('post_media')
          .insert({
            post_id: postId,
            media_type: mediaType,
            media_url: publicUrl,
            display_order: index,
            studio_edits: studioEditsJson,
            filter_id: filterId,
            stream_id: streamId,
            poster_url: posterUrl,
            upload_status: 'completed' as any,
            // Trim range (video only)
            trim_start: mediaItem?.trimStart ?? null,
            trim_end: mediaItem?.trimEnd ?? null,
            // Poster frame timestamp
            poster_timestamp: mediaItem?.posterTimestamp ?? null,
            // Include dimensions (works for both images and videos after TUS)
            ...(width && height && {
              width,
              height,
              aspect_ratio: aspectRatio,
              orientation,
            }),
          })
          .select('id')
          .single();

        if (mediaError) {
          console.error(`[uploadPipeline] Media record error:`, mediaError);
          throw mediaError;
        }

        // For videos, poll for metadata and update the record
        // This runs in background - don't block on it
        if (mediaType === 'video' && streamId && mediaRecord?.id) {
          pollAndUpdateVideoMetadata(streamId, mediaRecord.id);
        }

        // Track for media processing (images and videos)
        if (mediaRecord?.id) {
          uploadedMediaForProcessing.push({
            id: mediaRecord.id,
            mediaUrl: publicUrl,
            mediaType: mediaType as 'image' | 'video',
            streamId: streamId, // Include streamId for video processing
            studioEdits: studioEditsJson,
            filterId,
          });
        }

        // Update progress
        uploadManager.updateProgress(jobId, index + 1);
        console.log(`[uploadPipeline] Uploaded file ${index + 1}/${job.files.length}`);

        // Emit file upload complete event
        uploadEventBus.emit('file:upload-complete', {
          type: 'file:upload-complete',
          jobId,
          fileId,
        });

        fileUploadResults.push({ index, status: 'completed' });

      } catch (fileError: any) {
        console.error(`[uploadPipeline] Failed to upload file ${file.name}:`, fileError);
        
        // Emit file upload failed event
        uploadEventBus.emit('file:upload-failed', {
          type: 'file:upload-failed',
          jobId,
          fileId,
          error: fileError?.message || 'Upload failed',
        });

        // Create a placeholder post_media row with 'failed' status for tracking
        try {
          await supabase.from('post_media').insert({
            post_id: postId,
            media_type: file.type.startsWith('image/') ? 'image' : 'video',
            media_url: '', // No URL yet
            display_order: index,
            upload_status: 'failed' as any,
          });
        } catch (insertErr) {
          console.warn(`[uploadPipeline] Failed to create placeholder media row:`, insertErr);
        }
        
        fileUploadResults.push({ 
          index, 
          status: 'failed', 
          error: fileError?.message || 'Upload failed',
        });
        
        // CONTINUE to next file — don't throw
        continue;
      }
    }

    // Queue media processing for images/videos with edits (background, non-blocking)
    if (uploadedMediaForProcessing.length > 0) {
      queueImageProcessing(uploadedMediaForProcessing);
    }

    // === CHECK FOR PARTIAL FAILURE ===
    const completedCount = fileUploadResults.filter(r => r.status === 'completed').length;
    const failedCount = fileUploadResults.filter(r => r.status === 'failed').length;

    if (failedCount > 0 && completedCount > 0) {
      // PARTIAL FAILURE — some files uploaded, some didn't
      // Keep the post row (status stays 'uploading') so it doesn't appear in feeds
      console.log(`[uploadPipeline] Partial failure: ${completedCount}/${job.files.length} completed, ${failedCount} failed`);

      uploadManager.markPartialFailure(jobId, {
        postId,
        totalFiles: job.files.length,
        completedFiles: completedCount,
        failedFiles: failedCount,
        failedIndices: fileUploadResults
          .filter(r => r.status === 'failed')
          .map(r => r.index),
      });

      uploadEventBus.emit('upload:partial-failure', {
        type: 'upload:partial-failure',
        jobId,
        completedFiles: completedCount,
        failedFiles: failedCount,
        totalFiles: job.files.length,
      });

      toast.warning(
        `${completedCount} of ${job.files.length} files uploaded`,
        { description: 'Tap the banner to retry failed items' }
      );
      return; // Don't finalize — wait for retry
    }

    if (failedCount > 0 && completedCount === 0) {
      // ALL FAILED — clean up everything (existing behavior)
      console.error(`[uploadPipeline] All ${failedCount} files failed to upload`);
      
      // Clean up orphaned Cloudflare Stream assets
      if (uploadedStreamUids.length > 0) {
        await cleanupStreamAssets(uploadedStreamUids);
      }

      // Delete the post row
      try {
        await supabase.from('posts').delete().eq('id', postId);
        console.log(`[uploadPipeline] Rolled back post ${postId}`);
      } catch (cleanupError) {
        console.warn(`[uploadPipeline] Failed to rollback post:`, cleanupError);
      }

      const errorMsg = 'All files failed to upload. Please try again.';
      uploadManager.markFailed(jobId, errorMsg);
      uploadEventBus.emit('upload:failed', {
        type: 'upload:failed',
        jobId,
        error: errorMsg,
      });
      toast.error('Upload failed', { description: 'Please try again' });
      uploadWakeLock.release();
      uploadVisibilityMonitor.stop();
      return;
    }

    // ALL SUCCEEDED — continue to finalization below
    } // End of else block for normal file upload flow

    // Phase C: Handle restored media (from drafts/scheduled posts - already uploaded)
    if (hasRestoredMedia && restoredMedia.length > 0) {
      console.log(`[uploadPipeline] Processing ${restoredMedia.length} restored media items`);
      
      // Calculate display order offset (after any new uploads)
      const displayOrderOffset = job.files?.length || 0;
      
      for (let idx = 0; idx < restoredMedia.length; idx++) {
        const item = restoredMedia[idx];
        const mediaType = item.type || (item.restoredStreamId ? 'video' : 'image');
        
        // Get studio edits for this item
        const edits = item.id ? job.studioEditsByMediaId?.[item.id] : undefined;
        const filterId = edits?.filter ?? null;
        const studioEditsJson = edits ? JSON.parse(JSON.stringify(edits)) : null;
        
        console.log(`[uploadPipeline] Creating post_media for restored item: ${item.restoredMediaUrl}, type: ${mediaType}`);
        
        const { error: mediaError } = await supabase
          .from('post_media')
          .insert({
            post_id: postId,
            media_type: mediaType,
            media_url: item.restoredMediaUrl!,
            display_order: displayOrderOffset + idx,
            stream_id: item.restoredStreamId || null,
            poster_url: item.restoredStreamId 
              ? generateStreamThumbnailUrl(item.restoredStreamId, { width: 1280, height: 720, time: (item as any).posterTimestamp ?? 1 })
              : null,
            poster_timestamp: (item as any).posterTimestamp ?? null,
            width: item.width || null,
            height: item.height || null,
            aspect_ratio: item.aspectRatio || null,
            duration_seconds: item.duration || null,
            studio_edits: studioEditsJson,
            filter_id: filterId,
            upload_status: 'completed' as any,
          });

        if (mediaError) {
          console.error(`[uploadPipeline] Restored media record error:`, mediaError);
          throw mediaError;
        }
        
        // Track video stream IDs
        if (item.restoredStreamId) {
          uploadedStreamUids.push(item.restoredStreamId);
        }
      }
      
      // Update progress
      uploadManager.updateProgress(jobId, (job.files?.length || 0) + restoredMedia.length);
    }

    // Finalizing phase
    await finalizePost(jobId, postId, job, uploadedStreamUids);
    uploadWakeLock.release();
    uploadVisibilityMonitor.stop();

  } catch (error: any) {
    console.error('[uploadPipeline] processJob failed:', error);
    
    // Build user-friendly error message based on error type
    let userMessage = 'Upload failed. Please try again.';
    
    // Handle specific Supabase/Postgres errors
    if (error?.code === '42501') {
      userMessage = 'Permission denied. Please check your account settings.';
    } else if (error?.code === '23503') {
      userMessage = 'Invalid reference. The linked item may have been deleted.';
    } else if (error?.code === '23505') {
      userMessage = 'This post already exists.';
    } else if (error?.message?.includes('JWT')) {
      userMessage = 'Session expired. Please sign in again.';
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      userMessage = 'Network error. Please check your connection.';
    } else if (error?.message?.includes('permission') || error?.message?.includes('Permission')) {
      userMessage = error.message;
    } else if (error?.message?.includes('actor')) {
      userMessage = error.message;
    } else if (error?.message) {
      userMessage = error.message;
    }
    
    uploadManager.markFailed(jobId, userMessage);
    
    // Emit upload failed event for the progress banner
    uploadEventBus.emit('upload:failed', {
      type: 'upload:failed',
      jobId,
      error: userMessage,
    });
    
    // Show error toast
    toast.error(userMessage, {
      duration: 5000,
    });

    // Clean up orphaned Cloudflare Stream assets
    if (uploadedStreamUids.length > 0) {
      console.log(`[uploadPipeline] Cleaning up ${uploadedStreamUids.length} orphaned stream assets...`);
      await cleanupStreamAssets(uploadedStreamUids);
    }

    // Try to clean up partial post if we got one created
    const currentJob = uploadManager.getJob(jobId);
    if (currentJob?.postId) {
      try {
        await supabase.from('posts').delete().eq('id', currentJob.postId);
        console.log(`[uploadPipeline] Rolled back post ${currentJob.postId}`);
      } catch (cleanupError) {
      console.warn(`[uploadPipeline] Failed to rollback post:`, cleanupError);
      }
    }

    uploadWakeLock.release();
    uploadVisibilityMonitor.stop();
  }
}

/**
 * Finalize a post after all media has been uploaded successfully.
 * Handles tags, course info, stream asset tracking, and status update.
 */
async function finalizePost(jobId: string, postId: string, job: any, uploadedStreamUids: string[]): Promise<void> {
  uploadManager.updateStatus(jobId, 'finalizing', postId);

  // Handle tags
  if (job.selectedTags && job.selectedTags.length > 0) {
    try {
      await handlePostTags(postId, job.selectedTags, job.userId, job.caption || '');
    } catch (tagError) {
      console.warn(`[uploadPipeline] Tag handling error (non-fatal):`, tagError);
    }
  }

  // Handle course info
  if (job.courseInfo) {
    try {
      const updatedContent = `${job.caption || ''}\n\n📍 Played at ${job.courseInfo.name}, ${job.courseInfo.country}`.trim();
      await supabase.from('posts').update({ content: updatedContent }).eq('id', postId);
    } catch (courseError) {
      console.warn(`[uploadPipeline] Course info error (non-fatal):`, courseError);
    }
  }

  // Mark stream assets as attached
  if (uploadedStreamUids.length > 0) {
    await markStreamAssetsAttached(uploadedStreamUids, postId);
  }

  // Update post status to 'published' or 'scheduled'
  if (job.scheduledAt) {
    const { error: statusError } = await supabase
      .from('posts')
      .update({
        status: 'scheduled',
        scheduled_at: job.scheduledAt instanceof Date
          ? job.scheduledAt.toISOString()
          : job.scheduledAt,
      })
      .eq('id', postId);
    
    if (statusError) {
      console.warn('[uploadPipeline] Failed to update post status to scheduled:', statusError);
    } else {
      console.log(`[uploadPipeline] Post ${postId} now scheduled`);
    }
  } else {
    const { error: statusError } = await supabase
      .from('posts')
      .update({ status: 'published' })
      .eq('id', postId);
    
    if (statusError) {
      console.warn('[uploadPipeline] Failed to update post status to published:', statusError);
    } else {
      console.log(`[uploadPipeline] Post ${postId} now published`);
    }
  }

  // Mark complete (also emits upload:complete event)
  uploadManager.markComplete(jobId, postId);
}

/**
 * Retry only the failed media items for a partially-failed upload job.
 * Requires the original File objects to still be in memory (no page refresh).
 */
export async function retryFailedItems(jobId: string): Promise<boolean> {
  const job = uploadManager.getJob(jobId);
  if (!job?.partialFailure || !job.files) {
    console.warn('[uploadPipeline] Cannot retry: job not found or no partial failure info');
    return false;
  }

  const { postId, failedIndices } = job.partialFailure;

  // Check that File objects are still available
  if (job.files.length === 0) {
    toast.error('Upload data is no longer available', {
      description: 'Please create the post again',
    });
    return false;
  }

  // Mark job as uploading again
  uploadManager.updateStatus(jobId, 'uploading_media', postId);

  // Track new stream UIDs for cleanup if retry also fails
  const uploadedStreamUids: string[] = [];
  let newlyCompleted = 0;
  let stillFailed = 0;
  const stillFailedIndices: number[] = [];

  for (const idx of failedIndices) {
    const file = job.files[idx];
    if (!file) {
      console.warn(`[uploadPipeline] No file for index ${idx}, skipping`);
      stillFailed++;
      stillFailedIndices.push(idx);
      continue;
    }

    const mediaItem = job.mediaItems?.[idx];
    const fileId = mediaItem?.id || `file-${idx}`;

    // Find the failed post_media row for this item
    const { data: mediaRow } = await supabase
      .from('post_media')
      .select('id')
      .eq('post_id', postId)
      .eq('display_order', idx)
      .limit(1);

    const existingRowId = mediaRow?.[0]?.id;

    try {
      const fileName = `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 15)}`;
      const fileExtension = file.name.split('.').pop() || 'unknown';
      const fullFileName = `${fileName}.${fileExtension}`;
      const mediaType = file.type.startsWith('image/') ? 'image' : 'video';

      let publicUrl = '';
      let streamId: string | null = null;
      let posterUrl: string | null = null;
      let width: number | null = null;
      let height: number | null = null;
      let aspectRatioVal: number | null = null;
      let orientation: string | null = null;

      if (file.type.startsWith('video/')) {
        const speedTracker = new UploadSpeedTracker();
        const result = await new Promise<{ streamId: string }>((resolve, reject) => {
          uploadVideoWithTus({
            file,
            metadata: { postId, userId: job.userId },
            onProgress: (bytesUploaded, bytesTotal) => {
              speedTracker.addSample(bytesUploaded);
              uploadEventBus.emit('file:upload-progress', {
                type: 'file:upload-progress',
                jobId,
                fileId,
                fileName: file.name,
                progress: Math.round((bytesUploaded / bytesTotal) * 100),
                bytesUploaded,
                bytesTotal,
                speed: speedTracker.getSpeed(),
                eta: speedTracker.getETA(bytesTotal - bytesUploaded),
              });
            },
            onSuccess: (sid) => resolve({ streamId: sid }),
            onError: (error) => reject(error),
          }).catch(reject);
        });
        
        streamId = result.streamId;
        publicUrl = generateStreamHlsUrl(streamId);
        const retryPosterTime = mediaItem?.posterTimestamp ?? (mediaItem as any)?.posterTimestamp ?? 1;
        posterUrl = generateStreamThumbnailUrl(streamId, { width: 1280, height: 720, time: retryPosterTime });
        uploadedStreamUids.push(streamId);
      } else {
        let fileToUpload = file;
        if (isCompressibleImage(file)) {
          const compressionResult = await compressImage(file, {
            maxSizeMB: 2, maxWidthOrHeight: 2048, quality: 0.85, preserveExif: true,
          });
          fileToUpload = compressionResult.file;
          width = compressionResult.width;
          height = compressionResult.height;
          aspectRatioVal = parseFloat((width / height).toFixed(4));
          orientation = width === height ? 'square' : width > height ? 'landscape' : 'portrait';
        } else {
          const dims = await getImageDimensions(file);
          if (dims) { width = dims.width; height = dims.height; aspectRatioVal = dims.aspectRatio; orientation = dims.orientation; }
        }
        
        const result = await uploadToCloudflareR2(fileToUpload, 'clbhouz-post-images', fullFileName);
        if (!result.success || !result.publicUrl) throw new Error(result.error || 'Image upload failed');
        publicUrl = result.publicUrl;
      }

      // Get studio edits
      const edits = mediaItem?.id ? job.studioEditsByMediaId?.[mediaItem.id] : undefined;
      const filterId = edits?.filter ?? null;
      const studioEditsJson = edits ? JSON.parse(JSON.stringify(edits)) : null;

      if (existingRowId) {
        // Update existing failed row
        await supabase
          .from('post_media')
          .update({
            media_url: publicUrl,
            stream_id: streamId,
            poster_url: posterUrl,
            upload_status: 'completed' as any,
            studio_edits: studioEditsJson,
            filter_id: filterId,
            trim_start: mediaItem?.trimStart ?? null,
            trim_end: mediaItem?.trimEnd ?? null,
            poster_timestamp: (mediaItem as any)?.posterTimestamp ?? null,
            ...(width && height && { width, height, aspect_ratio: aspectRatioVal, orientation }),
          })
          .eq('id', existingRowId);
      } else {
        // Insert new row
        await supabase.from('post_media').insert({
          post_id: postId,
          media_type: file.type.startsWith('image/') ? 'image' : 'video',
          media_url: publicUrl,
          display_order: idx,
          stream_id: streamId,
          poster_url: posterUrl,
          upload_status: 'completed' as any,
          studio_edits: studioEditsJson,
          filter_id: filterId,
          trim_start: mediaItem?.trimStart ?? null,
          trim_end: mediaItem?.trimEnd ?? null,
          poster_timestamp: (mediaItem as any)?.posterTimestamp ?? null,
          ...(width && height && { width, height, aspect_ratio: aspectRatioVal, orientation }),
        });
      }

      // Poll video metadata in background
      if (streamId && existingRowId) {
        pollAndUpdateVideoMetadata(streamId, existingRowId);
      }

      newlyCompleted++;
      
      uploadEventBus.emit('file:upload-complete', {
        type: 'file:upload-complete',
        jobId,
        fileId,
      });

    } catch (error: any) {
      console.error(`[uploadPipeline] Retry file ${idx} failed:`, error);
      
      if (existingRowId) {
        await supabase.from('post_media')
          .update({ upload_status: 'failed' as any })
          .eq('id', existingRowId);
      }
      
      stillFailed++;
      stillFailedIndices.push(idx);
    }
  }

  // Check final state
  if (stillFailed === 0) {
    // All items now completed — finalize the post
    await finalizePost(jobId, postId, job, uploadedStreamUids);
    uploadWakeLock.release();
    uploadVisibilityMonitor.stop();
    toast.success('Upload complete');
    return true;
  } else {
    // Still have failures
    uploadManager.markPartialFailure(jobId, {
      postId,
      totalFiles: job.partialFailure!.totalFiles,
      completedFiles: job.partialFailure!.completedFiles + newlyCompleted,
      failedFiles: stillFailed,
      failedIndices: stillFailedIndices,
    });

    uploadEventBus.emit('upload:partial-failure', {
      type: 'upload:partial-failure',
      jobId,
      completedFiles: job.partialFailure!.completedFiles + newlyCompleted,
      failedFiles: stillFailed,
      totalFiles: job.partialFailure!.totalFiles,
    });

    toast.warning(
      `${stillFailed} file(s) still failed`,
      { description: 'Check your connection and try again' }
    );
    return false;
  }
}
async function processReviewJob(jobId: string, job: any): Promise<void> {
  const reviewData = job.reviewData;
  
  if (!reviewData) {
    console.error(`[uploadPipeline] Review job ${jobId} missing reviewData`);
    uploadManager.markFailed(jobId, 'Missing review data');
    return;
  }

  console.log(`[uploadPipeline] Processing review job ${jobId} for course: ${reviewData.courseName}`);

  // Track uploaded stream UIDs for cleanup on failure
  const uploadedStreamUids: string[] = [];

  try {
    // Phase A: Create or update the course_ratings record
    uploadManager.updateStatus(jobId, 'creating_post'); // Reuse status
    
    let ratingId = reviewData.ratingId; // May be undefined for new reviews
    
    if (!ratingId) {
      // Check if user already has a rating for this course (handles re-review case)
      const { data: existingRating } = await supabase
        .from('course_ratings')
        .select('id')
        .eq('course_id', reviewData.courseId)
        .eq('user_id', job.userId)
        .maybeSingle();
      
      if (existingRating) {
        // Update existing rating (user is re-reviewing the course)
        ratingId = existingRating.id;
        
        const { error: updateError } = await supabase
          .from('course_ratings')
          .update({
            rating: reviewData.overallRating,
            design_score: reviewData.breakdowns?.design ?? null,
            condition_score: reviewData.breakdowns?.condition ?? null,
            clubhouse_score: reviewData.breakdowns?.clubhouse ?? null,
            facilities_score: reviewData.breakdowns?.facilities ?? null,
            title: reviewData.title || null,
            review: reviewData.reviewText || null,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', ratingId);
        
        if (updateError) {
          throw new Error(`Failed to update rating: ${updateError.message}`);
        }
        
        // Delete existing media for this review (will be replaced with new uploads)
        await supabase
          .from('course_review_media')
          .delete()
          .eq('review_id', ratingId);
        
        console.log(`[uploadPipeline] Updated existing rating (re-review): ${ratingId}`);
        
        // Emit rating-created event for immediate navigation (re-review case)
        const hasMedia = job.files && job.files.length > 0;
        uploadEventBus.emit('review:rating-created', {
          type: 'review:rating-created',
          jobId,
          ratingId,
          courseId: reviewData.courseId,
          hasMedia,
        });
      } else {
        // Create new rating record
        const { data: rating, error: ratingError } = await supabase
          .from('course_ratings')
          .insert({
            course_id: reviewData.courseId,
            user_id: job.userId,
            rating: reviewData.overallRating,
            design_score: reviewData.breakdowns?.design ?? null,
            condition_score: reviewData.breakdowns?.condition ?? null,
            clubhouse_score: reviewData.breakdowns?.clubhouse ?? null,
            facilities_score: reviewData.breakdowns?.facilities ?? null,
            title: reviewData.title || null,
            review: reviewData.reviewText || null,
          } as any)
          .select('id')
          .single();
        
        if (ratingError || !rating) {
          throw new Error(`Failed to create rating: ${ratingError?.message}`);
        }
        
        ratingId = rating.id;
        console.log(`[uploadPipeline] Created new rating: ${ratingId}`);
        
        // Emit rating-created event IMMEDIATELY for instant UI navigation
        // This allows the user to see their review while media uploads continue
        const hasMedia = job.files && job.files.length > 0;
        uploadEventBus.emit('review:rating-created', {
          type: 'review:rating-created',
          jobId,
          ratingId,
          courseId: reviewData.courseId,
          hasMedia,
        });
      }
    } else {
      // ratingId was provided (edit mode) - update the rating
      const { error: updateError } = await supabase
        .from('course_ratings')
        .update({
          rating: reviewData.overallRating,
          design_score: reviewData.breakdowns?.design ?? null,
          condition_score: reviewData.breakdowns?.condition ?? null,
          clubhouse_score: reviewData.breakdowns?.clubhouse ?? null,
          facilities_score: reviewData.breakdowns?.facilities ?? null,
          title: reviewData.title || null,
          review: reviewData.reviewText || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', ratingId);
      
      if (updateError) {
        throw new Error(`Failed to update rating: ${updateError.message}`);
      }
      
      console.log(`[uploadPipeline] Updated rating (edit mode): ${ratingId}`);
      
      // Emit rating-created event for immediate navigation (edit mode)
      const hasMedia = job.files && job.files.length > 0;
      uploadEventBus.emit('review:rating-created', {
        type: 'review:rating-created',
        jobId,
        ratingId,
        courseId: reviewData.courseId,
        hasMedia,
      });
    }

    // Phase B: Upload media files (if any)
    uploadManager.updateStatus(jobId, 'uploading_media');
    
    const hasFiles = job.files && job.files.length > 0;
    
    if (hasFiles) {
      for (let index = 0; index < job.files.length; index++) {
        const file = job.files[index];
        const mediaItem = job.mediaItems?.[index];
        const fileId = mediaItem?.id || `file-${index}`;
        
        console.log(`[uploadPipeline] Uploading review file ${index + 1}/${job.files.length}: ${file.name}`);
        
        // Check network status
        if (!navigator.onLine) {
          console.log('[uploadPipeline] Offline, waiting for connection...');
          uploadEventBus.emit('file:upload-progress', {
            type: 'file:upload-progress',
            jobId,
            fileId,
            fileName: file.name,
            progress: 0,
            status: 'paused',
          });
          
          await waitForOnline();
          console.log('[uploadPipeline] Back online, resuming...');
        }
        
        // Emit file upload start
        uploadEventBus.emit('file:upload-start', {
          type: 'file:upload-start',
          jobId,
          fileId,
          fileIndex: index,
          totalFiles: job.files.length,
        });
        
        const fileName = `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 15)}`;
        const fileExtension = file.name.split('.').pop() || 'unknown';
        const fullFileName = `${fileName}.${fileExtension}`;
        
        let publicUrl = '';
        const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
        let streamId: string | null = null;
        let posterUrl: string | null = null;
        let width: number | null = null;
        let height: number | null = null;
        let aspectRatio: number | null = null;
        
        if (file.type.startsWith('video/')) {
          // === TUS RESUMABLE VIDEO UPLOAD ===
          console.log(`[uploadPipeline] Using TUS for review video: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
          
          const speedTracker = new UploadSpeedTracker();
          const videoStartTime = Date.now();
          
          // Add timeout for video uploads (10 minutes max per video)
          const VIDEO_UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;
          let uploadTimedOut = false;
          
          const timeoutId = setTimeout(() => {
            uploadTimedOut = true;
            console.error(`[uploadPipeline] Review video upload timed out after 10 minutes: ${file.name}`);
          }, VIDEO_UPLOAD_TIMEOUT_MS);
          
          try {
            const result = await new Promise<{ streamId: string }>((resolve, reject) => {
              // Check for timeout before starting
              if (uploadTimedOut) {
                reject(new Error(`Video upload timed out. Please try a shorter video or check your connection.`));
                return;
              }
              
              uploadVideoWithTus({
                file,
                metadata: {
                  ratingId,
                  userId: job.userId,
                  type: 'review',
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                  // Check for timeout during upload
                  if (uploadTimedOut) {
                    return;
                  }
                  
                  speedTracker.addSample(bytesUploaded);
                  
                  const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
                  const speed = speedTracker.getSpeed();
                  const eta = speedTracker.getETA(bytesTotal - bytesUploaded);
                  
                  // Log progress every 25%
                  if (percentage % 25 === 0) {
                    const elapsedSec = Math.round((Date.now() - videoStartTime) / 1000);
                    console.log(`[uploadPipeline] Review video progress: ${percentage}% (${elapsedSec}s elapsed, ${speed ? (speed / (1024 * 1024)).toFixed(1) : '?'} MB/s)`);
                  }
                  
                  uploadEventBus.emit('file:upload-progress', {
                    type: 'file:upload-progress',
                    jobId,
                    fileId,
                    fileName: file.name,
                    progress: percentage,
                    bytesUploaded,
                    bytesTotal,
                    speed,
                    eta,
                  });
                },
                onSuccess: (sid) => {
                  clearTimeout(timeoutId);
                  const totalTimeSec = Math.round((Date.now() - videoStartTime) / 1000);
                  console.log(`[uploadPipeline] TUS review video complete: ${sid} (took ${totalTimeSec}s)`);
                  resolve({ streamId: sid });
                },
                onError: (error) => {
                  clearTimeout(timeoutId);
                  console.error(`[uploadPipeline] TUS review video failed after ${Math.round((Date.now() - videoStartTime) / 1000)}s:`, error);
                  reject(error);
                },
              }).catch(reject);
            });
            
            streamId = result.streamId;
            // Use proper URL generator instead of hardcoded URL
            publicUrl = generateStreamHlsUrl(streamId);
            posterUrl = generateStreamThumbnailUrl(streamId, { width: 1280, height: 720, time: (mediaItem as any)?.posterTimestamp ?? 1 });
            uploadedStreamUids.push(streamId);
            
          } catch (videoError: any) {
            clearTimeout(timeoutId);
            
            // Emit specific error for this file
            uploadEventBus.emit('file:upload-failed', {
              type: 'file:upload-failed',
              jobId,
              fileId,
              error: videoError?.message || 'Video upload failed',
            });
            
            // Re-throw with more context for user feedback
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
            throw new Error(`Video upload failed for "${file.name}" (${fileSizeMB} MB): ${videoError?.message || 'Unknown error'}. Try uploading a smaller video or check your internet connection.`);
          }
          
        } else {
          // === IMAGE UPLOAD WITH COMPRESSION ===
          let fileToUpload = file;
          
          if (isCompressibleImage(file)) {
            uploadEventBus.emit('file:upload-progress', {
              type: 'file:upload-progress',
              jobId,
              fileId,
              fileName: file.name,
              progress: 0,
              status: 'preparing',
            });
            
            const compressionResult = await compressImage(file, {
              maxSizeMB: 2,
              maxWidthOrHeight: 2048,
              quality: 0.85,
              preserveExif: true,
            });
            
            fileToUpload = compressionResult.file;
            width = compressionResult.width;
            height = compressionResult.height;
            aspectRatio = parseFloat((width / height).toFixed(4));
            
            if (compressionResult.wasCompressed) {
              console.log(`[uploadPipeline] Compressed review image: ${file.name}`);
            }
          } else {
            const dims = await getImageDimensions(file);
            if (dims) {
              width = dims.width;
              height = dims.height;
              aspectRatio = dims.aspectRatio;
            }
          }
          
          // Upload to review images bucket
          const result = await uploadToCloudflareR2(
            fileToUpload, 
            'clbhouz-review-images', // Different bucket than posts
            fullFileName
          );
          
          if (result.success && result.publicUrl) {
            publicUrl = result.publicUrl;
            
            uploadEventBus.emit('file:upload-progress', {
              type: 'file:upload-progress',
              jobId,
              fileId,
              fileName: file.name,
              progress: 100,
              bytesUploaded: fileToUpload.size,
              bytesTotal: fileToUpload.size,
            });
          } else {
            throw new Error(result.error || 'Review image upload failed');
          }
        }
        
        // Create course_review_media record (no display_order column in schema)
        const { data: mediaRecord, error: mediaError } = await supabase
          .from('course_review_media')
          .insert({
            review_id: ratingId,
            media_url: publicUrl,
            media_type: mediaType,
            stream_id: streamId,
            poster_url: posterUrl,
            width,
            height,
            aspect_ratio: aspectRatio,
            status: 'attached',
            owner_user_id: job.userId,
            is_cover: job.reviewData?.coverMediaId
              ? `pending-${index}` === job.reviewData.coverMediaId
              : index === 0,
          } as any)
          .select('id')
          .single();
        
        if (mediaError) {
          console.error(`[uploadPipeline] Failed to create review media record:`, mediaError);
        } else {
          console.log(`[uploadPipeline] Created review media: ${mediaRecord.id}`);
          
          // Poll for video metadata in background (like posts do)
          if (mediaType === 'video' && streamId) {
            pollAndUpdateReviewVideoMetadata(streamId, mediaRecord.id).catch(err => {
              console.warn(`[uploadPipeline] Review video metadata poll failed:`, err);
            });
          }
        }
        
        // Emit file complete
        uploadEventBus.emit('file:upload-complete', {
          type: 'file:upload-complete',
          jobId,
          fileId,
          fileIndex: index,
          totalFiles: job.files.length,
        });
        
        // Update progress
        uploadManager.updateProgress(jobId, index + 1);
      }
    }
    
    // Handle review tags - always delete existing first to prevent duplicates
    if (reviewData.selectedTags && reviewData.selectedTags.length > 0) {
      try {
        // ALWAYS delete existing tags first (handles both new and update cases)
        // This prevents duplicate constraint errors when re-reviewing
        await supabase.from('review_tags').delete().eq('review_id', ratingId);
        
        const tagRecords = reviewData.selectedTags.map((tag: any) => ({
          review_id: ratingId,
          tagged_entity_id: tag.id,
          start_index: tag.start_index ?? null,
          end_index: tag.end_index ?? null,
        }));
        
        const { error: tagError } = await supabase.from('review_tags').insert(tagRecords);
        if (tagError) {
          console.error('[uploadPipeline] Failed to save review tags:', tagError);
        }
      } catch (tagError) {
        console.warn('[uploadPipeline] Tag handling error (non-fatal):', tagError);
      }
    }
    
    // Phase C: Complete
    uploadManager.updateStatus(jobId, 'finalizing');
    uploadManager.markComplete(jobId, ratingId);
    
    uploadEventBus.emit('upload:complete', {
      type: 'upload:complete',
      jobId,
      uploadType: 'review',
      ratingId,
      courseId: reviewData.courseId,
      actorType: job.actorType,
      actorId: job.actorId,
    });
    
    toast.success('Review posted', {
      description: reviewData.courseName,
    });
    
    console.log(`[uploadPipeline] Review job ${jobId} complete. Rating: ${ratingId}`);
    
  } catch (error: any) {
    console.error('[uploadPipeline] processReviewJob failed:', error);
    console.error('[uploadPipeline] Job state at failure:', {
      jobId,
      userId: job.userId,
      courseId: reviewData?.courseId,
      courseName: reviewData?.courseName,
      fileCount: job.files?.length || 0,
      timestamp: new Date().toISOString(),
    });
    
    // Build a more helpful user message
    let userMessage = 'Failed to submit review. Please try again.';
    if (error?.message) {
      // Clean up technical error messages for users
      const msg = error.message;
      if (msg.includes('timed out') || msg.includes('timeout')) {
        userMessage = 'Upload timed out. Please check your internet connection and try uploading smaller videos.';
      } else if (msg.includes('network') || msg.includes('Network') || msg.includes('offline')) {
        userMessage = 'Network error during upload. Please check your internet connection and try again.';
      } else if (msg.includes('Failed to get TUS')) {
        userMessage = 'Could not connect to video upload server. Please try again in a few minutes.';
      } else if (msg.includes('Video upload failed')) {
        // Pass through our own detailed error messages
        userMessage = msg;
      } else {
        userMessage = msg.length > 100 ? msg.substring(0, 100) + '...' : msg;
      }
    }
    
    uploadManager.markFailed(jobId, userMessage);
    
    uploadEventBus.emit('upload:failed', {
      type: 'upload:failed',
      jobId,
      error: userMessage,
    });
    
    toast.error(userMessage, {
      duration: 8000, // Show error longer so user can read it
      action: {
        label: 'Retry',
        onClick: () => {
          retryJob(jobId);
        },
      },
    });
    
    // Cleanup uploaded streams on failure
    if (uploadedStreamUids.length > 0) {
      console.log(`[uploadPipeline] Cleaning up ${uploadedStreamUids.length} review stream assets...`);
      await cleanupStreamAssets(uploadedStreamUids);
    }
  }
}

/**
 * Retry a failed job (if files are still available)
 */
export function retryJob(jobId: string): boolean {
  const job = uploadManager.getJob(jobId);
  if (!job || job.status !== 'failed') return false;
  
  // Can't retry if files were lost (page refresh)
  if (job.files.length === 0) {
    console.warn(`[uploadPipeline] Cannot retry job ${jobId} - files not available`);
    return false;
  }

  uploadManager.resetForRetry(jobId);
  processJob(jobId).catch(err => {
    console.error(`[uploadPipeline] retry processJob error:`, err);
  });

  return true;
}

/**
 * Cancel an in-progress upload job.
 * Cleans up the post row and any uploaded assets.
 */
export async function cancelJob(jobId: string): Promise<void> {
  const job = uploadManager.getJob(jobId);
  if (!job) return;

  console.log(`[uploadPipeline] Cancelling job ${jobId}`);

  // Clean up post row if created
  if (job.postId) {
    try {
      await supabase.from('posts').delete().eq('id', job.postId);
      console.log(`[uploadPipeline] Deleted post ${job.postId} from cancelled job`);
    } catch (err) {
      console.warn(`[uploadPipeline] Failed to delete post on cancel:`, err);
    }
  }

  uploadWakeLock.release();
  uploadVisibilityMonitor.stop();
  uploadManager.dismiss(jobId);
  toast.success('Upload cancelled');
}

/**
 * Check if there are any active (in-progress) uploads.
 * Used for the beforeunload tab-close warning.
 */
export function hasActiveUploads(): boolean {
  return uploadManager.getPendingJobs().length > 0;
}

// Module-level: log when app returns from background during active uploads
uploadEventBus.on('upload:foregrounded', (event) => {
  if (event.connectionMayBeStale && hasActiveUploads()) {
    console.log(`[uploadPipeline] Foregrounded after ${event.backgroundDurationSeconds}s, uploads active — TUS will auto-retry`);
  }
});
