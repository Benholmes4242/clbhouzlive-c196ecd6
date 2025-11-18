import React, { useState, useRef, useEffect } from 'react';
import { Play, X } from 'lucide-react';
import { useLongPress } from '@/hooks/useLongPress';
import { useCappedLoading } from '@/hooks/useCappedLoading';
import { haptic } from '@/utils/haptics';
import { useToast } from '@/hooks/use-toast';
import { getFilterClass } from '@/utils/studioFilters';
import { cn } from '@/lib/utils';

interface CarouselSlideProps {
  item: {
    id: string;
    type: 'image' | 'video';
    previewUrl?: string;
    url?: string;
    file?: File;
    alt?: string;
    filterId?: string;
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
  const filterClass = getFilterClass(item.filterId);
  
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
      videoRef.current.currentTime = 0; // Start from beginning when playing
      videoRef.current.play();
    }
  };

  // Generate video thumbnail
  const generateThumbnail = async (videoElement: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      videoElement.addEventListener('loadeddata', () => {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        // Seek to 1 second or 10% of duration, whichever is smaller
        const seekTime = Math.min(1, videoElement.duration * 0.1);
        videoElement.currentTime = seekTime;
        
        videoElement.addEventListener('seeked', () => {
          if (ctx) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          }
        }, { once: true });
      }, { once: true });
    });
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
          poster={src} // Use the same src as poster to ensure thumbnail shows
          onLoadedMetadata={(e) => {
            const video = e.target as HTMLVideoElement;
            setDuration(formatDuration(video.duration || 0));
            // Seek to a frame to show a thumbnail
            video.currentTime = 1;
          }}
          onLoadedData={() => {
            setLoaded(true);
            // Ensure we show a frame for thumbnail
            if (videoRef.current && !isPlaying) {
              videoRef.current.currentTime = 1;
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className={cn("w-full h-full object-cover transition-all duration-300", 
            loaded ? 'scale-100 blur-0' : 'scale-105 blur-sm',
            filterClass
          )}
        />

        {/* Play overlay */}
        {!isPlaying && loaded && (
          <button
            aria-label="Play video"
            onClick={handleVideoPlay}
            className="absolute inset-0 flex items-center justify-center group"
          >
            <div className="w-8 h-8 rounded-full bg-white/55 backdrop-blur-[10px] border border-white/70 shadow-[0_4px_16px_rgba(0,0,0,0.12)] group-hover:bg-white/65 group-hover:shadow-[0_6px_18px_rgba(0,0,0,0.16)] transition-all flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-[rgba(25,25,28,0.85)] fill-[rgba(25,25,28,0.85)] ml-0.5" />
            </div>
          </button>
        )}


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
        className={cn("w-full h-full object-cover transition-all duration-300",
          loaded ? 'scale-100 blur-0' : 'scale-105 blur-sm',
          filterClass
        )}
        draggable={false}
      />
    </div>
  );
}