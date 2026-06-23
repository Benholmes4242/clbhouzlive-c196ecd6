import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateFiles } from '@/components/posts/utils/fileValidation';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { edgePost } from '@/utils/callEdge';

interface PostSubmissionData {
  user: any;
  content: string;
  mediaFiles: File[];
  selectedTags: any[];
  /** Single primary course (legacy / back-compat). Use `courses` for multi-course. */
  courseInfo?: {
    id: string;
    name: string;
    country: string;
  } | null;
  /** Ordered list of tagged courses. First entry becomes the primary `posts.course_id`. */
  courses?: Array<{ id: string; name?: string; country?: string }> | null;
  /** Actor type for the post (personal or business). Defaults to 'personal'. */
  actorType?: 'personal' | 'business';
  /** Actor id (business id for business posts; defaults to user.id for personal). */
  actorId?: string | null;
  /** Post visibility. Defaults to 'anyone'. */
  visibility?: 'anyone' | 'followers' | 'private';
  onSuccess?: () => void;
  onError?: () => void;
}

export const usePostSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPost = async ({
    user,
    content,
    mediaFiles,
    selectedTags,
    courseInfo,
    actorType = 'personal',
    actorId,
    visibility = 'anyone',
    onSuccess,
    onError
  }: PostSubmissionData) => {
    setIsSubmitting(true);

    try {
      // Validate files first
      const validation = validateFiles(mediaFiles);
      if (!validation.isValid) {
        toast.error("Upload Error", { description: validation.error });
        onError?.();
        return;
      }

      console.log('Creating post with data:', {
        userId: user.id,
        content,
        mediaFilesCount: mediaFiles.length,
        tagsCount: selectedTags.length,
        courseInfo,
        fileDetails: mediaFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });

      // Don't create empty posts - require either content or media
      if (!content?.trim() && mediaFiles.length === 0) {
        throw new Error('Post must have either content or media');
      }

      // Create the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content || null,
          actor_type: actorType,
          actor_id: actorId ?? user.id,
          course_id: courseInfo?.id ?? null,
          visibility,
        })
        .select()
        .single();

      if (postError) throw postError;

      console.log('Post created:', postData);

      // Upload media files with error handling for each file
      let uploadErrors: string[] = [];
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(async (file, index) => {
          try {
            const fileName = `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 15)}`;
            const fileExtension = file.name.split('.').pop();
            const fullFileName = `${fileName}.${fileExtension}`;
            
            console.log(`Uploading file ${index + 1}/${mediaFiles.length}: ${file.name} (${file.size} bytes)`);
            
            // For videos, use Cloudflare Stream two-step direct upload.
            // Do NOT fall back to R2 for videos — an mp4 in R2 has no stream_id
            // and renders as a blank box in the feed's HLS player.
            if (file.type.startsWith('video/')) {
              const initData = await edgePost('cloudflare-stream-upload', {
                fileName: file.name,
                fileSize: file.size,
              });

              if (!initData?.uploadURL || !initData?.uid) {
                throw new Error('Failed to initialize Cloudflare Stream upload');
              }

              // Upload file bytes directly to Cloudflare
              const uploadForm = new FormData();
              uploadForm.append('file', file);
              const cfResp = await fetch(initData.uploadURL, {
                method: 'POST',
                body: uploadForm,
              });
              if (!cfResp.ok) {
                throw new Error(`Cloudflare direct upload failed (${cfResp.status})`);
              }

              const hlsUrl = generateStreamHlsUrl(initData.uid);
              console.log(`Successfully uploaded video to Cloudflare Stream: ${hlsUrl}`);

              const { error: mediaError } = await supabase
                .from('post_media')
                .insert({
                  post_id: postData.id,
                  media_type: 'video',
                  media_url: hlsUrl,
                  stream_id: initData.uid,
                });

              if (mediaError) throw mediaError;
              return { success: true, fileName: file.name };
            }

            // Images only — upload to Cloudflare R2

            const { uploadToCloudflareR2 } = await import('@/utils/cloudflareUpload');
            const uploadResult = await uploadToCloudflareR2(file, 'clbhouz-post-images', fullFileName);

            if (!uploadResult.success || !uploadResult.publicUrl) {
              throw new Error(uploadResult.error || 'Upload failed');
            }

            const publicUrl = uploadResult.publicUrl;

            console.log(`Successfully uploaded ${file.name}, public URL: ${publicUrl}`);

            const { error: mediaError } = await supabase
              .from('post_media')
              .insert({
                post_id: postData.id,
                media_type: 'image',
                media_url: publicUrl
              });

            if (mediaError) {
              console.error(`Media record error for file ${file.name}:`, mediaError);
              throw mediaError;
            }

            return { success: true, fileName: file.name };
          } catch (error) {
            console.error(`Failed to process file ${file.name}:`, error);
            return { success: false, fileName: file.name, error };
          }
        });

        const uploadResults = await Promise.all(uploadPromises);
        const failedUploads = uploadResults.filter(result => !result.success);
        
        if (failedUploads.length > 0) {
          console.error('Some uploads failed:', failedUploads);
          const failedFileNames = failedUploads.map(f => f.fileName).join(', ');
          throw new Error(`Failed to upload: ${failedFileNames}`);
        }

        console.log('All media files uploaded successfully');
      }

      // Tags feature temporarily disabled due to missing database tables

      // Dispatch success event
      window.dispatchEvent(new CustomEvent('postCompleted', {
        detail: { 
          optimisticId: null,
          realPost: postData 
        }
      }));

      onSuccess?.();
      
    } catch (error) {
      console.error('Error submitting post:', error);
      onError?.();
      
      let errorMessage = "Failed to create post. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('Failed to upload')) {
          errorMessage = `Upload failed: ${error.message}`;
        } else if (error.message.includes('Network')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('size')) {
          errorMessage = "File too large. Please try with smaller files.";
        }
      }
      
      toast.error("Couldn't post", { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitPost,
    isSubmitting
  };
};
