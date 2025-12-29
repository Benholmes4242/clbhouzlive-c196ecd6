import React, { useRef, useEffect, useState, useId } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInView } from 'react-intersection-observer';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';

interface FeaturedVideoBlockProps {
  videoUrl?: string | null;
  posterUrl?: string | null;
  businessName: string;
  isOwner: boolean;
  onEditClick?: () => void;
  className?: string;
}

export function FeaturedVideoBlock({
  videoUrl,
  posterUrl,
  businessName,
  isOwner,
  onEditClick,
  className
}: FeaturedVideoBlockProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  // Generate stable media ID
  const mediaId = useId();

  // Sync isPlaying state with video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  // User-tap toggle - route through MediaRuntime
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      MediaRuntime.requestPause({ id: mediaId, reason: 'user' });
    } else {
      MediaRuntime.requestPlay({ id: mediaId, surface: 'grid', reason: 'user' });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // If no video and not owner, don't show
  if (!videoUrl && !isOwner) {
    return null;
  }

  // Empty state for owners
  if (!videoUrl && isOwner) {
    return (
      <section className={cn("w-full space-y-3", className)}>
        <h2 className="text-base font-semibold text-foreground">Feature a video</h2>
        <button
          onClick={onEditClick}
          className="w-full aspect-video rounded-sq-md border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <Play className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground text-center px-4">
            Pin a video here to introduce your business to golfers.
          </span>
          <span className="text-sm font-medium text-primary mt-1">Add featured video</span>
        </button>
      </section>
    );
  }

  return (
    <div 
      ref={inViewRef}
      className={cn("w-full relative group", className)}
    >
      <div 
        className="relative aspect-video rounded-sq-md overflow-hidden bg-black cursor-pointer"
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={videoUrl || undefined}
          muted={isMuted}
          loop
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Play/Pause overlay */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity",
          isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        )}>
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
            {isPlaying ? (
              <Pause className="h-6 w-6 text-slate-900" />
            ) : (
              <Play className="h-6 w-6 text-slate-900 ml-1" />
            )}
          </div>
        </div>

        {/* Mute button */}
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-white" />
          ) : (
            <Volume2 className="h-4 w-4 text-white" />
          )}
        </button>

        {/* Edit button for owners */}
        {isOwner && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick?.();
            }}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
