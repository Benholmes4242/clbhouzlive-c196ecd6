import React, { useState, useRef, useEffect } from 'react';
import { Play, X } from 'lucide-react';
import { useLongPress } from '@/hooks/useLongPress';
import { useCappedLoading } from '@/hooks/useCappedLoading';
import { haptic } from '@/utils/haptics';
import { useToast } from '@/hooks/use-toast';

interface CarouselSlideProps {
  item: {
    id: string;
    type: 'image' | 'video';
    previewUrl?: string;
    url?: string;
    file?: File;
    alt?: string;
  };
  index?: number;
  isActive: boolean;
  onVideoRef?: (ref: HTMLVideoElement | null) => void;
  onSetCover?: (index: number) => void;
  coverIndex?: number;
}

export default function CarouselSlide({ item, index = 0, isActive, onVideoRef, onSetCover, coverIndex = 0 }: CarouselSlideProps) {
  const [loaded, setLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<string>('00:00');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  
  const showSkeleton = useCappedLoading(loaded, 600);
  
  const longPressProps = useLongPress(() => {
    onSetCover?.(index);
    toast({ description: 'Cover set' });
    haptic('light');
  });

  const src = item.previewUrl || item.url || (item.file ? URL.createObjectURL(item.file) : '');

  useEffect(() => {
    if (videoRef.current && onVideoRef) {
      onVideoRef(videoRef.current);
    }
    return () => {
      if (onVideoRef) onVideoRef(null);
    };
  }, [onVideoRef]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleVideoPlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  if (item.type === 'video') {
    return (
      <div className="relative w-full h-full overflow-hidden select-none" {...longPressProps}>
        {/* Skeleton loading state */}
        <div className={`absolute inset-0 ${showSkeleton ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <div className="w-full h-full animate-pulse bg-white/10" />
        </div>

        <video
          ref={videoRef}
          src={src}
          preload="metadata"
          playsInline
          controls={false}
          muted
          onLoadedMetadata={(e) => {
            const video = e.target as HTMLVideoElement;
            setDuration(formatDuration(video.duration || 0));
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedData={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-300 ${
            loaded ? 'scale-100 blur-0' : 'scale-105 blur-sm'
          }`}
        />

        {/* Play overlay */}
        {!isPlaying && loaded && (
          <button
            aria-label="Play video"
            onClick={handleVideoPlay}
            className="absolute inset-0 flex items-center justify-center group"
          >
            <div className="rounded-full bg-black/40 backdrop-blur-md p-4 group-hover:bg-black/60 transition-colors">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </button>
        )}

        {/* Cover badge - positioned to the right of media counter */}
        {onSetCover && (
          <button
            aria-label={coverIndex === index ? "Current cover" : "Set as cover"}
            className="absolute top-2 left-12 rounded-full bg-black/50 text-white text-xs px-2 py-0.5 flex items-center gap-1 backdrop-blur-sm hover:bg-black/70 transition-colors"
            onClick={(e) => { 
              e.stopPropagation(); 
              if (coverIndex !== index) {
                onSetCover(index); 
                haptic('light');
                toast({ description: 'Cover set' });
              }
            }}
            disabled={coverIndex === index}
          >
            {coverIndex === index ? 'Cover' : 'Set as cover'}
          </button>
        )}

        {/* Close button - positioned where "Set as cover" was */}
        <button
          onClick={() => {
            // Get the close function from parent component
            window.dispatchEvent(new CustomEvent('closeModal'));
          }}
          className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-3 w-3 text-white" />
        </button>

      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden select-none" {...longPressProps}>
      {/* Skeleton loading state */}
      <div className={`absolute inset-0 ${showSkeleton ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
        <div className="w-full h-full animate-pulse bg-white/10" />
      </div>

      <img
        src={src}
        alt={item.alt || `Media item ${item.id}`}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-300 ${
          loaded ? 'scale-100 blur-0' : 'scale-105 blur-sm'
        }`}
        draggable={false}
      />
      
      {/* Cover badge - positioned to the right of media counter */}
      {onSetCover && (
        <button
          aria-label={coverIndex === index ? "Current cover" : "Set as cover"}
          className="absolute top-2 left-12 rounded-full bg-black/50 text-white text-xs px-2 py-0.5 flex items-center gap-1 backdrop-blur-sm hover:bg-black/70 transition-colors"
          onClick={(e) => { 
            e.stopPropagation(); 
            if (coverIndex !== index) {
              onSetCover(index); 
              haptic('light');
              toast({ description: 'Cover set' });
            }
          }}
          disabled={coverIndex === index}
        >
          {coverIndex === index ? 'Cover' : 'Set as cover'}
        </button>
      )}

      {/* Close button - positioned where "Set as cover" was */}
      <button
        onClick={() => {
          // Get the close function from parent component
          window.dispatchEvent(new CustomEvent('closeModal'));
        }}
        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/70 transition-colors"
        aria-label="Close modal"
      >
        <X className="h-3 w-3 text-white" />
      </button>
    </div>
  );
}