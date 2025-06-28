
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
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        
        {/* Video duration overlay - only for videos */}
        {item.type === 'video' && item.duration && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {item.duration}
          </div>
        )}

        {/* Engagement stats overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
          <button
            onClick={handleLike}
            className="flex items-center space-x-1 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full hover:bg-opacity-80 transition-all duration-200 text-sm"
          >
            <Heart className="h-3 w-3" />
            <span className="font-medium">{item.likes}</span>
          </button>
          
          {item.comments && (
            <div className="flex items-center space-x-3 text-white text-xs">
              {item.comments > 0 && (
                <span className="bg-black bg-opacity-60 px-2 py-1 rounded-full">
                  💬 {item.comments}
                </span>
              )}
              {item.shares && item.shares > 0 && (
                <span className="bg-black bg-opacity-60 px-2 py-1 rounded-full">
                  📤 {item.shares}
                </span>
              )}
            </div>
          )}
        </div>

        {/* User info overlay */}
        {item.user && (
          <div className="absolute top-2 left-2 flex items-center space-x-2">
            <img
              src={item.user.avatar}
              alt={item.user.name}
              className="w-6 h-6 rounded-full border border-white/50"
            />
            <span className="text-white text-xs font-medium bg-black bg-opacity-60 px-2 py-1 rounded-full">
              {item.user.name}
            </span>
            {item.user.verified && (
              <span className="text-blue-400 text-xs">✓</span>
            )}
          </div>
        )}

        {/* Label overlay */}
        {item.label && (
          <div className="absolute bottom-12 left-2">
            <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              {item.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaCard;
