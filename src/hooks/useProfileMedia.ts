import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  thumbnail_url?: string;
  created_at: string;
}

export const useProfileMedia = (userId: string) => {
  const [mediaItems, setMediaItems] = useState<ProfileMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useIsMobile();

  const fetchMedia = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profile_media')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setMediaItems(data || []);
    } catch (error) {
      console.error('Error fetching profile media:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [userId]);

  // Get the current active media item
  const currentMedia = mediaItems[currentIndex] || null;

  // Get the header image/strip for current media (mobile only)
  const getHeaderImageUrl = () => {
    if (!isMobile || !currentMedia) return null;

    if (currentMedia.media_type === 'video') {
      return currentMedia.header_strip_url || null;
    } else {
      return currentMedia.header_extended_url || null;
    }
  };

  // Get the fallback image for header (top portion of current media)
  const getFallbackHeaderUrl = () => {
    if (!currentMedia) return null;
    return currentMedia.media_url;
  };

  // Check if header is ready
  const isHeaderReady = () => {
    if (!isMobile || !currentMedia) return false;
    return currentMedia.header_processing_status === 'success' && 
           (currentMedia.header_extended_url || currentMedia.header_strip_url);
  };

  // Navigation functions
  const nextMedia = () => {
    setCurrentIndex((prev) => 
      prev < mediaItems.length - 1 ? prev + 1 : 0
    );
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => 
      prev > 0 ? prev - 1 : mediaItems.length - 1
    );
  };

  const goToMedia = (index: number) => {
    if (index >= 0 && index < mediaItems.length) {
      setCurrentIndex(index);
    }
  };

  // Background processing for items without headers
  useEffect(() => {
    if (!isMobile) return;
    
    const processBackgroundItems = async () => {
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
              mediaId: item.id,
              mediaUrl: item.media_url,
              headerHeightPx: 200,
              dpr: window.devicePixelRatio || 1
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
                method: data.method || 'ai'
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
      fetchMedia();
    };

    if (mediaItems.length > 0) {
      processBackgroundItems();
    }
  }, [mediaItems.length, isMobile]);

  return {
    mediaItems,
    currentMedia,
    currentIndex,
    loading,
    headerImageUrl: getHeaderImageUrl(),
    fallbackHeaderUrl: getFallbackHeaderUrl(),
    isHeaderReady: isHeaderReady(),
    nextMedia,
    prevMedia,
    goToMedia,
    refreshMedia: fetchMedia,
    hasMedia: mediaItems.length > 0
  };
};