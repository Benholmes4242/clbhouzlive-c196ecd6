import React from 'react';
import { Play } from 'lucide-react';
import { MediaItem } from '@/types/media';

interface ReviewMediaThumbProps {
  item: MediaItem;
  onClick: () => void;
}

function ReviewMediaThumb({ item, onClick }: ReviewMediaThumbProps) {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
  };

  return (
    <button
      onClick={onClick}
      className="h-28 w-44 overflow-hidden rounded-xl ring-1 ring-black/5 bg-muted relative shrink-0 group transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/20"
      aria-label={item.alt ?? (item.type === 'video' ? 'Play video' : 'Open image')}
    >
      {item.type === 'image' ? (
        <img 
          src={item.url} 
          alt={item.alt || ''}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" 
          loading="lazy" 
          decoding="async"
          onError={handleImageError}
        />
      ) : (
        <div className="h-full w-full">
          <img
            src={item.posterUrl ?? '/placeholder.svg'}
            alt={item.alt || 'Video thumbnail'}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onError={handleImageError}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 group-hover:bg-black/70 group-hover:scale-110">
              <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

export default ReviewMediaThumb;