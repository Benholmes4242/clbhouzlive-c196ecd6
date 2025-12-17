// Upload pipeline - processes jobs asynchronously

import { supabase } from '@/integrations/supabase/client';
import { uploadManager } from './UploadManager';
import { createPost } from '@/services/posts/createPost';
import { handlePostTags } from '@/hooks/usePostSubmission/uploadUtils';
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
 */
export function enqueuePostUpload(input: UploadJobInput): string {
  const jobId = uploadManager.enqueue(input);
  
  // Start processing in background (don't await)
  processJob(jobId).catch(err => {
    console.error(`[uploadPipeline] processJob error for ${jobId}:`, err);
  });

  return jobId;
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

  // Skip if already complete or no files
  if (job.status === 'complete') {
    uploadManager.clearProcessing(jobId);
    return;
  }

  console.log(`[uploadPipeline] Processing job ${jobId}`);

  try {
    // Phase A: Create post shell
    uploadManager.updateStatus(jobId, 'creating_post');

    const postData = await createPost({
      userId: job.userId,
      content: job.caption || null,
      achievementId: job.achievementId || null,
      actorType: job.actorType,
      actorId: job.actorId,
    });

    const postId = postData.id;
    uploadManager.updateStatus(jobId, 'uploading_media', postId);

    console.log(`[uploadPipeline] Created post ${postId} for job ${jobId}`);

    // Phase B: Upload media files sequentially
    const { uploadVideo } = await getCloudflareStream().then(m => ({
      uploadVideo: async (file: File) => {
        // Use the hook's upload function via a simple wrapper
        const { uploadToCloudflareStream } = await import('@/utils/cloudflareStreamUpload');
        return uploadToCloudflareStream(file);
      }
    }));
    
    const { uploadToCloudflareR2 } = await getCloudflareR2();

    for (let index = 0; index < job.files.length; index++) {
      const file = job.files[index];
      console.log(`[uploadPipeline] Uploading file ${index + 1}/${job.files.length}: ${file.name}`);

      try {
        const fileName = `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 15)}`;
        const fileExtension = file.name.split('.').pop() || 'unknown';
        const fullFileName = `${fileName}.${fileExtension}`;

        let publicUrl = '';
        const mediaType = file.type.startsWith('image/') ? 'image' : 'video';

        // Upload based on file type
        if (file.type.startsWith('video/')) {
          const result = await uploadVideo(file);
          if (result.success && result.videoUrl) {
            publicUrl = result.videoUrl;
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
        const mediaItem = job.mediaItems?.[index];
        const mediaId = mediaItem?.id;
        const edits = mediaId ? job.studioEditsByMediaId?.[mediaId] : undefined;
        const filterId = edits?.filter ?? null;

        // Create media record
        const { error: mediaError } = await supabase
          .from('post_media')
          .insert({
            post_id: postId,
            media_type: mediaType,
            media_url: publicUrl,
            display_order: index,
            studio_edits: edits || null,
            filter_id: filterId,
          });

        if (mediaError) {
          console.error(`[uploadPipeline] Media record error:`, mediaError);
          throw mediaError;
        }

        // Update progress
        uploadManager.updateProgress(jobId, index + 1);
        console.log(`[uploadPipeline] Uploaded file ${index + 1}/${job.files.length}`);

      } catch (fileError) {
        console.error(`[uploadPipeline] Failed to upload file ${file.name}:`, fileError);
        throw fileError;
      }
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

    // Handle course info
    if (job.courseInfo) {
      try {
        const { data: taggableEntity } = await supabase
          .from('taggable_entities')
          .select('id')
          .eq('entity_type', 'golf_club')
          .eq('entity_id', job.courseInfo.id)
          .single();

        if (taggableEntity) {
          await supabase.from('post_tags').insert({
            post_id: postId,
            tagged_entity_id: taggableEntity.id,
            start_index: 0,
            end_index: 0,
          });
        }

        // Update content with course info
        const updatedContent = `${job.caption || ''}\n\n📍 Played at ${job.courseInfo.name}, ${job.courseInfo.country}`.trim();
        await supabase.from('posts').update({ content: updatedContent }).eq('id', postId);
      } catch (courseError) {
        console.warn(`[uploadPipeline] Course info error (non-fatal):`, courseError);
      }
    }

    // Mark complete
    uploadManager.markComplete(jobId, postId);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    uploadManager.markFailed(jobId, errorMessage);

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
