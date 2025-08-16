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

  // Optimized auto-play with better error handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl || hasPlayed) return;

    let timeoutId: NodeJS.Timeout;
    let cleanup = () => {};

    const attemptPlay = async () => {
      try {
        // Reset video state
        video.currentTime = 0;
        video.muted = true;
        
        // Load video with timeout
        const loadPromise = new Promise((resolve, reject) => {
          const onCanPlay = () => {
            cleanup();
            resolve(null);
          };
          
          const onError = (e: Event) => {
            cleanup();
            reject(new Error('Video load failed'));
          };
          
          const onAbort = () => {
            cleanup();
            reject(new Error('Video load aborted'));
          };
          
          cleanup = () => {
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('error', onError);
            video.removeEventListener('abort', onAbort);
          };
          
          video.addEventListener('canplay', onCanPlay, { once: true });
          video.addEventListener('error', onError, { once: true });
          video.addEventListener('abort', onAbort, { once: true });
        });

        // Set up timeout
        timeoutId = setTimeout(() => {
          cleanup();
          console.warn('Video load timeout');
        }, 10000);

        // Load the video
        video.load();
        await loadPromise;
        
        clearTimeout(timeoutId);
        
        // Try to play
        await video.play();
        setIsPlaying(true);
        setHasPlayed(true);
        setShowVideo(true);
        
      } catch (error) {
        console.warn('Auto-play failed:', error);
        setShowVideo(false);
        setIsPlaying(false);
        setHasPlayed(true); // Prevent retry loops
      }
    };

    // Delay initial play attempt
    timeoutId = setTimeout(attemptPlay, 500);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      cleanup();
    };
  }, [videoUrl, hasPlayed]);

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

  // Enhanced replay with better error handling
  const replayVideo = async () => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    
    try {
      // Stop any ongoing playback
      video.pause();
      video.currentTime = 0;
      
      // Ensure video is ready
      if (video.readyState < 2) {
        video.load();
        await new Promise((resolve, reject) => {
          const onCanPlay = () => {
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('error', onError);
            resolve(null);
          };
          const onError = () => {
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('error', onError);
            reject(new Error('Video not ready'));
          };
          video.addEventListener('canplay', onCanPlay);
          video.addEventListener('error', onError);
        });
      }
      
      setShowVideo(true);
      video.muted = isMuted;
      await video.play();
      setIsPlaying(true);
    } catch (error) {
      console.warn('Replay failed:', error);
      setShowVideo(false);
      setIsPlaying(false);
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

  return (
    <div className={`relative w-full overflow-hidden ${className}`} 
         style={{ 
           marginTop: '-8rem', // Reduced margin to give more space at top
           height: '70vh',
           minHeight: '500px',
           maxHeight: '700px',
           paddingTop: '8rem' // Add padding to push content down
         }}>

      {/* Dynamic Blurred Background - Matches Media Card */}
      <div className="absolute inset-0 z-0">
        {/* Use photo background when video is playing to avoid dual HLS loads */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${actualPhotoUrl})`,
            filter: 'blur(20px) saturate(1.2)',
            transform: 'scale(1.1)', // Prevent blur edge artifacts
          }}
        />
        
        {/* Enhanced blur overlay when video is playing */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${
          showVideo && videoUrl ? 'opacity-30' : 'opacity-0'
        }`} style={{
          background: 'radial-gradient(circle, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
          backdropFilter: 'blur(5px)',
        }} />
        
        {/* Gradient overlay for smooth transition to page content */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white/80" />
      </div>

      {/* Central Circular Media */}
      <div className="relative z-10 w-full h-full flex items-start justify-center pt-12">
        {/* Always show a circular element */}
        <div 
          className="relative rounded-full overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 cursor-pointer"
          style={{
            width: '300px',
            height: '300px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
          onClick={handleClick}
        >
          {/* Video Element - Optimized for HLS */}
          {videoUrl && (
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out ${
                showVideo ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              playsInline
              muted={isMuted}
              preload="none"
              poster={thumbnailUrl}
              onPlay={() => {
                setIsPlaying(true);
                setHasPlayed(true);
              }}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                setIsPlaying(false);
                setShowVideo(false);
              }}
              onError={(e) => {
                console.warn('Video playback error, switching to photo');
                setShowVideo(false);
                setIsPlaying(false);
              }}
              onAbort={() => {
                console.warn('Video loading aborted');
              }}
              onStalled={() => {
                console.warn('Video loading stalled');
              }}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          
          {/* Profile Photo - Enhanced error handling */}
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
              console.warn('Profile image failed to load, using fallback');
              e.currentTarget.src = fallbackImage;
            }}
            onLoad={() => {
              // Image loaded successfully
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
      </div>

      {/* Central Media Controls */}
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
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
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