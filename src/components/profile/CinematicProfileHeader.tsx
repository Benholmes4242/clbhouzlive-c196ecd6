import React, { useRef, useEffect, useState } from 'react';
import { Play, Upload, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProfileMediaManager } from '@/hooks/useProfileMediaManager';
import ProfileMediaCarousel from '@/components/profile/ProfileMediaCarousel';
import ProfileMediaUploadModal from '@/components/profile/ProfileMediaUploadModal';

interface CinematicProfileHeaderProps {
  userId: string;
  displayName: string;
  isOwnProfile: boolean;
  className?: string;
}

const CinematicProfileHeader: React.FC<CinematicProfileHeaderProps> = ({
  userId,
  displayName,
  isOwnProfile,
  className = '',
}) => {
  const isMobile = useIsMobile();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  const {
    mediaItems,
    loading,
    currentIndex,
    isUploading,
    getCurrentMedia,
    getHeaderStripUrl,
    getFallbackHeaderUrl,
    isHeaderReady,
    goToSlide,
    hasMedia,
    canAddMore
  } = useProfileMediaManager(userId);

  const currentMedia = getCurrentMedia();
  const headerStripUrl = getHeaderStripUrl();
  const fallbackHeaderUrl = getFallbackHeaderUrl();

  // Generate dynamic background based on current media
  const getBackgroundStyle = () => {
    if (headerStripUrl && isHeaderReady()) {
      return {
        backgroundImage: `url(${headerStripUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    if (fallbackHeaderUrl) {
      return {
        backgroundImage: `url(${fallbackHeaderUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(20px) saturate(1.2)',
        transform: 'scale(1.1)'
      };
    }
    
    return {};
  };


  return (
    <>
      {/* AI Header Extension Background - Fixed at top to be the header background */}
      <div 
        className="fixed top-0 left-0 right-0 z-0 transition-all duration-700 ease-in-out"
        style={{
          height: '8rem',
          ...getBackgroundStyle()
        }}
      >
        {/* Gradient overlay for better text contrast with logo/icons */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-transparent" />
      </div>

      <div className={`relative w-full overflow-hidden ${className}`} 
          style={{ 
            marginTop: '-8rem',
            height: isMobile ? '70vh' : '65vh',
            minHeight: isMobile ? '600px' : '600px',
            maxHeight: '800px',
            paddingTop: isMobile ? '8rem' : '8rem',
            paddingLeft: '0',
            paddingRight: '0'
          }}>

        {/* Content Background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-white/50 via-60% to-white">
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />
        </div>

        {/* Media Carousel */}
        <div className="relative z-10 w-full h-full">
          {isMobile ? (
            // Mobile: Edge-to-edge carousel
            <div 
              className="group fixed z-10"
              style={{
                top: '8rem',
                left: '0',
                right: '0',
                width: '100vw',
                height: '380px',
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(20px) saturate(1.3)',
                borderRadius: '0 0 40px 40px',
              }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {hasMedia ? (
                <ProfileMediaCarousel
                  mediaItems={mediaItems}
                  currentIndex={currentIndex}
                  onIndexChange={goToSlide}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-4xl text-white/80 mb-4">
                      {displayName.charAt(0)}
                    </div>
                    {isOwnProfile && (
                      <Button
                        variant="outline"
                        onClick={() => setShowUploadModal(true)}
                        disabled={isUploading}
                        className="bg-white/20 backdrop-blur-sm text-white border-white/30"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Select Profile Media
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Desktop: Centered squircle container
            <div className="flex items-start justify-center pt-20 h-full">
              <div 
                className="group relative clbhouz-squircle overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:scale-105"
                style={{
                  width: '400px',
                  height: '400px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(20px) saturate(1.3)',
                }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                {hasMedia ? (
                  <ProfileMediaCarousel
                    mediaItems={mediaItems}
                    currentIndex={currentIndex}
                    onIndexChange={goToSlide}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-4xl text-white/80 mb-4">
                        {displayName.charAt(0)}
                      </div>
                      {isOwnProfile && (
                        <Button
                          variant="outline"
                          onClick={() => setShowUploadModal(true)}
                          disabled={isUploading}
                          className="bg-white/20 backdrop-blur-sm text-white border-white/30"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Select Profile Media
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Owner Edit Controls - Show on hover */}
        {hasMedia && isOwnProfile && isHovering && (
          <div 
            className="absolute inset-0 flex items-center justify-center z-20"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setShowUploadModal(true);
              }}
              disabled={isUploading}
              className="bg-white/15 backdrop-blur-md hover:bg-white/25 text-white rounded-full px-4 py-2 transition-all duration-300 hover:scale-105 border-0"
              style={{
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="text-xs font-medium">Manage Media</span>
            </Button>
          </div>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="text-white font-medium">Processing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <ProfileMediaUploadModal
          userId={userId}
          existingMedia={mediaItems}
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onMediaUpdated={() => {
            // Media is already updated through the hook
            setShowUploadModal(false);
          }}
        />
      )}
    </>
  );
};

export default CinematicProfileHeader;