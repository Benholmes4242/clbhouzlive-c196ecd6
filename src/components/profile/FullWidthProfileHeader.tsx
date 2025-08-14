import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Upload, Volume2, VolumeX, Edit } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface FullWidthProfileHeaderProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  profilePhotoUrl?: string;
  displayName: string;
  username?: string;
  homeClub?: string;
  isOwnProfile: boolean;
  onVideoUpload?: (file: File) => void;
  onPhotoUpload?: (file: File) => void;
  onVideoRemove?: () => void;
  onEditProfile?: () => void;
  uploading?: boolean;
}

const FullWidthProfileHeader: React.FC<FullWidthProfileHeaderProps> = ({
  videoUrl,
  thumbnailUrl,
  profilePhotoUrl,
  displayName,
  username,
  homeClub,
  isOwnProfile,
  onVideoUpload,
  onPhotoUpload,
  onVideoRemove,
  onEditProfile,
  uploading = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [showVideo, setShowVideo] = useState(!!videoUrl);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showReplayButton, setShowReplayButton] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  const isMobile = useIsMobile();

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Preload static image while video plays
  useEffect(() => {
    if (profilePhotoUrl && showVideo) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = profilePhotoUrl;
    }
  }, [profilePhotoUrl, showVideo]);

  // Video autoplay and end handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl || hasPlayed) return;

    const handleCanPlayThrough = async () => {
      try {
        video.muted = true;
        video.currentTime = 0;
        await video.play();
        setHasPlayed(true);
        setVideoLoaded(true);
      } catch (error) {
        console.log('Video autoplay failed, showing image');
        setShowVideo(false);
      }
    };

    const handleVideoEnd = () => {
      if (profilePhotoUrl && imageLoaded) {
        // Crossfade to photo when video ends
        setTimeout(() => {
          setShowVideo(false);
          setShowReplayButton(true);
        }, reducedMotion ? 0 : 200);
      }
    };

    const handleError = () => {
      console.log('Video error, fallback to image');
      setShowVideo(false);
    };

    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('error', handleError);

    // Timeout fallback
    const timeout = setTimeout(() => {
      if (!videoLoaded) {
        setShowVideo(false);
      }
    }, 1500);

    return () => {
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('error', handleError);
      clearTimeout(timeout);
    };
  }, [videoUrl, hasPlayed, profilePhotoUrl, imageLoaded, videoLoaded, reducedMotion]);

  const handleReplay = async () => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    try {
      setShowReplayButton(false);
      setShowVideo(true);
      video.currentTime = 0;
      await video.play();
    } catch (error) {
      console.log('Replay failed');
      setShowVideo(false);
      setShowReplayButton(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  const handleVideoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUploadClick = () => {
    photoInputRef.current?.click();
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onVideoUpload) {
      onVideoUpload(file);
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoUpload) {
      onPhotoUpload(file);
    }
  };

  // Responsive height classes
  const getHeaderHeight = () => {
    if (isMobile) return 'h-[42vh] min-h-[260px]';
    return 'h-[38vh] max-h-[520px] min-h-[320px]';
  };

  const currentMedia = showVideo && videoUrl ? videoUrl : profilePhotoUrl;
  const hasMedia = !!(videoUrl || profilePhotoUrl);

  return (
    <div className={`relative w-full overflow-hidden ${getHeaderHeight()}`}>
      {/* Media Layer */}
      {hasMedia ? (
        <div className="absolute inset-0">
          {/* Video Element */}
          {showVideo && videoUrl && (
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                videoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              muted={isMuted}
              playsInline
              preload="metadata"
              style={{ objectPosition: 'center 30%' }} // Focus on face area
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          )}
          
          {/* Static Image */}
          {profilePhotoUrl && (!showVideo || !videoUrl) && (
            <img
              ref={imageRef}
              src={profilePhotoUrl}
              alt={`${displayName} profile`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                (!showVideo && profilePhotoUrl) ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ objectPosition: 'center 30%' }}
              onLoad={() => setImageLoaded(true)}
            />
          )}
        </div>
      ) : (
        // Fallback gradient background
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
      )}

      {/* Progressive Blur Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Vertical blur gradient (bottom) */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"
          style={{
            background: `linear-gradient(to bottom, 
              transparent 0%, 
              transparent 55%, 
              rgba(0,0,0,0.2) 75%,
              rgba(0,0,0,0.6) 100%
            )`
          }}
        />
        
        {/* Horizontal edge blur overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, 
              rgba(0,0,0,0.3) 0%, 
              transparent 15%, 
              transparent 85%, 
              rgba(0,0,0,0.3) 100%
            )`
          }}
        />
      </div>

      {/* Text Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end pb-8 px-6 text-center text-white">
        <div className="space-y-2">
          <h1 className={`font-bold ${isMobile ? 'text-2xl' : 'text-4xl'} drop-shadow-lg`}>
            {displayName}
          </h1>
          
          {username && (
            <div className="flex items-center justify-center gap-3">
              <p className={`${isMobile ? 'text-sm' : 'text-lg'} text-white/90 drop-shadow-md`}>
                @{username}
              </p>
              
              {/* Edit Profile Button - Next to username for own profile */}
              {isOwnProfile && onEditProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEditProfile}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm text-xs py-1.5 px-3"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          )}
          
          {homeClub && (
            <p className={`${isMobile ? 'text-xs' : 'text-base'} text-white/80 drop-shadow-md`}>
              {homeClub}
            </p>
          )}
        </div>
      </div>

      {/* Controls Overlay */}
      {isOwnProfile && (
        <div className="absolute top-4 right-4 flex gap-2">
          {videoUrl && showVideo && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMute}
              className="bg-black/20 border-white/30 text-white hover:bg-black/40 backdrop-blur-sm"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleVideoUploadClick}
            disabled={uploading}
            className="bg-black/20 border-white/30 text-white hover:bg-black/40 backdrop-blur-sm"
          >
            <Upload className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handlePhotoUploadClick}
            disabled={uploading}
            className="bg-black/20 border-white/30 text-white hover:bg-black/40 backdrop-blur-sm"
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Replay Button */}
      {showReplayButton && videoUrl && (
        <div className="absolute top-4 left-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReplay}
            className="bg-black/20 border-white/30 text-white hover:bg-black/40 backdrop-blur-sm"
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {!hasMedia && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted animate-pulse" />
      )}

      {/* File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoFileChange}
        className="hidden"
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoFileChange}
        className="hidden"
      />
    </div>
  );
};

export default FullWidthProfileHeader;