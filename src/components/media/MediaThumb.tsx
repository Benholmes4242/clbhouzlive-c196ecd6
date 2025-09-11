import React from 'react';
import { Play } from 'lucide-react';
import { MediaItem } from '@/types/media';

interface MediaThumbProps {
  item: MediaItem;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-20 w-32',
  md: 'h-28 w-44', 
  lg: 'h-36 w-56'
};

/**
 * Reusable media thumbnail component that shows proper posters for videos
 * and handles fallbacks gracefully
 */
export default function MediaThumb({ 
  item, 
  onClick, 
  className = '', 
  size = 'md' 
}: MediaThumbProps) {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/placeholder.svg';
  };

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} overflow-hidden rounded-xl ring-1 ring-border bg-muted relative focus:outline-none focus:ring-2 focus:ring-ring transition-all hover:ring-2 hover:ring-ring/50 ${className}`}
      aria-label={item.alt ?? (item.type === 'video' ? 'Play video' : 'Open image')}
    >
      {item.type === 'image' ? (
        <img 
          src={item.url} 
          alt={item.alt ?? 'Photo'}
          className="h-full w-full object-cover" 
          loading="lazy" 
          decoding="async"
          onError={handleImageError}
        />
      ) : (
        <div className="h-full w-full relative">
          <img
            src={item.posterUrl ?? '/placeholder.svg'}
            alt={item.alt ?? 'Video thumbnail'}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={handleImageError}
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-black/50 backdrop-blur-sm">
              <Play className="h-5 w-5 text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>
      )}
    </button>
  );
}