import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVideoCompression } from './useVideoCompression';
import { useChunkedUpload } from './useChunkedUpload';

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
  const { shouldCompress, triggerCompression } = useVideoCompression();
  const { uploadFileInChunks } = useChunkedUpload();
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());

  const startBackgroundUpload = useCallback(async ({
    postId,
    mediaFiles,
    userId
  }: BackgroundUploadData) => {
    console.log(`Starting background upload for post ${postId} with ${mediaFiles.length} files`);
    
    // Validate inputs
    if (!postId || !userId || !mediaFiles || mediaFiles.length === 0) {
      console.error('Invalid parameters for background upload:', { postId, userId, mediaFilesCount: mediaFiles?.length });
      throw new Error('Invalid upload parameters');
    }

    // Log file details
    mediaFiles.forEach((file, index) => {
      console.log(`File ${index + 1}:`, {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      });
    });
    
    // Initialize upload progress
    setUploads(prev => new Map(prev.set(postId, {
      postId,
      status: 'uploading',
      uploadedFiles: 0,
      totalFiles: mediaFiles.length,
      failedFiles: []
    })));

    if (mediaFiles.length === 0) {
      console.warn('No media files to upload');
      return;
    }

    // Process uploads sequentially to avoid overwhelming mobile connections
    const uploadResults = [];
    
    for (let index = 0; index < mediaFiles.length; index++) {
      const file = mediaFiles[index];
      
      try {
        const fileName = `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 15)}`;
        const fileExtension = file.name.split('.').pop() || 'unknown';
        const fullFileName = `${fileName}.${fileExtension}`;
        
        console.log(`Background uploading ${index + 1}/${mediaFiles.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        let publicUrl = '';
        
        // Use chunked upload for large files (>40MB) or if regular upload fails
        if (file.size > 40 * 1024 * 1024) {
          console.log(`Using chunked upload for large file: ${file.name}`);
          try {
            const result = await uploadFileInChunks(file);
            publicUrl = result.publicUrl;
            console.log(`Successfully uploaded ${file.name} via chunked upload to:`, publicUrl);
          } catch (error) {
            console.error(`Chunked upload failed for ${file.name}:`, error);
            throw error;
          }
        } else {
          // Use regular upload for smaller files with retry logic
          let uploadAttempts = 0;
          const maxAttempts = 3;
          let uploadSuccess = false;
          
          while (uploadAttempts < maxAttempts && !uploadSuccess) {
            uploadAttempts++;
            console.log(`Upload attempt ${uploadAttempts}/${maxAttempts} for ${file.name}`);
            
            try {
              const { data, error: uploadError } = await supabase.storage
                .from('post-media')
                .upload(`${userId}/${fullFileName}`, file, {
                  upsert: false
                });

              if (uploadError) {
                console.error(`Upload attempt ${uploadAttempts} failed for ${file.name}:`, uploadError);
                if (uploadAttempts === maxAttempts) {
                  // If regular upload fails, try chunked upload as fallback
                  console.log(`Falling back to chunked upload for ${file.name}`);
                  const result = await uploadFileInChunks(file);
                  publicUrl = result.publicUrl;
                  uploadSuccess = true;
                  break;
                }
                
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, uploadAttempts * 1000));
                continue;
              }

              // Get public URL
              const { data: { publicUrl: url } } = supabase.storage
                .from('post-media')
                .getPublicUrl(`${userId}/${fullFileName}`);
                
              publicUrl = url;
              uploadSuccess = true;
              console.log(`Successfully uploaded ${file.name} to:`, publicUrl);

            } catch (error) {
              console.error(`Upload attempt ${uploadAttempts} exception for ${file.name}:`, error);
              if (uploadAttempts === maxAttempts) {
                // If regular upload fails, try chunked upload as fallback
                console.log(`Falling back to chunked upload for ${file.name}`);
                const result = await uploadFileInChunks(file);
                publicUrl = result.publicUrl;
                uploadSuccess = true;
                break;
              }
              await new Promise(resolve => setTimeout(resolve, uploadAttempts * 1000));
            }
          }
        }

        // Create media record
        const { data: mediaData, error: mediaError } = await supabase
          .from('post_media')
          .insert({
            post_id: postId,
            media_type: file.type.startsWith('image/') ? 'image' : 'video',
            media_url: publicUrl
          })
          .select()
          .single();

        if (mediaError) {
          console.error(`Media record error for ${file.name}:`, mediaError);
          throw mediaError;
        }

        // Check if video needs compression
        if (shouldCompress(file)) {
          console.log(`Video ${file.name} needs compression (${(file.size / 1024 / 1024).toFixed(2)}MB > 40MB)`);
          
          // Trigger compression in background
          const compressionResult = await triggerCompression(
            `${userId}/${fullFileName}`,
            postId,
            mediaData.id,
            file.size
          );
          
          if (compressionResult.success) {
            console.log(`Compression triggered for ${file.name}`);
          } else {
            console.warn(`Failed to trigger compression for ${file.name}:`, compressionResult.error);
          }
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

        console.log(`Successfully uploaded ${file.name} in background (${index + 1}/${mediaFiles.length})`);
        uploadResults.push({ status: 'fulfilled', value: { success: true, fileName: file.name } });
        
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
        
        uploadResults.push({ status: 'rejected', reason: error });
      }
    }

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