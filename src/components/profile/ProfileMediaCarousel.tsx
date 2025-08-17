import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Upload, Plus, X, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsMobile } from '@/hooks/use-mobile';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { Progress } from '@/components/ui/progress';

interface ProfileMediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  display_order: number;
  header_extended_url?: string;
  header_strip_url?: string;
  header_processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'fallback';
  header_metadata?: any;
  aspect_ratio?: number;
  file_name?: string;
}

interface ProfileMediaCarouselProps {
  userId: string;
  isOwnProfile: boolean;
  onMediaUpdate?: () => void;
  headerHeightPx?: number;
}

const ProfileMediaCarousel: React.FC<ProfileMediaCarouselProps> = ({
  userId,
  isOwnProfile,
  onMediaUpdate,
  headerHeightPx = 200
}) => {
  const [mediaItems, setMediaItems] = useState<ProfileMediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useSupabaseSession();
  const isMobile = useIsMobile();

  // Load media items
  const loadMediaItems = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_media')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMediaItems((data || []) as ProfileMediaItem[]);
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

  useEffect(() => {
    loadMediaItems();
  }, [userId]);

  // Auto-process headers for mobile
  const processHeaderForMobile = async (mediaItem: ProfileMediaItem) => {
    if (!isMobile || mediaItem.header_processing_status !== 'pending') return;

    try {
      console.log(`🚀 Auto-processing header for mobile media: ${mediaItem.id}`);
      
      const { data, error } = await supabase.functions.invoke('process-profile-media-headers', {
        body: {
          mediaId: mediaItem.id,
          mediaUrl: mediaItem.media_url,
          mediaType: mediaItem.media_type,
          headerHeightPx,
          devicePixelRatio: window.devicePixelRatio || 1,
          containerWidth: window.innerWidth,
          isMobile: true
        }
      });

      if (error) {
        console.error('Error processing header:', error);
      } else {
        console.log('Header processing initiated:', data);
        // Reload media to get updated status
        loadMediaItems();
      }
    } catch (error) {
      console.error('Failed to process header:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (!isOwnProfile || !user) return;
    
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

    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
      const file = files[i];
      const fileId = `temp-${Date.now()}-${i}`;
      
      try {
        // Show upload progress
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        // Upload to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `profile_media_${Date.now()}_${i}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-backgrounds')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('profile-backgrounds')
          .getPublicUrl(filePath);

        // Determine media type
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        
        // Calculate aspect ratio (simplified)
        const aspectRatio = mediaType === 'video' ? 16/9 : 4/3; // Default ratios

        // Create database record
        const { data: mediaData, error: dbError } = await supabase
          .from('profile_media')
          .insert({
            user_id: userId,
            media_type: mediaType,
            media_url: urlData.publicUrl,
            thumbnail_url: mediaType === 'video' ? urlData.publicUrl : null,
            display_order: mediaItems.length + i,
            file_name: fileName,
            file_size: file.size,
            aspect_ratio: aspectRatio,
            header_processing_status: 'pending'
          })
          .select()
          .single();

        if (dbError) throw dbError;

        console.log('✅ Media uploaded successfully:', mediaData);

        // Remove from progress tracking
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });

        // Auto-process header for mobile
        if (isMobile && mediaData) {
          processHeaderForMobile(mediaData as ProfileMediaItem);
        }

        toast({
          title: "Media uploaded",
          description: isMobile ? 
            "Media uploaded successfully. Header extension processing..." : 
            "Media uploaded successfully.",
          variant: "default"
        });

      } catch (error) {
        console.error('Upload error:', error);
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });
        
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
      }
    }

    setIsUploading(false);
    loadMediaItems();
    onMediaUpdate?.();
  };

  // Remove media item
  const removeMediaItem = async (mediaId: string) => {
    if (!isOwnProfile) return;

    try {
      const { error } = await supabase
        .from('profile_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      // Adjust current index if needed
      if (currentIndex >= mediaItems.length - 1) {
        setCurrentIndex(Math.max(0, mediaItems.length - 2));
      }

      toast({
        title: "Media removed",
        description: "Media item removed successfully.",
        variant: "default"
      });

      loadMediaItems();
      onMediaUpdate?.();
    } catch (error) {
      console.error('Error removing media:', error);
      toast({
        title: "Error",
        description: "Failed to remove media item.",
        variant: "destructive"
      });
    }
  };

  // Navigate carousel
  const goToPrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : mediaItems.length - 1);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev < mediaItems.length - 1 ? prev + 1 : 0);
  };

  // Get current media item
  const currentMedia = mediaItems[currentIndex];

  // Get header for current media (mobile only)
  const getHeaderImage = () => {
    if (!isMobile || !currentMedia) return null;
    
    return currentMedia.header_extended_url || currentMedia.header_strip_url;
  };

  const getProcessingStatus = () => {
    if (!isMobile || !currentMedia) return null;
    
    switch (currentMedia.header_processing_status) {
      case 'processing':
        return { message: 'Enhancing header...', color: 'text-blue-500' };
      case 'completed':
        return { message: 'Header enhanced ✓', color: 'text-green-500' };
      case 'fallback':
        return { message: 'Header optimized', color: 'text-yellow-500' };
      case 'failed':
        return { message: 'Header processing failed', color: 'text-red-500' };
      default:
        return { message: 'Processing header...', color: 'text-gray-500' };
    }
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-96 bg-gray-100 animate-pulse rounded-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500">Loading media...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Header Extension (Mobile Only) */}
      {isMobile && getHeaderImage() && (
        <div 
          className="w-full bg-cover bg-center bg-no-repeat"
          style={{
            height: `${headerHeightPx}px`,
            backgroundImage: `url(${getHeaderImage()})`,
          }}
        >
          <div className="w-full h-full bg-gradient-to-b from-transparent to-black/20" />
        </div>
      )}

      {/* Main Media Container */}
      <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
        {mediaItems.length === 0 ? (
          // Empty state
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-br from-gray-800 to-gray-900">
            {isOwnProfile ? (
              <>
                <Upload className="w-12 h-12 mb-4 opacity-60" />
                <p className="text-lg mb-2">Add your first media</p>
                <p className="text-sm opacity-75 mb-4">Share photos and videos on your profile</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/10 hover:bg-white/20 border-white/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Media
                </Button>
              </>
            ) : (
              <p className="text-lg opacity-75">No media shared yet</p>
            )}
          </div>
        ) : (
          // Media display
          <>
            {currentMedia.media_type === 'image' ? (
              <img 
                src={currentMedia.media_url}
                alt={`Media ${currentIndex + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <EnhancedVideoPlayer
                src={currentMedia.media_url}
                poster={currentMedia.thumbnail_url}
                className="w-full h-full"
                autoplay={false}
                muted={true}
              />
            )}

            {/* Navigation arrows */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Processing status indicator (Mobile) */}
            {isMobile && getProcessingStatus() && (
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                <span className={getProcessingStatus()?.color}>
                  {getProcessingStatus()?.message}
                </span>
              </div>
            )}

            {/* Media controls (Own profile) */}
            {isOwnProfile && (
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeMediaItem(currentMedia.id)}
                  className="bg-black/50 hover:bg-black/70 border-white/20 text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Upload progress overlay */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="mb-4">Uploading media...</div>
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="mb-2">
                  <Progress value={progress} className="w-64" />
                  <div className="text-sm mt-1">{Math.round(progress)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dots indicator */}
      {mediaItems.length > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {mediaItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Add media button (Own profile) */}
      {isOwnProfile && mediaItems.length < 5 && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Media ({mediaItems.length}/5)
          </Button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );
};

export default ProfileMediaCarousel;