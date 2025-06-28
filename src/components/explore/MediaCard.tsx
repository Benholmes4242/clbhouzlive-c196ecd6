
import React from 'react';
import { Heart } from 'lucide-react';
import { ExploreContentItem } from './types';
import VideoPreview from '@/components/posts/VideoPreview';

interface MediaCardProps {
  item: ExploreContentItem;
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onLike }) => {
  if (item.type === 'cta') return null;

  const handleLike = () => {
    onLike(item.id);
  };

  return (
    <div className="relative group cursor-pointer bg-white rounded-lg shadow-sm border overflow-hidden h-full">
      {/* Square Media Container */}
      <div className="relative w-full aspect-square">
        {item.type === 'video' ? (
          <VideoPreview
            src={item.src}
            videoId={item.id}
            className="w-full h-full"
            isGridThumbnail={true}
          />
        ) : (
          <img
            src={item.src}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        )}

        {/* Simplified Overlay - Only Like Button */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleLike}
              className="flex items-center space-x-1 text-white hover:text-red-400 transition-colors"
            >
              <Heart className="h-4 w-4" />
              <span className="text-sm font-medium">{item.likes}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
