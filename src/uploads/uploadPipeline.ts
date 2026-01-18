// Upload pipeline - processes jobs asynchronously
// Includes stream asset tracking for orphan cleanup
// Includes video metadata polling for dimension/duration population
// Includes image processing for baking filters/text overlays
// Includes per-file upload events for progress UI

import { supabase } from '@/integrations/supabase/client';
import { uploadManager } from './UploadManager';
import { uploadEventBus } from './uploadEventBus';
import { createPost } from '@/services/posts/createPost';
import { handlePostTags } from '@/hooks/usePostSubmission/uploadUtils';
import { pollStreamMetadata, updatePostMediaMetadata } from '@/utils/pollStreamMetadata';
import { queueImageProcessing } from '@/services/imageProcessing';
import type { UploadJobInput } from './types';

// Import upload utilities dynamically to avoid circular deps
const getCloudflareStream = async () => {
  const mod = await import('@/hooks/useCloudflareStream');
  return mod;
};

const getCloudflareR2 = async () => {
  const mod = await import('@/utils/cloudflareUpload');
  return mod;
};

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

  console.log('[uploadPipeline] Enqueueing job:', {
    newFiles: input.files?.length || 0,
    restoredMedia: input.mediaItems?.filter(m => m.isRestored).length || 0,
    hasCompiledVideo,
  });

  const jobId = uploadManager.enqueue(input);
  
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
      maxAttempts: 30, // 60 seconds max (2s intervals)
      intervalMs: 2000,
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
      status: job.scheduledAt ? 'scheduled' : 'published',
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
      const { uploadVideo } = await getCloudflareStream().then(m => ({
        uploadVideo: async (file: File) => {
          // Use the hook's upload function via a simple wrapper
          const { uploadToCloudflareStream } = await import('@/utils/cloudflareStreamUpload');
          return uploadToCloudflareStream(file);
        }
      }));
      
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

        // Upload based on file type
        if (file.type.startsWith('video/')) {
          const result = await uploadVideo(file);
          if (result.success && result.videoUrl) {
            publicUrl = result.videoUrl;
            streamId = result.streamId || null;
            posterUrl = result.posterUrl || null;
            
            // Track for potential cleanup
            if (streamId) {
              uploadedStreamUids.push(streamId);
            }
            
            console.log(`[uploadPipeline] Video uploaded, streamId: ${streamId}`);
          } else {
            throw new Error(result.error || 'Video upload failed');
          }
        } else {
          const result = await uploadToCloudflareR2(file, 'clbhouz-post-images', fullFileName);
          if (result.success && result.publicUrl) {
            publicUrl = result.publicUrl;
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
              ? `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${item.restoredStreamId}/thumbnails/thumbnail.jpg?width=1280&height=720&time=1s`
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

    // Mark complete
    uploadManager.markComplete(jobId, postId);

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
