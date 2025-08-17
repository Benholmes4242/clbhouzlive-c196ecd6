import React, { useState, useEffect } from 'react';
import { Upload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import ProfileMediaCarousel from './ProfileMediaCarousel';
import { useProfileMedia } from '@/hooks/useProfileMedia';

interface EnhancedCinematicProfileHeaderProps {
  userId: string;
  isOwnProfile: boolean;
  displayName: string;
  onMediaUpdate?: () => void;
  className?: string;
}

const EnhancedCinematicProfileHeader: React.FC<EnhancedCinematicProfileHeaderProps> = ({
  userId,
  isOwnProfile,
  displayName,
  onMediaUpdate,
  className = ''
}) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const {
    mediaItems,
    currentIndex,
    setCurrentIndex,
    isLoading,
    isUploading,
    uploadMedia,
    removeMedia,
    getCurrentMedia,
    getHeaderForCurrentMedia,
    telemetry
  } = useProfileMedia({ 
    userId, 
    autoProcess: true, // Enable automatic header processing
    headerHeightPx: 200 
  });

  // Handle media upload
  const handleMediaUpload = async (files: FileList) => {
    try {
      await uploadMedia(files);
      onMediaUpdate?.();
      
      toast({
        title: "Upload started",
        description: isMobile ? 
          "Media uploading... Header extension will begin automatically." :
          "Media uploading...",
        variant: "default"
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // Handle media removal
  const handleMediaRemove = async (mediaId: string) => {
    try {
      await removeMedia(mediaId);
      onMediaUpdate?.();
    } catch (error) {
      console.error('Remove failed:', error);
    }
  };

  const currentMedia = getCurrentMedia();
  const headerImage = getHeaderForCurrentMedia();

  return (
    <div className={`relative w-full ${className}`}>
      {/* Extended Header Background (Mobile Only) */}
      {isMobile && headerImage && (
        <div className="relative w-full">
          {/* Extended header strip */}
          <div 
            className="w-full bg-cover bg-center bg-no-repeat"
            style={{
              height: '200px',
              backgroundImage: `url(${headerImage})`,
            }}
          >
            {/* Gradient overlay for better text contrast */}
            <div className="w-full h-full bg-gradient-to-b from-transparent via-transparent to-black/40" />
          </div>
          
          {/* Processing status indicator */}
          {currentMedia && currentMedia.header_processing_status === 'processing' && (
            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm animate-pulse">
              🤖 Enhancing header...
            </div>
          )}
          
          {currentMedia && currentMedia.header_processing_status === 'completed' && (
            <div className="absolute top-4 left-4 bg-green-500/80 text-white px-3 py-1 rounded-full text-sm">
              ✨ AI Enhanced
            </div>
          )}
          
          {currentMedia && currentMedia.header_processing_status === 'fallback' && (
            <div className="absolute top-4 left-4 bg-blue-500/80 text-white px-3 py-1 rounded-full text-sm">
              🎨 Optimized
            </div>
          )}
        </div>
      )}

      {/* Main Media Carousel */}
      <div className="relative">
        <ProfileMediaCarousel
          userId={userId}
          isOwnProfile={isOwnProfile}
          onMediaUpdate={onMediaUpdate}
          headerHeightPx={200}
        />
      </div>

      {/* Media Upload Instructions (Own Profile) */}
      {isOwnProfile && mediaItems.length === 0 && (
        <div className="mt-6 p-6 bg-muted/50 rounded-lg text-center">
          <div className="max-w-md mx-auto">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Share Your Golf Story</h3>
            <p className="text-muted-foreground mb-4">
              Upload up to 5 photos and videos to showcase your golf journey. 
              {isMobile && " On mobile, we'll automatically create beautiful header extensions for your media."}
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Supported formats: JPG, PNG, MP4, MOV</p>
              <p>• Maximum 5 media items</p>
              {isMobile && <p>• Automatic header enhancement on mobile</p>}
            </div>
          </div>
        </div>
      )}

      {/* Telemetry Debug Info (Development) */}
      {process.env.NODE_ENV === 'development' && telemetry.totalUploads > 0 && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <strong>Debug Telemetry:</strong> Uploads: {telemetry.totalUploads}, 
          AI: {telemetry.aiProcessingCount}, Fallback: {telemetry.fallbackCount}, 
          Avg Time: {Math.round(telemetry.averageProcessingTime)}ms
        </div>
      )}
    </div>
  );
};

export default EnhancedCinematicProfileHeader;