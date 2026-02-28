import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useVideoCompression } from './useVideoCompression';
import { useChunkedUpload } from './useChunkedUpload';
import { useCloudflareStream } from './useCloudflareStream';
import { useCloudflareR2 } from './useCloudflareR2';

interface UploadProgress {
  postId: string;
  status: 'uploading' | 'completed' | 'failed';
  uploadedFiles: number;
  totalFiles: number;
  failedFiles: string[];
}

interface StudioEditsPayload {
  filter?: string;
  crop?: { ratio: string };
  rotate?: number;
  contrast?: number;
  brightness?: number;
  textOverlays?: any[];
  music?: any;
  audioMode?: string;
}

interface BackgroundUploadData {
  postId: string;
  mediaFiles: File[];
  userId: string;
  studioEditsByIndex?: (StudioEditsPayload | null)[];
}

export const useBackgroundUpload = () => {
  
  const { shouldCompress, triggerCompression } = useVideoCompression();
  const { uploadFileInChunks } = useChunkedUpload();
  const cloudflareStream = useCloudflareStream();
  const { uploadToR2 } = useCloudflareR2();
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());

  const startBackgroundUpload = useCallback(async ({
    postId,
    mediaFiles,
    userId,
    studioEditsByIndex
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
        let mediaType = file.type.startsWith('image/') ? 'image' : 'video';
        
        // Use Cloudflare Stream for video files
        if (file.type.startsWith('video/')) {
          console.log(`Uploading video to Cloudflare Stream: ${file.name}`);
          const streamResult = await cloudflareStream.uploadVideo(file);
          
          if (streamResult.success && streamResult.videoUrl) {
            publicUrl = streamResult.videoUrl;
            console.log(`Successfully uploaded ${file.name} to Cloudflare Stream:`, publicUrl);
          } else {
            console.error(`Cloudflare Stream upload failed for ${file.name}:`, streamResult.error);
            throw new Error(streamResult.error || 'Cloudflare Stream upload failed - no fallback for videos');
          }
        }
        // Use Cloudflare R2 for image files
        else if (mediaType === 'image') {
          console.log(`Uploading image to Cloudflare R2: ${file.name}`);
          try {
            const r2Result = await uploadToR2(file, `post-media/${fullFileName}`);
            
            if (r2Result.success && r2Result.url) {
              publicUrl = r2Result.url;
              console.log(`Successfully uploaded ${file.name} to Cloudflare R2:`, publicUrl);
            } else {
              console.error(`Cloudflare R2 upload failed for ${file.name}:`, r2Result.error);
              throw new Error(r2Result.error || 'Cloudflare R2 upload failed');
            }
          } catch (error) {
            console.error(`Cloudflare R2 upload failed for ${file.name}:`, error);
            // For now, let's fail completely rather than fallback to Supabase
            throw error;
          }
        }
        // Use chunked upload for large files (>20MB) or as fallback
        else if (file.size > 20 * 1024 * 1024) {
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
              // Upload to Cloudflare R2 instead of Supabase storage
              const { uploadToCloudflareR2 } = await import('@/utils/cloudflareUpload');
              const uploadResult = await uploadToCloudflareR2(file, 'clbhouz-post-images', fullFileName);

              if (!uploadResult.success || !uploadResult.publicUrl) {
                console.error(`Upload attempt ${uploadAttempts} failed for ${file.name}:`, uploadResult.error);
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

              publicUrl = uploadResult.publicUrl;
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

        // Create media record with studio edits
        const editsForThisIndex = studioEditsByIndex?.[index] ?? null;
        const filterId = editsForThisIndex?.filter ?? null;
        
        const { data: mediaData, error: mediaError } = await supabase
          .from('post_media')
          .insert([{
            post_id: postId,
            media_type: mediaType,
            media_url: publicUrl,
            display_order: index,
            studio_edits: editsForThisIndex as any,
            filter_id: filterId
          }])
          .select()
          .single();

        if (mediaError) {
          console.error(`Media record error for ${file.name}:`, mediaError);
          throw mediaError;
        }

        // Skip compression for Cloudflare Stream videos (already optimized)
        if (!file.type.startsWith('video/') && shouldCompress(file)) {
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
        } else if (file.type.startsWith('video/')) {
          console.log(`Video ${file.name} uploaded to Cloudflare Stream - no additional compression needed`);
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
      toast.error("Upload Failed", { description: "Some files couldn't be uploaded. Your post is still live without media." });
    }

    console.log(`Background upload completed for post ${postId}`);
  }, [shouldCompress, triggerCompression, uploadFileInChunks, cloudflareStream, uploadToR2]);

  return {
    startBackgroundUpload,
    uploads: Array.from(uploads.values())
  };
};