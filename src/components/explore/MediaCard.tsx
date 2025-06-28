
import React from 'react';
import { Heart, Play } from 'lucide-react';
import { ExploreContentItem } from './types';
import VideoPreview from '../posts/VideoPreview';

interface MediaCardProps {
  item: ExploreContentItem;
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onLike, onFollow }) => {
  if (item.type === 'cta') return null;

  const handleLike = () => {
    onLike(item.id);
  };

  return (
    <div className="relative group cursor-pointer bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Square Media Container */}
      <div className="relative w-full aspect-square overflow-hidden">
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
        
        {/* Video Play Button Overlay - only for videos */}
        {item.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 rounded-full p-3 group-hover:bg-opacity-70 transition-all duration-200">
              <Play className="h-6 w-6 text-white fill-current" />
            </div>
          </div>
        )}

        {/* Like Button Overlay */}
        <div className="absolute bottom-3 left-3">
          <button
            onClick={handleLike}
            className="flex items-center space-x-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full hover:bg-opacity-70 transition-all duration-200"
          >
            <Heart className="h-4 w-4" />
            <span className="text-sm font-medium">{item.likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
