import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useR2Upload } from '@/hooks/useR2Upload';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProfileMediaItem {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  display_order: number;
  header_processing_status: 'pending' | 'processing' | 'success' | 'error';
  header_extended_url?: string;
  header_strip_url?: string;
  header_metadata?: any;
}

interface HeaderExtensionResult {
  success: boolean;
  extendedImage?: string;
  error?: string;
  metadata?: any;
  method?: 'ai' | 'fallback';
}

export const useProfileMediaUpload = (userId: string, onUpdate: () => void) => {
  const [uploading, setUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { uploadImage } = useR2Upload();
  const { uploadVideo } = useCloudflareStream();
  const isMobile = useIsMobile();

  // Process header extension for media item
  const processHeaderExtension = useCallback(async (
    mediaId: string, 
    mediaUrl: string, 
    mediaType: 'image' | 'video'
  ) => {
    // Only process on mobile devices
    if (!isMobile) {
      console.log('Header extension skipped - desktop view');
      return;
    }

    try {
      console.log(`🚀 Starting header extension for ${mediaType} ${mediaId}`);
      setProcessingStatus(prev => ({ ...prev, [mediaId]: 'processing' }));

      // Update status in database
      await supabase
        .from('profile_media')
        .update({ header_processing_status: 'processing' })
        .eq('id', mediaId);

      const headerHeightPx = 200; // Standard header height
      const dpr = window.devicePixelRatio || 1;

      // For videos, extract first frame to create strip
      let processUrl = mediaUrl;
      if (mediaType === 'video') {
        // For now, use thumbnail URL if available
        const { data: mediaData } = await supabase
          .from('profile_media')
          .select('thumbnail_url')
          .eq('id', mediaId)
          .single();
        
        if (mediaData?.thumbnail_url) {
          processUrl = mediaData.thumbnail_url;
        }
      }

      // Call extend-header function
      const { data, error } = await supabase.functions.invoke('extend-header', {
        body: {
          mediaId,
          mediaUrl: processUrl,
          headerHeightPx,
          dpr
        }
      });

      if (error) throw error;

      const result: HeaderExtensionResult = data;

      if (result.success && result.extendedImage) {
        // Save successful result
        const updateData = {
          header_processing_status: 'success' as const,
          [mediaType === 'video' ? 'header_strip_url' : 'header_extended_url']: result.extendedImage,
          header_metadata: {
            sourceHash: btoa(mediaUrl.slice(-20)),
            headerHeightPx,
            generatedAt: new Date().toISOString(),
            method: result.method || 'ai'
          }
        };

        await supabase
          .from('profile_media')
          .update(updateData)
          .eq('id', mediaId);

        setProcessingStatus(prev => ({ ...prev, [mediaId]: 'success' }));
        
        toast({
          title: "✨ Header Enhanced",
          description: "Your media header has been automatically enhanced",
        });
      } else {
        throw new Error(result.error || 'Header extension failed');
      }
    } catch (error) {
      console.error('Header extension error:', error);
      
      // Save error status and generate fallback
      await supabase
        .from('profile_media')
        .update({
          header_processing_status: 'error',
          header_metadata: {
            method: 'fallback',
            error: error instanceof Error ? error.message : 'Unknown error',
            generatedAt: new Date().toISOString()
          }
        })
        .eq('id', mediaId);

      setProcessingStatus(prev => ({ ...prev, [mediaId]: 'error' }));
    }
  }, [isMobile, toast]);

  // Upload and process media
  const uploadMedia = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    setUploading(true);
    const uploadResults: ProfileMediaItem[] = [];

    try {
      // Check current media count
      const { data: existingMedia, error: countError } = await supabase
        .from('profile_media')
        .select('id')
        .eq('user_id', userId);

      if (countError) throw countError;

      const currentCount = existingMedia?.length || 0;
      const availableSlots = Math.max(0, 5 - currentCount);
      const filesToUpload = files.slice(0, availableSlots);

      if (files.length > availableSlots) {
        toast({
          title: "Upload Limited",
          description: `Only ${availableSlots} more media items allowed (5 max total)`,
          variant: "destructive"
        });
      }

      for (const file of filesToUpload) {
        const isVideo = file.type.startsWith('video/');
        let mediaUrl: string;
        let thumbnailUrl: string | undefined;

        if (isVideo) {
          const result = await uploadVideo(file);
          if (!result.success) {
            throw new Error(result.error || 'Video upload failed');
          }
          mediaUrl = result.videoUrl!;
          thumbnailUrl = result.thumbnailUrl;
        } else {
          const result = await uploadImage(file);
          if (!result.success) {
            throw new Error(result.error || 'Image upload failed');
          }
          mediaUrl = result.imageUrl!;
        }

        // Get next display order
        const { data: lastMedia } = await supabase
          .from('profile_media')
          .select('display_order')
          .eq('user_id', userId)
          .order('display_order', { ascending: false })
          .limit(1);

        const nextOrder = (lastMedia?.[0]?.display_order || 0) + 1;

        // Insert media record
        const { data: insertedMedia, error: insertError } = await supabase
          .from('profile_media')
          .insert({
            user_id: userId,
            media_url: mediaUrl,
            media_type: isVideo ? 'video' : 'image',
            display_order: nextOrder,
            thumbnail_url: thumbnailUrl,
            file_name: file.name,
            file_size: file.size,
            header_processing_status: 'pending'
          })
          .select()
          .single();

        if (insertError) throw insertError;

        uploadResults.push(insertedMedia);

        // Start header processing in background (don't await)
        processHeaderExtension(
          insertedMedia.id, 
          mediaUrl, 
          isVideo ? 'video' : 'image'
        ).catch(console.error);
      }

      toast({
        title: "✅ Media Uploaded",
        description: `${uploadResults.length} item(s) uploaded successfully`,
      });

      onUpdate();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [userId, uploadImage, uploadVideo, processHeaderExtension, toast, onUpdate]);

  // Reprocess header for existing media
  const reprocessHeader = useCallback(async (mediaId: string, mediaUrl: string, mediaType: 'image' | 'video') => {
    if (!isMobile) {
      toast({
        title: "Desktop View",
        description: "Header extension is only available on mobile devices",
        variant: "default"
      });
      return;
    }

    await processHeaderExtension(mediaId, mediaUrl, mediaType);
  }, [processHeaderExtension, isMobile, toast]);

  return {
    uploadMedia,
    uploading,
    processingStatus,
    reprocessHeader
  };
};