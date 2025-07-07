import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadProgress {
  postId: string;
  status: 'uploading' | 'completed' | 'failed';
  uploadedFiles: number;
  totalFiles: number;
  failedFiles: string[];
}

interface BackgroundUploadData {
  postId: string;
  mediaFiles: File[];
  userId: string;
}

export const useBackgroundUpload = () => {
  const { toast } = useToast();
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());

  const startBackgroundUpload = useCallback(async ({
    postId,
    mediaFiles,
    userId
  }: BackgroundUploadData) => {
    console.log(`Starting background upload for post ${postId} with ${mediaFiles.length} files`);
    
    // Initialize upload progress
    setUploads(prev => new Map(prev.set(postId, {
      postId,
      status: 'uploading',
      uploadedFiles: 0,
      totalFiles: mediaFiles.length,
      failedFiles: []
    })));

    // Removed redundant toast - center confirmation box is sufficient
    // toast({
    //   title: "Post Created!",
    //   description: `Your moment is now live! ${mediaFiles.length > 0 ? 'Media files are uploading in the background.' : ''}`,
    //   variant: "default"
    // });

    if (mediaFiles.length === 0) return;

    // Process uploads in background
    const uploadResults = await Promise.allSettled(
      mediaFiles.map(async (file, index) => {
        try {
          const fileName = `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 15)}`;
          const fileExtension = file.name.split('.').pop();
          const fullFileName = `${fileName}.${fileExtension}`;
          
          console.log(`Background uploading: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          
          // No timeout - let large files take as long as needed
          const { data, error: uploadError } = await supabase.storage
            .from('post-media')
            .upload(`${userId}/${fullFileName}`, file, {
              upsert: false,
              duplex: 'half'
            });

          if (uploadError) {
            console.error(`Background upload error for ${file.name}:`, uploadError);
            throw uploadError;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('post-media')
            .getPublicUrl(`${userId}/${fullFileName}`);

          // Create media record
          const { error: mediaError } = await supabase
            .from('post_media')
            .insert({
              post_id: postId,
              media_type: file.type.startsWith('image/') ? 'image' : 'video',
              media_url: publicUrl
            });

          if (mediaError) {
            console.error(`Media record error for ${file.name}:`, mediaError);
            throw mediaError;
          }

          // Update progress
          setUploads(prev => {
            const current = prev.get(postId);
            if (current) {
              const updated = {
                ...current,
                uploadedFiles: current.uploadedFiles + 1
              };
              return new Map(prev.set(postId, updated));
            }
            return prev;
          });

          console.log(`Successfully uploaded ${file.name} in background`);
          return { success: true, fileName: file.name };
          
        } catch (error) {
          console.error(`Background upload failed for ${file.name}:`, error);
          
          // Update failed files
          setUploads(prev => {
            const current = prev.get(postId);
            if (current) {
              const updated = {
                ...current,
                failedFiles: [...current.failedFiles, file.name]
              };
              return new Map(prev.set(postId, updated));
            }
            return prev;
          });
          
          return { success: false, fileName: file.name, error };
        }
      })
    );

    // Final status update
    const failedUploads = uploadResults.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && !result.value.success)
    );

    setUploads(prev => {
      const current = prev.get(postId);
      if (current) {
        const updated = {
          ...current,
          status: (failedUploads.length === 0 ? 'completed' : 'failed') as 'uploading' | 'completed' | 'failed'
        };
        return new Map(prev.set(postId, updated));
      }
      return prev;
    });

    // Completion notifications removed - black center confirmation is sufficient
    // Only show error notifications if uploads fail completely
    if (failedUploads.length === mediaFiles.length) {
      toast({
        title: "Upload Failed",
        description: "Some files couldn't be uploaded. Your post is still live without media.",
        variant: "destructive"
      });
    }

    console.log(`Background upload completed for post ${postId}`);
  }, [toast]);

  return {
    startBackgroundUpload,
    uploads: Array.from(uploads.values())
  };
};