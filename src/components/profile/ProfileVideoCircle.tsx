import React, { useRef, useEffect, useState } from 'react';
import { Play, Upload, Trash2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useVideoVisibility } from '@/hooks/useVideoVisibility';

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
  const [showPhoto, setShowPhoto] = useState(false);
  const [canAutoplay, setCanAutoplay] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const { toast } = useToast();

  // Check for reduced motion preference
  const prefersReduced = typeof window !== "undefined" && 
    window.matchMedia && 
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Use video visibility hook for viewport-based autoplay
  const { containerRef, isVisible } = useVideoVisibility({
    threshold: 0.2,
    videoRef,
    shouldAutoplay: true,
    globallyMuted: true,
    onEnterView: () => {
      if (!videoUrl || prefersReduced) {
        setShowPhoto(true);
        return;
      }
      
      const video = videoRef.current;
      if (video && canAutoplay) {
        video.play().catch(() => {
          setCanAutoplay(false);
          setShowPhoto(true);
        });
      }
    },
    onExitView: () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
      }
    }
  });

  // Handle video events for smooth cross-fade
  useEffect(() => {
    if (!videoUrl || prefersReduced) {
      setShowPhoto(true);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const onEnded = () => setShowPhoto(true);
    const onError = () => setShowPhoto(true);

    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
    };
  }, [videoUrl, prefersReduced]);

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

  const replay = () => {
    if (!videoUrl || prefersReduced) return;
    const video = videoRef.current;
    if (!video) return;
    
    setShowPhoto(false);
    video.currentTime = 0;
    video.play().catch(() => setShowPhoto(true));
  };

  return (
    <div 
      ref={containerRef}
      className={`squircle-mask relative w-full h-full group ${className} ${
        showPhoto ? 'cursor-pointer' : ''
      }`}
      style={{ 
        WebkitMaskImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 0 C77.6 0 100 22.4 100 50 C100 77.6 77.6 100 50 100 C22.4 100 0 77.6 0 50 C0 22.4 22.4 0 50 0 Z"/></svg>')`,
        maskImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 0 C77.6 0 100 22.4 100 50 C100 77.6 77.6 100 50 100 C22.4 100 0 77.6 0 50 C0 22.4 22.4 0 50 0 Z"/></svg>')`,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        borderRadius: 0
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={replay}
    >
      {videoUrl && !prefersReduced && (
        <video
          ref={videoRef}
          className="squircle-media absolute inset-0 w-full h-full object-cover"
          src={videoUrl}
          playsInline
          muted
          preload="metadata"
          poster={profilePhotoUrl || thumbnailUrl}
        />
      )}

      <img
        className={`squircle-media absolute inset-0 w-full h-full object-cover ${
          prefersReduced ? '' : 'transition-opacity duration-300 ease-in-out'
        } ${showPhoto ? 'opacity-100' : 'opacity-0'}`}
        src={profilePhotoUrl || `${profilePhotoUrl}?quality=95&format=auto&width=512&height=512&fit=cover` || "/placeholder.svg"}
        alt={`${displayName} profile`}
        draggable="false"
        onError={(e) => {
          if (profilePhotoUrl) {
            e.currentTarget.src = profilePhotoUrl;
          }
        }}
      />

      {/* Fallback when no photo */}
      {(!profilePhotoUrl || !profilePhotoUrl.trim()) && (
        <div className="absolute inset-0 w-full h-full bg-muted/30 flex items-center justify-center">
          <div className="text-6xl text-muted-foreground/50">
            {displayName.charAt(0)}
          </div>
        </div>
      )}
      
      {/* Controls Overlay */}
      {showControls && (videoUrl || isOwnProfile) && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity">
          <div className="flex flex-col gap-2 items-center">
            {/* Play/Replay Button */}
            {videoUrl && showPhoto && (
              <Button
                size="sm"
                variant="ghost"
                onClick={replay}
                className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white border-0 rounded-full p-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
            
            {/* Owner Controls */}
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

      {!videoUrl && (
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