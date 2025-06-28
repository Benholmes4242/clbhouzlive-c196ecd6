
import React from 'react';
import { Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import VideoPreview from '@/components/posts/VideoPreview';
import { MediaContentItem } from './types';

interface MediaCardProps {
  item: MediaContentItem;
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  onClick: (item: MediaContentItem) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onLike, onClick }) => {
  const handleClick = () => {
    onClick(item);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(item.id);
  };

  return (
    <div 
      className="bg-card rounded-lg overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer relative group"
      onClick={handleClick}
    >
      {/* Content */}
      <div className="relative">
        {item.type === 'video' ? (
          <div className="relative">
            <VideoPreview
              src={item.src}
              videoId={item.id}
              className="w-full"
              isGridThumbnail={true}
            />
            {item.duration && (
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
                {item.duration}
              </div>
            )}
          </div>
        ) : (
          <img
            src={item.src}
            alt={item.title}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        )}
        
        {/* Label Badge */}
        {item.label && (
          <div className="absolute top-2 left-2 z-10">
            <Badge 
              variant={item.label === 'Pro Tip' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {item.label}
            </Badge>
          </div>
        )}

        {/* Embedded Like Counter */}
        <div className="absolute bottom-2 left-2 z-10">
          <button
            onClick={handleLikeClick}
            className="flex items-center space-x-1 bg-black/70 text-white px-2 py-1 rounded-full text-sm hover:bg-black/80 transition-colors"
          >
            <Heart className="h-3 w-3" />
            <span>{item.likes.toLocaleString()}</span>
          </button>
        </div>

        {/* Hover overlay for better visual feedback */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>
    </div>
  );
};

export default MediaCard;
