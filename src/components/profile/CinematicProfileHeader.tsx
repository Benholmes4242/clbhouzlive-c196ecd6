import React, { useRef, useEffect, useState } from 'react';
import { Play, Upload, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSwipeable } from 'react-swipeable';

interface CinematicProfileHeaderProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  profilePhotoUrl?: string;
  displayName: string;
  isOwnProfile: boolean;
  onPhotoUpload: (file: File) => void;
  uploading?: boolean;
  className?: string;
  hasImmersiveMedia?: boolean;
  onOpenMediaManager?: () => void;
  onPreviewImmersive?: () => void;
  onReopenImmersive?: () => void;
}

const CinematicProfileHeader: React.FC<CinematicProfileHeaderProps> = ({
  videoUrl,
  thumbnailUrl,
  profilePhotoUrl,
  displayName,
  isOwnProfile,
  onPhotoUpload,
  uploading = false,
  className = '',
  hasImmersiveMedia = false,
  onOpenMediaManager,
  onPreviewImmersive,
  onReopenImmersive
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const { toast } = useToast();

  // Sync background video with main video
  const syncVideos = () => {
    const mainVideo = videoRef.current;
    const bgVideo = backgroundVideoRef.current;
    
    if (mainVideo && bgVideo && !mainVideo.paused) {
      const timeDiff = Math.abs(mainVideo.currentTime - bgVideo.currentTime);
      if (timeDiff > 0.1) { // Only sync if difference is significant
        bgVideo.currentTime = mainVideo.currentTime;
      }
    }
  };

  // Auto-play video once when component mounts and video is available
  useEffect(() => {
    const video = videoRef.current;
    const bgVideo = backgroundVideoRef.current;
    if (!video || !videoUrl || hasPlayed) return;

    const handleCanPlayThrough = async () => {
      try {
        video.muted = true;
        video.currentTime = 0;
        await video.play();
        setIsPlaying(true);
        setHasPlayed(true);
        setShowVideo(true);
        
        // Start background video sync
        if (bgVideo) {
          bgVideo.muted = true;
          bgVideo.currentTime = 0;
          try {
            await bgVideo.play();
          } catch (error) {
            console.log('Background video autoplay failed, will sync when loaded');
          }
        }
        
        const syncInterval = setInterval(syncVideos, 100); // Sync every 100ms
        
        const handleTimeUpdate = () => {
          syncVideos(); // Sync on every time update
          const currentTime = video.currentTime;
          const duration = video.duration;
          
          if (profilePhotoUrl && duration && currentTime >= duration - 1 && showVideo) {
            setShowVideo(false);
          }
        };
        
        const handleEnded = () => {
          setIsPlaying(false);
          video.currentTime = 0;
          video.pause();
          
          if (bgVideo) {
            bgVideo.currentTime = 0;
            bgVideo.pause();
          }
          
          if (profilePhotoUrl) {
            setShowVideo(false);
          }
          
          clearInterval(syncInterval);
        };
        
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);
        
        return () => {
          video.removeEventListener('timeupdate', handleTimeUpdate);
          video.removeEventListener('ended', handleEnded);
          clearInterval(syncInterval);
        };
      } catch (error) {
        console.error('Auto-play failed:', error);
        setHasPlayed(true);
      }
    };

    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.load();

    return () => {
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [videoUrl, hasPlayed, profilePhotoUrl]);

  // Remove video upload functionality - profile photos are photo-only now

  const handlePhotoSelect = () => {
    photoInputRef.current?.click();
  };

  // Video upload removed - profile photos are photo-only now

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image file must be less than 10MB.",
        variant: "destructive"
      });
      return;
    }

    onPhotoUpload(file);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const replayVideo = async () => {
    const video = videoRef.current;
    const bgVideo = backgroundVideoRef.current;
    if (video && videoUrl) {
      try {
        video.currentTime = 0;
        video.muted = isMuted;
        
        if (bgVideo) {
          bgVideo.currentTime = 0;
          bgVideo.muted = true;
          try {
            await bgVideo.play();
          } catch (error) {
            console.log('Background video replay failed');
          }
        }
        
        await video.play();
        setIsPlaying(true);
        setShowVideo(true);
      } catch (error) {
        console.error('Replay failed:', error);
      }
    }
  };

  const handleClick = () => {
    if ((!isOwnProfile && hasPlayed && !isPlaying) || (!showVideo && profilePhotoUrl)) {
      replayVideo();
    }
  };

  const hasMedia = videoUrl || profilePhotoUrl;


  // Test with a fallback image if no media is available
  const fallbackImage = '/lovable-uploads/c61119e7-5f19-471e-85a9-5de43d1a45a0.png';
  const actualPhotoUrl = profilePhotoUrl || fallbackImage;

  const isMobile = window.innerWidth < 768;

  // Swipe handlers for reopening immersive mode
  const swipeHandlers = useSwipeable({
    onSwipedDown: () => {
      if (hasImmersiveMedia && !isOwnProfile) {
        onReopenImmersive?.();
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false,
    delta: 50
  });

  return (
     <div 
       className={`relative w-full overflow-hidden ${className}`} 
        style={{ 
          marginTop: '-8rem', // Reduced margin to give more space at top
          height: window.innerWidth < 768 ? '80vh' : '65vh', // Mobile: 80vh, Desktop: 65vh
          minHeight: window.innerWidth < 768 ? '650px' : '600px', // Increased min-height for mobile
          maxHeight: '800px',
          paddingTop: '8rem' // Add padding to push content down
        }}
       {...swipeHandlers}
     >

      {/* Dynamic Blurred Background - Matches Media Card */}
      <div className="absolute inset-0 z-0">
        {/* Mobile: Smooth transitioning background blur */}
        {isMobile && (
          <>
            {/* Video thumbnail background */}
            <div
              className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out ${
                showVideo && videoUrl ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url(${thumbnailUrl || videoUrl})`,
                filter: 'blur(20px) saturate(1.2)',
                transform: 'scale(1.1)',
              }}
            />
            {/* Photo background */}
            <div
              className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out ${
                !showVideo || !videoUrl ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url(${actualPhotoUrl})`,
                filter: 'blur(20px) saturate(1.2)',
                transform: 'scale(1.1)',
              }}
            />
          </>
        )}
        
        {/* Desktop: Photo Background with increased blur intensity */}
        {!isMobile && (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${actualPhotoUrl})`,
              filter: 'blur(40px) saturate(1.2)', // Increased blur from 20px to 40px
              transform: 'scale(1.1)', // Prevent blur edge artifacts
            }}
          />
        )}
        
        {/* Gradient overlay for smooth transition to page content */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent via-60% to-white" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />
      </div>

      {/* Central Media */}
      <div className={`relative z-10 w-full h-full flex items-start justify-center ${window.innerWidth < 768 ? 'pt-8' : 'pt-20'}`}>
        {/* Mobile: Taller profile photo that flows under header, Desktop: Circular element */}
        <div 
          className={`group relative overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:scale-105 ${
            window.innerWidth < 768 ? 'w-full mx-0 rounded-lg' : 'clbhouz-squircle'
          }`}
          style={{
            width: window.innerWidth < 768 ? '100%' : '400px',
            height: window.innerWidth < 768 ? '360px' : '400px', // Taller on mobile (was 280px)
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(1.3)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
            ...(window.innerWidth < 768 && { marginTop: '-2rem' }) // Flow under header on mobile
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={handleClick}
        >
          {/* Video removed from profile photos */}
          
          {/* Profile Photo - Now photo-only (no video support) */}
          <img
            ref={photoRef}
            src={actualPhotoUrl}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            alt={`${displayName} profile`}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              console.log('Image failed to load:', actualPhotoUrl);
              e.currentTarget.src = fallbackImage;
            }}
          />
        </div>

      {/* Upload Interface for Empty State */}
      {!hasMedia && isOwnProfile && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-white/80 mb-4">
              {displayName.charAt(0)}
            </div>
            <div className="flex flex-col gap-3 items-center">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handlePhotoSelect}
                  disabled={uploading}
                  className="bg-white/20 backdrop-blur-sm text-white border-white/30"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Profile Photo
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onOpenMediaManager?.()}
                  disabled={uploading}
                  className="bg-white/20 backdrop-blur-sm text-white border-white/30"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Immersive Media
                </Button>
              </div>
              {hasImmersiveMedia && (
                <Button
                  variant="ghost"
                  onClick={() => onPreviewImmersive?.()}
                  className="bg-white/10 backdrop-blur-sm text-white border-white/20"
                >
                  Preview Immersive Mode
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Central Media Controls - Show on hover with stable positioning */}
      {hasMedia && isHovering && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-20"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="flex flex-col gap-4 items-center">
            {/* Play button removed - profile photos are photo-only now */}

            {/* Owner Edit Controls - positioned under play button */}
            {isOwnProfile && (
              <div className="flex flex-col gap-3 items-center">
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePhotoSelect();
                    }}
                    disabled={uploading}
                    className="bg-white/15 backdrop-blur-md hover:bg-white/25 text-white rounded-full px-4 py-2 shadow-lg transition-all duration-300 hover:scale-105 border-0"
                    style={{
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 5px 20px rgba(0,0,0,0.2)'
                    }}
                  >
                    <span className="text-xs font-medium">Profile Photo</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenMediaManager?.();
                    }}
                    disabled={uploading}
                    className="bg-white/15 backdrop-blur-md hover:bg-white/25 text-white rounded-full px-4 py-2 shadow-lg transition-all duration-300 hover:scale-105 border-0"
                    style={{
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 5px 20px rgba(0,0,0,0.2)'
                    }}
                  >
                    <span className="text-xs font-medium">Immersive Media</span>
                  </Button>
                </div>
                
                {hasImmersiveMedia && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewImmersive?.();
                    }}
                    className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full px-4 py-2 shadow-lg transition-all duration-300 hover:scale-105 border-0"
                    style={{
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 5px 20px rgba(0,0,0,0.2)'
                    }}
                  >
                    <span className="text-xs font-medium">Preview Immersive Mode</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Hidden File Input - Photo only */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        className="hidden"
      />
      
      {/* Loading Overlay */}
      {uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="text-white font-medium">Uploading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CinematicProfileHeader;