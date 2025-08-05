import React, { useRef, useEffect, useState } from 'react';
import { Play, Upload, Trash2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ProfileVideoCircleProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  displayName: string;
  isOwnProfile: boolean;
  onVideoUpload: (file: File) => void;
  onVideoRemove: () => void;
  uploading?: boolean;
  className?: string;
}

const ProfileVideoCircle: React.FC<ProfileVideoCircleProps> = ({
  videoUrl,
  thumbnailUrl,
  displayName,
  isOwnProfile,
  onVideoUpload,
  onVideoRemove,
  uploading = false,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
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
        console.log('Profile video auto-play successful');
        
        // Set up ended listener
        const handleEnded = () => {
          setIsPlaying(false);
          video.currentTime = 0; // Reset to first frame
          video.pause();
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
  }, [videoUrl, hasPlayed]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
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

  return (
    <div 
      className={`relative w-full h-full rounded-full overflow-hidden group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {videoUrl ? (
        <>
          {/* Video Element */}
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailUrl}
            className="w-full h-full object-cover"
            playsInline
            muted={isMuted}
            preload="auto"
            crossOrigin="anonymous"
          />
          
          {/* Video Controls Overlay */}
          {showControls && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity">
              <div className="flex gap-2">
                {/* Replay Button */}
                {hasPlayed && !isPlaying && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={replayVideo}
                    className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white border-0 rounded-full p-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Edit Video Button - Only for own profile */}
                {isOwnProfile && (
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
            <Button
              size="sm"
              variant="secondary"
              onClick={handleFileSelect}
              className="text-xs"
            >
              <Upload className="w-3 h-3 mr-1" />
              Add Video
            </Button>
          )}
          
          {uploading && (
            <div className="text-xs text-muted-foreground mt-2">
              Uploading...
            </div>
          )}
        </div>
      )}
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
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