import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateFiles } from '@/components/posts/utils/fileValidation';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';

interface PostSubmissionData {
  user: any;
  content: string;
  mediaFiles: File[];
  selectedTags: any[];
  courseInfo?: {
    id: string;
    name: string;
    country: string;
  } | null;
  onSuccess?: () => void;
  onError?: () => void;
}

export const usePostSubmission = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPost = async ({
    user,
    content,
    mediaFiles,
    selectedTags,
    courseInfo,
    onSuccess,
    onError
  }: PostSubmissionData) => {
    setIsSubmitting(true);

    try {
      // Validate files first
      const validation = validateFiles(mediaFiles);
      if (!validation.isValid) {
        toast({
          title: "Upload Error",
          description: validation.error,
          variant: "destructive"
        });
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
          content: content || null
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
            
            // For videos, try Cloudflare Stream first, then fallback to R2
            if (file.type.startsWith('video/')) {
              try {
                // Create FormData for Cloudflare Stream upload
                const formData = new FormData();
                formData.append('file', file);
                formData.append('metadata', JSON.stringify({
                  title: `Post video - ${Date.now()}`,
                  description: 'Video uploaded from post'
                }));
                
                const { data: streamData, error: streamError } = await supabase.functions.invoke('cloudflare-stream-upload', {
                  body: formData
                });
                
                if (!streamError && streamData?.success && streamData.videoId) {
                  const hlsUrl = generateStreamHlsUrl(streamData.videoId);
                  
                  console.log(`Successfully uploaded video to Cloudflare Stream: ${hlsUrl}`);
                  
                  // Create media record for video
                  const { error: mediaError } = await supabase
                    .from('post_media')
                    .insert({
                      post_id: postData.id,
                      media_type: 'video',
                      media_url: hlsUrl
                    });

                  if (mediaError) throw mediaError;
                  return { success: true, fileName: file.name };
                }
                console.log('Cloudflare Stream upload failed, trying R2 fallback:', streamError || streamData);
              } catch (streamError) {
                console.log('Cloudflare Stream error, falling back to R2:', streamError);
              }
            }
            
            // Upload to Cloudflare R2 (for images or video fallback)
            const { uploadToCloudflareR2 } = await import('@/utils/cloudflareUpload');
            const uploadResult = await uploadToCloudflareR2(file, 'post-media', fullFileName);

            if (!uploadResult.success || !uploadResult.publicUrl) {
              throw new Error(uploadResult.error || 'Upload failed');
            }

            const publicUrl = uploadResult.publicUrl;

            console.log(`Successfully uploaded ${file.name}, public URL: ${publicUrl}`);

            // Create media record
            const { error: mediaError } = await supabase
              .from('post_media')
              .insert({
                post_id: postData.id,
                media_type: file.type.startsWith('image/') ? 'image' : 'video',
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

        // Wait for all uploads to complete
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
      
      // Provide more specific error messages
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
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitPost,
    isSubmitting
  };
};