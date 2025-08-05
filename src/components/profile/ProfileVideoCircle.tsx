import React, { useRef, useEffect, useState } from 'react';
import { Play, Upload, Trash2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ProfileVideoCircleProps {
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

const ProfileVideoCircle: React.FC<ProfileVideoCircleProps> = ({
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showVideo, setShowVideo] = useState(true); // true = show video, false = show photo
  const { toast } = useToast();

  // Auto-play video once when component mounts and video is available
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl || hasPlayed) return;

    const handleCanPlayThrough = async () => {
      try {
        video.muted = true; // Ensure muted for autoplay
        video.currentTime = 0; // Start from beginning
        await video.play();
        setIsPlaying(true);
        setHasPlayed(true);
        setShowVideo(true); // Ensure video is visible when playing
        console.log('Profile video auto-play successful');
        
        // Set up ended listener
        const handleEnded = () => {
          setIsPlaying(false);
          video.currentTime = 0; // Reset to first frame
          video.pause();
          
          // Transition to photo after video ends (only if profile photo exists)
          if (profilePhotoUrl) {
            setTimeout(() => {
              setShowVideo(false);
            }, 500); // Small delay for smooth transition
          }
        };
        
        video.addEventListener('ended', handleEnded);
        return () => video.removeEventListener('ended', handleEnded);
      } catch (error) {
        console.error('Auto-play failed:', error);
        setHasPlayed(true); // Mark as played even if failed to prevent retry
      }
    };

    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.load(); // Ensure video starts loading

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

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video file must be less than 100MB.",
        variant: "destructive"
      });
      return;
    }

    // Check video duration
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB max)
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
      } catch (error) {
        console.error('Replay failed:', error);
      }
    }
  };

  const handleCircleClick = () => {
    // Allow click-to-replay when:
    // 1. For other users: when video has ended and showing photo
    // 2. For own profile: when showing photo (not when showing video to avoid conflicts)
    if ((!isOwnProfile && hasPlayed && !isPlaying) || (!showVideo && profilePhotoUrl)) {
      setShowVideo(true);
      replayVideo();
    }
  };

  return (
    <div 
      className={`relative w-full h-full rounded-full overflow-hidden group ${className} ${
        (!showVideo && profilePhotoUrl) || (!isOwnProfile && hasPlayed && !isPlaying) ? 'cursor-pointer' : ''
      }`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={handleCircleClick}
    >
      {videoUrl ? (
        <>
          {/* Video Element - Show/Hide based on showVideo state */}
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailUrl}
            className={`w-full h-full object-cover transition-opacity duration-500 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
            playsInline
            muted={isMuted}
            preload="auto"
            crossOrigin="anonymous"
          />
          
          {/* Profile Photo - Show when video is not showing */}
          {!showVideo && profilePhotoUrl && (
            <img
              src={profilePhotoUrl}
              alt={`${displayName} profile`}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
          )}
          
          {/* Controls Overlay - Show for both video and photo states */}
          {showControls && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  {/* Replay Button - Only when video has played and stopped */}
                  {hasPlayed && !isPlaying && showVideo && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={replayVideo}
                      className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white border-0 rounded-full p-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {/* Play Button - Only when showing photo and video exists */}
                  {!showVideo && videoUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowVideo(true);
                        replayVideo();
                      }}
                      className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white border-0 rounded-full p-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                {/* Owner Controls - Always show both buttons for profile owners */}
                {isOwnProfile && (
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleFileSelect}
                      disabled={uploading}
                      className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white border-0 rounded-full px-3 py-1 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                      title="Change video"
                    >
                      <span className="text-xs font-medium">Change Video</span>
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handlePhotoSelect}
                      disabled={uploading}
                      className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white border-0 rounded-full px-3 py-1 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                      title="Change profile photo"
                    >
                      <span className="text-xs font-medium">Change Photo</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* No Video - Show Upload Area */
        <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center">
          <div className="text-6xl text-muted-foreground/50 mb-4">
            {displayName.charAt(0)}
          </div>
          
          {isOwnProfile && !uploading && (
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleFileSelect}
                className="text-xs"
              >
                <Upload className="w-3 h-3 mr-1" />
                Add Video
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePhotoSelect}
                className="text-xs"
              >
                <Upload className="w-3 h-3 mr-1" />
                Add Photo
              </Button>
            </div>
          )}
          
          {uploading && (
            <div className="text-xs text-muted-foreground mt-2">
              Uploading...
            </div>
          )}
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
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="text-white text-xs">Uploading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileVideoCircle;