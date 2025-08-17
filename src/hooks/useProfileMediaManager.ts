import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

export interface ProfileMediaItem {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  display_order: number;
  file_name?: string;
  file_size?: number;
  aspect_ratio?: number;
  thumbnail_url?: string;
  duration?: number; // For videos, in seconds
  header_processing_status: 'pending' | 'processing' | 'success' | 'error';
  header_extended_url?: string;
  header_strip_url?: string;
  header_metadata?: {
    sourceHash?: string;
    headerHeightPx?: number;
    generatedAt?: string;
    method?: 'ai' | 'upscale+ai' | 'fallback';
    processingTime?: number;
  };
  created_at: string;
  updated_at: string;
}

export const useProfileMediaManager = (userId: string) => {
  const [mediaItems, setMediaItems] = useState<ProfileMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const isMobile = useIsMobile();

  // Fetch all media items for user
  const fetchMediaItems = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profile_media')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setMediaItems((data || []) as ProfileMediaItem[]);
      
      // If we have items and current index is out of bounds, reset to 0
      if (data && data.length > 0 && currentIndex >= data.length) {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error fetching profile media:', error);
      toast.error('Failed to load media items');
    } finally {
      setLoading(false);
    }
  }, [userId, currentIndex]);

  // Initial load
  useEffect(() => {
    fetchMediaItems();
  }, [fetchMediaItems]);

  // Migration: Convert legacy profile photo/video to media items
  const migrateLegacyMedia = useCallback(async (profile: any) => {
    if (!profile || mediaItems.length > 0) return; // Skip if already have media

    const itemsToCreate: any[] = [];
    let order = 1;

    // Migrate profile photo
    if (profile.profile_photo_url) {
      itemsToCreate.push({
        user_id: userId,
        media_url: profile.profile_photo_url,
        media_type: 'image',
        display_order: order++,
        file_name: 'migrated_profile_photo.jpg',
        header_processing_status: 'pending'
      });
    }

    // Migrate profile video
    if (profile.profile_video_url) {
      itemsToCreate.push({
        user_id: userId,
        media_url: profile.profile_video_url,
        media_type: 'video',
        display_order: order++,
        thumbnail_url: profile.profile_video_thumbnail_url,
        file_name: 'migrated_profile_video.mp4',
        header_processing_status: 'pending'
      });
    }

    if (itemsToCreate.length > 0) {
      try {
        const { error } = await supabase
          .from('profile_media')
          .insert(itemsToCreate);

        if (error) throw error;

        console.log(`✅ Migrated ${itemsToCreate.length} legacy media items`);
        await fetchMediaItems();
      } catch (error) {
        console.error('Error migrating legacy media:', error);
      }
    }
  }, [userId, mediaItems.length, fetchMediaItems]);

  // Get current active media item
  const getCurrentMedia = useCallback(() => {
    return mediaItems[currentIndex] || null;
  }, [mediaItems, currentIndex]);

  // Navigation functions
  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => 
      mediaItems.length > 0 ? (prev + 1) % mediaItems.length : 0
    );
  }, [mediaItems.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => 
      mediaItems.length > 0 ? (prev - 1 + mediaItems.length) % mediaItems.length : 0
    );
  }, [mediaItems.length]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < mediaItems.length) {
      setCurrentIndex(index);
    }
  }, [mediaItems.length]);

  // Get header strip URL for current media (mobile vs desktop)
  const getHeaderStripUrl = useCallback(() => {
    const currentMedia = getCurrentMedia();
    if (!currentMedia) return null;

    // Use extended URL for images, strip URL for videos
    const stripUrl = currentMedia.media_type === 'video' 
      ? currentMedia.header_strip_url 
      : currentMedia.header_extended_url;

    return stripUrl || null;
  }, [getCurrentMedia]);

  // Get fallback header URL (for when AI strip isn't ready)
  const getFallbackHeaderUrl = useCallback(() => {
    const currentMedia = getCurrentMedia();
    if (!currentMedia) return null;

    // Use thumbnail for videos, direct URL for images
    return currentMedia.media_type === 'video' 
      ? (currentMedia.thumbnail_url || currentMedia.media_url)
      : currentMedia.media_url;
  }, [getCurrentMedia]);

  // Check if header strip is ready
  const isHeaderReady = useCallback(() => {
    const currentMedia = getCurrentMedia();
    if (!currentMedia) return false;

    return currentMedia.header_processing_status === 'success' && 
           (currentMedia.header_extended_url || currentMedia.header_strip_url);
  }, [getCurrentMedia]);

  // Reorder media items
  const reorderMediaItems = useCallback(async (newOrder: ProfileMediaItem[]) => {
    const updates = newOrder.map((item, index) => ({
      id: item.id,
      display_order: index + 1
    }));

    try {
      for (const update of updates) {
        const { error } = await supabase
          .from('profile_media')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      // Update local state
      setMediaItems(newOrder.map((item, index) => ({
        ...item,
        display_order: index + 1
      })));

      toast.success('Media order updated');
    } catch (error) {
      console.error('Error reordering media:', error);
      toast.error('Failed to update order');
    }
  }, []);

  // Delete media item
  const deleteMediaItem = useCallback(async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('profile_media')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Update current index if needed
      const deletedIndex = mediaItems.findIndex(item => item.id === itemId);
      if (deletedIndex === currentIndex && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (deletedIndex < currentIndex) {
        setCurrentIndex(prev => prev - 1);
      }

      await fetchMediaItems();
      toast.success('Media item deleted');
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Failed to delete media');
    }
  }, [mediaItems, currentIndex, fetchMediaItems]);

  // Background processing for unprocessed headers
  useEffect(() => {
    if (!isMobile || mediaItems.length === 0) return;

    const processUnprocessedItems = async () => {
      const unprocessedItems = mediaItems.filter(item => 
        item.header_processing_status === 'pending' ||
        item.header_processing_status === 'error'
      );

      for (const item of unprocessedItems) {
        try {
          // Update status to processing
          await supabase
            .from('profile_media')
            .update({ header_processing_status: 'processing' })
            .eq('id', item.id);

          // Call the header extension function
          const { data, error } = await supabase.functions.invoke('extend-header', {
            body: {
              imageBase64: await urlToBase64(item.media_url),
              extensionHeight: 200,
              devicePixelRatio: window.devicePixelRatio || 1,
              containerWidth: isMobile ? 390 : 1200,
              prompt: "Extend the background upwards to match the existing scene. Seamless continuation for profile header."
            }
          });

          if (error) throw error;

          if (data?.success && data?.extendedImage) {
            // Update with success
            const updateData = {
              header_processing_status: 'success' as const,
              [item.media_type === 'video' ? 'header_strip_url' : 'header_extended_url']: data.extendedImage,
              header_metadata: {
                sourceHash: btoa(item.media_url.slice(-20)),
                headerHeightPx: 200,
                generatedAt: new Date().toISOString(),
                method: data.method || 'ai',
                processingTime: data.processingTime || 0
              }
            };

            await supabase
              .from('profile_media')
              .update(updateData)
              .eq('id', item.id);
          } else {
            throw new Error(data?.error || 'Processing failed');
          }
        } catch (error) {
          console.error(`Background processing failed for ${item.id}:`, error);
          
          // Mark as error and set fallback
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
            .eq('id', item.id);
        }

        // Throttle requests (1 second between items)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Refresh data after processing
      if (unprocessedItems.length > 0) {
        await fetchMediaItems();
      }
    };

    processUnprocessedItems();
  }, [mediaItems, isMobile, fetchMediaItems]);

  return {
    mediaItems,
    loading,
    currentIndex,
    isUploading,
    setIsUploading,
    getCurrentMedia,
    getHeaderStripUrl,
    getFallbackHeaderUrl,
    isHeaderReady,
    nextSlide,
    prevSlide,
    goToSlide,
    reorderMediaItems,
    deleteMediaItem,
    refreshMedia: fetchMediaItems,
    migrateLegacyMedia,
    hasMedia: mediaItems.length > 0,
    canAddMore: mediaItems.length < 5
  };
};

// Helper function to convert URL to base64
async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Failed to fetch image from URL: ${error}`);
  }
}