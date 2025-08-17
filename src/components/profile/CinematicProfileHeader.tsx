import React, { useRef, useEffect, useState } from 'react';
import { Play, Upload, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CinematicProfileHeaderProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  profilePhotoUrl?: string;
  displayName: string;
  isOwnProfile: boolean;
  onVideoUpload: (file: File) => void;
  onPhotoUpload: (file: File) => void;
  onVideoRemove: () => void;
  uploading?: boolean;
  className?: string;
}

const CinematicProfileHeader: React.FC<CinematicProfileHeaderProps> = ({
  videoUrl,
  thumbnailUrl,
  profilePhotoUrl,
  displayName,
  isOwnProfile,
  onVideoUpload,
  onPhotoUpload,
  onVideoRemove,
  uploading = false,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const bleedVideoRef = useRef<HTMLVideoElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    const bleedVideo = bleedVideoRef.current;
    
    if (mainVideo && bgVideo && !mainVideo.paused) {
      const timeDiff = Math.abs(mainVideo.currentTime - bgVideo.currentTime);
      if (timeDiff > 0.1) { // Only sync if difference is significant
        bgVideo.currentTime = mainVideo.currentTime;
      }
    }
    
    // Sync bleed video
    if (mainVideo && bleedVideo && !mainVideo.paused) {
      const timeDiff = Math.abs(mainVideo.currentTime - bleedVideo.currentTime);
      if (timeDiff > 0.2) { // Looser sync for bleed (blur hides micro-differences)
        bleedVideo.currentTime = mainVideo.currentTime;
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
        
        // Start bleed video sync
        const bleedVideo = bleedVideoRef.current;
        if (bleedVideo) {
          bleedVideo.muted = true;
          bleedVideo.currentTime = 0;
          try {
            await bleedVideo.play();
          } catch (error) {
            console.log('Bleed video autoplay failed, will sync when loaded');
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
          
          const bleedVideo = bleedVideoRef.current;
          if (bleedVideo) {
            bleedVideo.currentTime = 0;
            bleedVideo.pause();
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

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelect = () => {
    photoInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video file must be less than 100MB.",
        variant: "destructive"
      });
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      if (video.duration > 20) {
        toast({
          title: "Video too long",
          description: "Video must be 20 seconds or less.",
          variant: "destructive"
        });
        return;
      }
      
      onVideoUpload(file);
    };

    video.onerror = () => {
      toast({
        title: "Invalid video",
        description: "Could not read video file.",
        variant: "destructive"
      });
    };

    video.src = URL.createObjectURL(file);
  };

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
    const bleedVideo = bleedVideoRef.current;
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
        
        if (bleedVideo) {
          bleedVideo.currentTime = 0;
          bleedVideo.muted = true;
          try {
            await bleedVideo.play();
          } catch (error) {
            console.log('Bleed video replay failed');
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

  // Debug logging
  console.log('CinematicProfileHeader Debug:', {
    videoUrl,
    profilePhotoUrl,
    hasMedia,
    displayName,
    showVideo,
    thumbnailUrl
  });

  // Test with a fallback image if no media is available
  const fallbackImage = '/lovable-uploads/c61119e7-5f19-471e-85a9-5de43d1a45a0.png';
  const actualPhotoUrl = profilePhotoUrl || fallbackImage;

  const isMobile = window.innerWidth < 768;

  return (
     <div className={`relative w-full overflow-hidden ${className}`} 
         style={{ 
           marginTop: '-8rem',
           height: window.innerWidth < 768 ? '70vh' : '65vh',
           minHeight: window.innerWidth < 768 ? '600px' : '600px',
           maxHeight: '800px',
           paddingTop: window.innerWidth < 768 ? '0' : '8rem', // Remove padding on mobile
           paddingLeft: '0', // Remove any left padding
           paddingRight: '0' // Remove any right padding
         }}>

      {/* Simple gradient background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      {/* Header Bleed Layer - Creates seamless extension behind header */}
      {hasMedia && (
        <div 
          className="absolute top-0 left-0 right-0 z-5 pointer-events-none overflow-hidden"
          style={{
            height: '8rem', // Header height
            marginTop: '-8rem', // Position behind header
          }}
        >
          {/* Video Bleed */}
          {videoUrl && showVideo && (
            <video
              ref={bleedVideoRef}
              src={videoUrl}
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{
                filter: 'blur(15px) saturate(1.2)',
                transform: 'scale(1.05)', // Slight scale to hide blur edges
              }}
              muted
              playsInline
              preload="auto"
              crossOrigin="anonymous"
            />
          )}
          
          {/* Photo Bleed */}
          {(!videoUrl || !showVideo) && (
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-top bg-no-repeat"
              style={{
                backgroundImage: `url(${actualPhotoUrl})`,
                filter: 'blur(15px) saturate(1.2)',
                transform: 'scale(1.05)', // Slight scale to hide blur edges
              }}
            />
          )}
          
          {/* Gradient mask to blend into page */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background opacity-60" />
        </div>
      )}

      {/* Central Circular Media */}
      {window.innerWidth < 768 ? (
        // Mobile: Custom shape - square top, rounded bottom, true edge-to-edge
        <div 
          className="group relative overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:scale-105 fixed z-10"
          style={{
            top: '8rem',
            left: '0',
            right: '0',
            width: '100vw',
            height: '380px',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(1.3)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
            borderRadius: '0 0 40px 40px',
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={handleClick}
        >
          {/* Video Element - Shows first and autoplays */}
          {videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={thumbnailUrl && thumbnailUrl !== videoUrl ? thumbnailUrl : actualPhotoUrl}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out ${
                showVideo ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              playsInline
              muted={isMuted}
              preload="auto"
              crossOrigin="anonymous"
              autoPlay
              onPlay={() => {
                setIsPlaying(true);
                setHasPlayed(true);
              }}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                setIsPlaying(false);
                setShowVideo(false);
              }}
            />
          )}
          
          {/* Profile Photo - Shows when no video or video has ended */}
          <img
            ref={photoRef}
            src={actualPhotoUrl}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            alt={`${displayName} profile`}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out ${
              !showVideo || !videoUrl ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            onError={(e) => {
              console.log('Image failed to load:', actualPhotoUrl);
              e.currentTarget.src = fallbackImage;
            }}
          />
        </div>
      ) : (
        // Desktop: Keep container
        <div className="relative z-10 w-full h-full flex items-start justify-center pt-20">
          <div 
            className="group relative clbhouz-squircle overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:scale-105"
            style={{
              width: '400px',
              height: '400px',
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px) saturate(1.3)',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={handleClick}
          >
            {/* Video Element - Shows first and autoplays */}
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                poster={thumbnailUrl && thumbnailUrl !== videoUrl ? thumbnailUrl : actualPhotoUrl}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out ${
                  showVideo ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
                playsInline
                muted={isMuted}
                preload="auto"
                crossOrigin="anonymous"
                autoPlay
                onPlay={() => {
                  setIsPlaying(true);
                  setHasPlayed(true);
                }}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                  setIsPlaying(false);
                  setShowVideo(false);
                }}
              />
            )}
            
            {/* Profile Photo - Shows when no video or video has ended */}
            <img
              ref={photoRef}
              src={actualPhotoUrl}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              alt={`${displayName} profile`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out ${
                !showVideo || !videoUrl ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              onError={(e) => {
                console.log('Image failed to load:', actualPhotoUrl);
                e.currentTarget.src = fallbackImage;
              }}
            />
          </div>
        </div>
      )}

        {/* Upload Interface for Empty State */}
        {!hasMedia && isOwnProfile && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl text-white/80 mb-4">
                {displayName.charAt(0)}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleFileSelect}
                  disabled={uploading}
                  className="bg-white/20 backdrop-blur-sm text-white border-white/30"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
                <Button
                  variant="secondary"
                  onClick={handlePhotoSelect}
                  disabled={uploading}
                  className="bg-white/20 backdrop-blur-sm text-white border-white/30"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add Photo
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Central Media Controls - Show on hover with stable positioning */}
      {hasMedia && isHovering && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-20"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="flex flex-col gap-4 items-center">
            {/* Play/Replay Button */}
            {((hasPlayed && !isPlaying && showVideo) || (!showVideo && videoUrl)) && (
              <Button
                size="lg"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  replayVideo();
                }}
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full p-5 shadow-2xl transition-all duration-300 hover:scale-110 border-0"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2) inset'
                }}
              >
                <Play className="w-7 h-7 fill-white" />
              </Button>
            )}

            {/* Owner Edit Controls - positioned under play button */}
            {isOwnProfile && (
              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileSelect();
                  }}
                  disabled={uploading}
                  className="bg-white/15 backdrop-blur-md hover:bg-white/25 text-white rounded-full px-4 py-2 shadow-lg transition-all duration-300 hover:scale-105 border-0"
                  style={{
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 5px 20px rgba(0,0,0,0.2)'
                  }}
                >
                  <span className="text-xs font-medium">Change Video</span>
                </Button>
                
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
                  <span className="text-xs font-medium">Change Photo</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
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