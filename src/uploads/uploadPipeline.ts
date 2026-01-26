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
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import type { UploadJobInput } from './types';

// New imports for TUS, compression, and network awareness
import { uploadVideoWithTus } from './tusVideoUpload';
import { compressImage, isCompressibleImage } from './imageCompression';
import { UploadSpeedTracker } from './uploadSpeedTracker';
import { waitForOnline } from './networkStatus';

// Import R2 upload utility
const getCloudflareR2 = async () => {
  const mod = await import('@/utils/cloudflareUpload');
  return mod;
};

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
      maxAttempts: 20, // 80 seconds max (4s intervals)
      intervalMs: 4000,
      suppressRecoverableErrors: true, // Don't spam console for recoverable 429s
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

  // Check for compiled video (Smart Compilation - already uploaded to Stream)
  const hasCompiledVideo = job.mediaItems?.some(m => m.compiledVideo);
  
  // Check for restored media (from drafts/scheduled posts - already uploaded)
  const restoredMedia = job.mediaItems?.filter(m => m.isRestored && m.restoredMediaUrl) || [];
  const hasRestoredMedia = restoredMedia.length > 0;
  const hasNewFiles = job.files && job.files.length > 0;
  
  // CRITICAL: Fail fast if no media sources - don't create orphaned posts
  if (!hasNewFiles && !hasCompiledVideo && !hasRestoredMedia) {
    console.error(`[uploadPipeline] Job ${jobId} has no media - aborting`);
    uploadManager.markFailed(jobId, 'No media files to upload');
    return;
  }

  console.log(`[uploadPipeline] Processing job ${jobId}: ${job.files?.length || 0} new files, ${restoredMedia.length} restored, hasCompiledVideo: ${hasCompiledVideo}`);

  // Track uploaded stream UIDs for cleanup on failure
  const uploadedStreamUids: string[] = [];

  try {
    // Phase A: Create post shell
    uploadManager.updateStatus(jobId, 'creating_post');

    const postData = await createPost({
      userId: job.userId,
      content: job.caption || null,
      achievementId: job.achievementId || null,
      actorType: job.actorType,
      actorId: job.actorId,
      courseId: job.courseInfo?.id || null,
      categories: job.categories || [],
      visibility: job.visibility || 'anyone',
      badges: job.badges || [],
      // Scheduling support
      scheduledAt: job.scheduledAt || null,
      // Create with 'uploading' status - will be updated to 'published' after media uploads complete
      status: job.scheduledAt ? 'scheduled' : 'uploading',
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
      
      const { uploadToCloudflareR2 } = await getCloudflareR2();

    // Track uploaded media for image processing
    const uploadedMediaForProcessing: Array<{
      id: string;
      mediaUrl: string;
      mediaType: 'image' | 'video';
      streamId?: string | null;
      studioEdits?: any;
      filterId?: string | null;
    }> = [];

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
        if (file.type.startsWith('video/')) {
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
          publicUrl = `https://customer-${process.env.CLOUDFLARE_ACCOUNT_ID || 'stream'}.cloudflarestream.com/${streamId}/manifest/video.m3u8`;
          posterUrl = generateStreamThumbnailUrl(streamId, { width: 1280, height: 720, time: 1 });
          
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

      } catch (fileError: any) {
        console.error(`[uploadPipeline] Failed to upload file ${file.name}:`, fileError);
        
        // Emit file upload failed event
        uploadEventBus.emit('file:upload-failed', {
          type: 'file:upload-failed',
          jobId,
          fileId,
          error: fileError?.message || 'Upload failed',
        });
        
        throw fileError;
      }
    }

    // Queue media processing for images/videos with edits (background, non-blocking)
    if (uploadedMediaForProcessing.length > 0) {
      queueImageProcessing(uploadedMediaForProcessing);
    }
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
              ? generateStreamThumbnailUrl(item.restoredStreamId, { width: 1280, height: 720, time: 1 })
              : null,
            width: item.width || null,
            height: item.height || null,
            aspect_ratio: item.aspectRatio || null,
            duration_seconds: item.duration || null,
            studio_edits: studioEditsJson,
            filter_id: filterId,
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
    uploadManager.updateStatus(jobId, 'finalizing', postId);

    // Handle tags
    if (job.selectedTags && job.selectedTags.length > 0) {
      try {
        await handlePostTags(postId, job.selectedTags, job.userId, job.caption || '');
      } catch (tagError) {
        console.warn(`[uploadPipeline] Tag handling error (non-fatal):`, tagError);
      }
    }

    // Handle course info - store as "Played at" line in content, NOT as a post_tag
    // Golf clubs are not @mentions - they use the "Played at" CTA instead
    if (job.courseInfo) {
      try {
        // Update content with course info (the CoursePostBadge renders this as a clickable CTA)
        const updatedContent = `${job.caption || ''}\n\n📍 Played at ${job.courseInfo.name}, ${job.courseInfo.country}`.trim();
        await supabase.from('posts').update({ content: updatedContent }).eq('id', postId);
      } catch (courseError) {
        console.warn(`[uploadPipeline] Course info error (non-fatal):`, courseError);
      }
    }

    // Mark stream assets as attached (success path)
    if (uploadedStreamUids.length > 0) {
      await markStreamAssetsAttached(uploadedStreamUids, postId);
    }

    // Update post status to 'published' now that all media is uploaded
    // Only for non-scheduled posts (scheduled posts stay in 'scheduled' status)
    if (!job.scheduledAt) {
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

    // Mark complete and show success toast
    uploadManager.markComplete(jobId, postId);
    
    // Emit upload complete event for the progress banner
    uploadEventBus.emit('upload:complete', {
      type: 'upload:complete',
      jobId,
      postId,
      actorType: job.actorType,
      actorId: job.actorId,
      isScheduled: !!job.scheduledAt,
      scheduledAt: job.scheduledAt instanceof Date 
        ? job.scheduledAt.toISOString() 
        : job.scheduledAt || undefined,
    });
    
    // Show success toast (only for non-scheduled posts)
    if (!job.scheduledAt) {
      toast.success('Your moment has been posted!', {
        duration: 4000,
      });
    } else {
      toast.success('Your moment has been scheduled!', {
        duration: 4000,
      });
    }

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
    const job = uploadManager.getJob(jobId);
    if (job?.postId) {
      try {
        await supabase.from('posts').delete().eq('id', job.postId);
        console.log(`[uploadPipeline] Rolled back post ${job.postId}`);
      } catch (cleanupError) {
        console.warn(`[uploadPipeline] Failed to rollback post:`, cleanupError);
      }
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
