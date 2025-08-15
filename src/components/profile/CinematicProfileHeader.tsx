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
  const photoRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const { toast } = useToast();

  // Auto-play video once when component mounts and video is available
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl || hasPlayed) return;

    const handleCanPlayThrough = async () => {
      try {
        video.muted = true;
        video.currentTime = 0;
        await video.play();
        setIsPlaying(true);
        setHasPlayed(true);
        setShowVideo(true);
        
        const handleTimeUpdate = () => {
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
          
          if (profilePhotoUrl) {
            setShowVideo(false);
          }
        };
        
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);
        
        return () => {
          video.removeEventListener('timeupdate', handleTimeUpdate);
          video.removeEventListener('ended', handleEnded);
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
    if (video && videoUrl) {
      try {
        video.currentTime = 0;
        video.muted = isMuted;
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

  return (
    <div className={`relative w-full overflow-hidden ${className}`} 
         style={{ 
           marginTop: '-16rem',
           height: '100vh',
           minHeight: '800px',
           maxHeight: '1200px'
         }}>
      {/* Bottom gradient overlay for username readability */}
      <div 
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: `
            linear-gradient(to bottom, 
              transparent 0%, 
              transparent 85%, 
              hsla(var(--background) / 0.05) 88%, 
              hsla(var(--background) / 0.1) 91%, 
              hsla(var(--background) / 0.2) 94%, 
              hsla(var(--background) / 0.4) 96%, 
              hsla(var(--background) / 0.6) 98%, 
              hsla(var(--background) / 0.8) 99%, 
              hsl(var(--background)) 100%
            )
          `
        }}
      />

      {/* Central Crisp Media Player - Full Coverage */}
      <div className="absolute inset-0 z-10">
        {hasMedia ? (
          <>
            {/* Main Video Element - Crisp and Clear */}
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                poster={thumbnailUrl}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out ${
                  showVideo ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
                playsInline
                muted={isMuted}
                preload="auto"
                crossOrigin="anonymous"
              />
            )}
            
            {/* Profile Photo */}
            {profilePhotoUrl && (
              <img
                ref={photoRef}
                src={`${profilePhotoUrl}?quality=100&format=auto&width=1280&height=720&fit=cover`}
                alt={`${displayName} profile`}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out ${
                  !showVideo || !videoUrl ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
                onError={(e) => {
                  e.currentTarget.src = profilePhotoUrl;
                }}
              />
            )}
          </>
        ) : (
          /* Fallback for empty state */
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background/80 to-muted/50" />
        )}
      </div>

      {/* Content Overlay */}
      <div 
        className={`relative z-10 w-full h-full flex items-center justify-center ${
          (!showVideo && profilePhotoUrl) || (!isOwnProfile && hasPlayed && !isPlaying) ? 'cursor-pointer' : ''
        }`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onClick={handleClick}
      >
        {/* Central Media Controls */}
        {hasMedia && showControls && (
          <div className="absolute inset-0 flex items-center justify-center transition-opacity">
            <div className="flex flex-col gap-3 items-center">
              {/* Play/Replay Button */}
              {((hasPlayed && !isPlaying && showVideo) || (!showVideo && videoUrl)) && (
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    replayVideo();
                  }}
                  className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white border-0 rounded-full p-4 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-110"
                >
                  <Play className="w-6 h-6" />
                </Button>
              )}

              {/* Owner Edit Controls - positioned under play button */}
              {isOwnProfile && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileSelect();
                    }}
                    disabled={uploading}
                    className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white border-0 rounded-full px-3 py-1 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
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
                    className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white border-0 rounded-full px-3 py-1 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                  >
                    <span className="text-xs font-medium">Change Photo</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Interface for Empty State */}
        {!hasMedia && isOwnProfile && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-6xl text-muted-foreground/50 mb-2">
              {displayName.charAt(0)}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleFileSelect}
                disabled={uploading}
                className="bg-background/80 backdrop-blur-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Add Video
              </Button>
              <Button
                variant="secondary"
                onClick={handlePhotoSelect}
                disabled={uploading}
                className="bg-background/80 backdrop-blur-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Add Photo
              </Button>
            </div>
          </div>
        )}

      </div>

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