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
  const [aspectRatio, setAspectRatio] = useState('4/5'); // Default aspect ratio
  const { toast } = useToast();

  // Get aspect ratio from media dimensions
  useEffect(() => {
    if (videoUrl) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const ratio = video.videoWidth / video.videoHeight;
        if (ratio >= 16/9) {
          setAspectRatio('16/9');
        } else if (ratio >= 1.3) {
          setAspectRatio('4/3');
        } else if (ratio >= 0.9 && ratio <= 1.1) {
          setAspectRatio('1/1');
        } else {
          setAspectRatio('4/5');
        }
      };
      video.src = videoUrl;
    } else if (profilePhotoUrl) {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        if (ratio >= 16/9) {
          setAspectRatio('16/9');
        } else if (ratio >= 1.3) {
          setAspectRatio('4/3');
        } else if (ratio >= 0.9 && ratio <= 1.1) {
          setAspectRatio('1/1');
        } else {
          setAspectRatio('4/5');
        }
      };
      img.src = profilePhotoUrl;
    }
  }, [videoUrl, profilePhotoUrl]);

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

  return (
    <div className={`relative w-full overflow-hidden ${className}`} 
         style={{ 
           marginTop: '-8rem',
           height: '70vh',
           minHeight: '500px',
           maxHeight: '700px',
           paddingTop: '8rem'
         }}>

      {/* Dynamic Blurred Background */}
      <div className="absolute inset-0 z-0">
        {/* Video Background - Shows when video is playing */}
        {videoUrl && showVideo && (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: 'blur(20px) saturate(1.2)',
              transform: 'scale(1.1)',
            }}
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            poster={thumbnailUrl}
          />
        )}
        
        {/* Photo Background - Shows when photo is displayed or video ended */}
        {(!videoUrl || !showVideo) && (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${actualPhotoUrl})`,
              filter: 'blur(20px) saturate(1.2)',
              transform: 'scale(1.1)',
            }}
          />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white/80" />
      </div>

      {/* Liquid Glass Card */}
      <div className="relative z-10 w-full h-full flex items-center justify-center px-4">
        <div 
          className="relative bg-white/20 backdrop-blur-md border border-white/20 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
          style={{
            borderRadius: '16px',
            aspectRatio: aspectRatio,
            width: 'min(90vw, 560px)',
            maxWidth: '640px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          }}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
          onClick={handleClick}
        >
          {/* Video Element */}
          {videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={thumbnailUrl}
              className={`absolute inset-0 w-full h-full object-contain transition-all duration-1000 ease-out ${
                showVideo ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              style={{ borderRadius: '16px' }}
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
          
          {/* Profile Photo */}
          <img
            ref={photoRef}
            src={actualPhotoUrl}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            alt={`${displayName} profile`}
            className={`absolute inset-0 w-full h-full object-contain transition-all duration-1000 ease-out ${
              !showVideo || !videoUrl ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{ borderRadius: '16px' }}
            onError={(e) => {
              console.log('Image failed to load:', actualPhotoUrl);
              e.currentTarget.src = fallbackImage;
            }}
          />
        </div>

        {/* Upload Interface for Empty State */}
        {!hasMedia && isOwnProfile && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/80">
              <div className="text-6xl mb-6">
                {displayName.charAt(0)}
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleFileSelect}
                  disabled={uploading}
                  className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePhotoSelect}
                  disabled={uploading}
                  className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add Photo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Controls Overlay */}
      {hasMedia && showControls && (
        <div className="absolute inset-0 flex items-center justify-center transition-opacity z-20">
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
                className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-full p-4 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-110"
              >
                <Play className="w-6 h-6" />
              </Button>
            )}

            {/* Owner Edit Controls */}
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
                  className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-full px-3 py-1 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
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
                  className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-full px-3 py-1 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
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