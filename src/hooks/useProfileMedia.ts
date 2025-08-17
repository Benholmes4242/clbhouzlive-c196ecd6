import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useToast } from '@/hooks/use-toast';

interface ProfileMediaItem {
  id: string;
  user_id: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  display_order: number;
  header_extended_url?: string;
  header_strip_url?: string;
  header_processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'fallback';
  header_metadata?: any;
  header_processing_error?: string;
  file_name?: string;
  file_size?: number;
  aspect_ratio?: number;
  created_at: string;
  updated_at: string;
}

interface UseProfileMediaProps {
  userId: string;
  autoProcess?: boolean;
  headerHeightPx?: number;
}

interface UseProfileMediaReturn {
  mediaItems: ProfileMediaItem[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  isLoading: boolean;
  isUploading: boolean;
  uploadMedia: (files: FileList) => Promise<void>;
  removeMedia: (mediaId: string) => Promise<void>;
  reorderMedia: (fromIndex: number, toIndex: number) => Promise<void>;
  refreshMedia: () => Promise<void>;
  getCurrentMedia: () => ProfileMediaItem | null;
  getHeaderForCurrentMedia: () => string | null;
  processHeaderForMedia: (mediaId: string, force?: boolean) => Promise<void>;
  telemetry: {
    totalUploads: number;
    aiProcessingCount: number;
    fallbackCount: number;
    averageProcessingTime: number;
  };
}

export const useProfileMedia = ({ 
  userId, 
  autoProcess = true, 
  headerHeightPx = 200 
}: UseProfileMediaProps): UseProfileMediaReturn => {
  const [mediaItems, setMediaItems] = useState<ProfileMediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [telemetry, setTelemetry] = useState({
    totalUploads: 0,
    aiProcessingCount: 0,
    fallbackCount: 0,
    averageProcessingTime: 0
  });
  
  const { user } = useSupabaseSession();
  const { toast } = useToast();

  // Load media items from database
  const loadMediaItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profile_media')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      setMediaItems((data || []) as ProfileMediaItem[]);
      
      // Adjust current index if it's out of bounds
      setCurrentIndex(prev => {
        if (!data || data.length === 0) return 0;
        return Math.min(prev, data.length - 1);
      });

    } catch (error) {
      console.error('Error loading profile media:', error);
      toast({
        title: "Error loading media",
        description: "Failed to load profile media items.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-process headers for new media
  const processHeaderForMedia = async (mediaId: string, force = false) => {
    const isMobile = window.innerWidth < 768; // Simple mobile detection
    
    if (!isMobile && !force) {
      console.log('📱 Desktop view - skipping header processing');
      return;
    }

    try {
      const mediaItem = mediaItems.find(item => item.id === mediaId);
      if (!mediaItem) return;

      if (!force && mediaItem.header_processing_status !== 'pending') {
        console.log(`📋 Media ${mediaId} already processed (${mediaItem.header_processing_status})`);
        return;
      }

      console.log(`🚀 Processing header for media: ${mediaId}`);
      
      // Update status to processing
      await supabase
        .from('profile_media')
        .update({ header_processing_status: 'processing' })
        .eq('id', mediaId);

      const startTime = Date.now();

      const { data, error } = await supabase.functions.invoke('process-profile-media-headers', {
        body: {
          mediaId,
          mediaUrl: mediaItem.media_url,
          mediaType: mediaItem.media_type,
          headerHeightPx,
          devicePixelRatio: window.devicePixelRatio || 1,
          containerWidth: window.innerWidth,
          isMobile
        }
      });

      const processingTime = Date.now() - startTime;

      if (error) {
        console.error('Error processing header:', error);
        throw error;
      }

      console.log('✅ Header processing result:', data);

      // Update telemetry
      setTelemetry(prev => ({
        ...prev,
        aiProcessingCount: data?.processingMethod === 'ai' ? prev.aiProcessingCount + 1 : prev.aiProcessingCount,
        fallbackCount: data?.processingMethod === 'fallback' ? prev.fallbackCount + 1 : prev.fallbackCount,
        averageProcessingTime: (prev.averageProcessingTime + processingTime) / 2
      }));

      // Refresh media to get updated status
      loadMediaItems();

    } catch (error) {
      console.error('Failed to process header:', error);
      
      // Update status to failed
      await supabase
        .from('profile_media')
        .update({ 
          header_processing_status: 'failed',
          header_processing_error: error.message 
        })
        .eq('id', mediaId);
    }
  };

  // Upload new media files
  const uploadMedia = async (files: FileList) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload media.",
        variant: "destructive"
      });
      return;
    }

    const maxFiles = 5 - mediaItems.length;
    if (files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload ${maxFiles} more media items (maximum 5 total).`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).slice(0, maxFiles).map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `profile_media_${Date.now()}_${index}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('profile-backgrounds')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('profile-backgrounds')
          .getPublicUrl(filePath);

        // Determine media type and calculate aspect ratio
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        const aspectRatio = mediaType === 'video' ? 16/9 : 4/3; // Default ratios

        // Create database record
        const { data: mediaData, error: dbError } = await supabase
          .from('profile_media')
          .insert({
            user_id: userId,
            media_type: mediaType,
            media_url: urlData.publicUrl,
            thumbnail_url: mediaType === 'video' ? urlData.publicUrl : null,
            display_order: mediaItems.length + index,
            file_name: fileName,
            file_size: file.size,
            aspect_ratio: aspectRatio,
            header_processing_status: 'pending'
          })
          .select()
          .single();

        if (dbError) throw dbError;

        return mediaData;
      });

      const uploadedMedia = await Promise.all(uploadPromises);

      // Update telemetry
      setTelemetry(prev => ({
        ...prev,
        totalUploads: prev.totalUploads + uploadedMedia.length
      }));

      toast({
        title: "Media uploaded",
        description: `${uploadedMedia.length} media item(s) uploaded successfully.`,
        variant: "default"
      });

      // Refresh media list
      await loadMediaItems();

      // Auto-process headers if enabled
      if (autoProcess) {
        uploadedMedia.forEach(media => {
          processHeaderForMedia(media.id);
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload media files.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remove media item
  const removeMedia = async (mediaId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profile_media')
        .delete()
        .eq('id', mediaId)
        .eq('user_id', user.id); // Security check

      if (error) throw error;

      toast({
        title: "Media removed",
        description: "Media item removed successfully.",
        variant: "default"
      });

      // Adjust current index if needed
      if (currentIndex >= mediaItems.length - 1) {
        setCurrentIndex(Math.max(0, mediaItems.length - 2));
      }

      loadMediaItems();

    } catch (error) {
      console.error('Error removing media:', error);
      toast({
        title: "Error",
        description: "Failed to remove media item.",
        variant: "destructive"
      });
    }
  };

  // Reorder media items
  const reorderMedia = async (fromIndex: number, toIndex: number) => {
    if (!user || fromIndex === toIndex) return;

    try {
      const reorderedItems = [...mediaItems];
      const [movedItem] = reorderedItems.splice(fromIndex, 1);
      reorderedItems.splice(toIndex, 0, movedItem);

      // Update display_order for all affected items
      const updatePromises = reorderedItems.map((item, index) => 
        supabase
          .from('profile_media')
          .update({ display_order: index })
          .eq('id', item.id)
      );

      await Promise.all(updatePromises);

      setCurrentIndex(toIndex);
      loadMediaItems();

    } catch (error) {
      console.error('Error reordering media:', error);
      toast({
        title: "Error",
        description: "Failed to reorder media items.",
        variant: "destructive"
      });
    }
  };

  // Get current media item
  const getCurrentMedia = (): ProfileMediaItem | null => {
    return mediaItems[currentIndex] || null;
  };

  // Get header for current media (mobile only)
  const getHeaderForCurrentMedia = (): string | null => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return null;

    const currentMedia = getCurrentMedia();
    if (!currentMedia) return null;

    return currentMedia.header_extended_url || currentMedia.header_strip_url || null;
  };

  // Initialize on mount
  useEffect(() => {
    loadMediaItems();
  }, [userId]);

  // Set up real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('profile-media-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_media',
          filter: `user_id=eq.${userId}`
        },
        () => {
          console.log('📡 Real-time update received, refreshing media');
          loadMediaItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    mediaItems,
    currentIndex,
    setCurrentIndex,
    isLoading,
    isUploading,
    uploadMedia,
    removeMedia,
    reorderMedia,
    refreshMedia: loadMediaItems,
    getCurrentMedia,
    getHeaderForCurrentMedia,
    processHeaderForMedia,
    telemetry
  };
};