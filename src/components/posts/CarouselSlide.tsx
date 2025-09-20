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
      <div className="relative w-full h-full overflow-hidden select-none rounded-2xl liquid-glass shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300" {...longPressProps}>
        {/* Skeleton loading state */}
        <div className={`absolute inset-0 rounded-2xl ${showSkeleton ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <div className="w-full h-full animate-pulse bg-white/10 rounded-2xl" />
        </div>

        <video
          ref={videoRef}
          src={src}
          preload="metadata"
          playsInline
          controls={false}
          muted
          poster={item.previewUrl ? item.previewUrl.replace(/\.[^/.]+$/, '.jpg') : undefined}
          onLoadedMetadata={(e) => {
            const video = e.target as HTMLVideoElement;
            setDuration(formatDuration(video.duration || 0));
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedData={() => setLoaded(true)}
          onError={() => setLoaded(true)} // Show fallback if video fails
          className={`w-full h-full object-cover rounded-2xl transition-all duration-300 ${
            loaded ? 'scale-100 blur-0' : 'scale-105 blur-sm'
          }`}
          style={{
            transform: 'translateZ(0)', // Force GPU acceleration
            willChange: isActive ? 'transform' : 'auto'
          }}
        />

        {/* Play overlay */}
        {!isPlaying && loaded && (
          <button
            aria-label="Play video"
            onClick={handleVideoPlay}
            className="absolute inset-0 flex items-center justify-center group rounded-2xl"
          >
            <div className="rounded-full liquid-glass-button p-4 group-hover:scale-110 group-hover:ring-brand-orange/30 group-hover:ring-2 transition-all duration-300">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </button>
        )}

        {/* Video controls overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
          <div className="rounded-full liquid-glass px-3 py-1">
            <span className="text-white text-xs font-medium">{duration}</span>
          </div>
          {coverIndex === index && (
            <div className="rounded-full bg-brand-orange px-3 py-1">
              <span className="text-white text-xs font-bold">Cover</span>
            </div>
          )}
        </div>

        {/* Cover badge - shows "Cover" on cover image, "Set as cover" on others */}
        {onSetCover && coverIndex !== index && (
          <button
            aria-label="Set as cover"
            className="absolute top-3 left-3 rounded-full liquid-glass text-white px-3 py-1 text-xs font-medium hover:ring-brand-orange/30 hover:ring-2 transition-all duration-300"
            onClick={(e) => { 
              e.stopPropagation(); 
              onSetCover(index); 
              haptic('light');
              toast({ description: 'Cover set' });
            }}
          >
            Set as cover
          </button>
        )}

        {/* Close button */}
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('closeModal'));
          }}
          className="absolute top-3 right-3 h-8 w-8 rounded-full liquid-glass-button hover:scale-110 hover:ring-brand-orange/30 hover:ring-2 transition-all duration-300 flex items-center justify-center"
          aria-label="Close modal"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden select-none rounded-2xl liquid-glass shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300" {...longPressProps}>
      {/* Skeleton loading state */}
      <div className={`absolute inset-0 rounded-2xl ${showSkeleton ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
        <div className="w-full h-full animate-pulse bg-white/10 rounded-2xl" />
      </div>

      <img
        src={src}
        alt={item.alt || `Media item ${item.id}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)} // Show fallback if image fails
        className={`w-full h-full object-cover rounded-2xl transition-all duration-300 ${
          loaded ? 'scale-100 blur-0' : 'scale-105 blur-sm'
        }`}
        draggable={false}
        loading="lazy"
        style={{
          transform: 'translateZ(0)', // Force GPU acceleration
          willChange: isActive ? 'transform' : 'auto'
        }}
      />
      
      {/* Cover badge - shows "Cover" on cover image, "Set as cover" on others */}
      {onSetCover && (
        <button
          aria-label={coverIndex === index ? "Current cover" : "Set as cover"}
          className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-medium transition-all duration-300 ${
            coverIndex === index 
              ? 'bg-brand-orange text-white' 
              : 'liquid-glass text-white hover:ring-brand-orange/30 hover:ring-2'
          }`}
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

      {/* Close button */}
      <button
        onClick={() => {
          window.dispatchEvent(new CustomEvent('closeModal'));
        }}
        className="absolute top-3 right-3 h-8 w-8 rounded-full liquid-glass-button hover:scale-110 hover:ring-brand-orange/30 hover:ring-2 transition-all duration-300 flex items-center justify-center"
        aria-label="Close modal"
      >
        <X className="h-4 w-4 text-white" />
      </button>
    </div>
  );
}