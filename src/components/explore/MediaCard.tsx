
import React from 'react';
import { Heart, MessageCircle, Share, Play, CheckCircle } from 'lucide-react';
import { ExploreContentItem } from './types';

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

  const handleFollow = () => {
    onFollow(item.id);
  };

  return (
    <div className="relative group cursor-pointer bg-white rounded-lg shadow-sm border overflow-hidden h-full flex flex-col">
      {/* Media Container */}
      <div className="relative flex-1">
        <img
          src={item.src}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        
        {/* Video Play Button Overlay */}
        {item.type === 'video' && (
          <>
            <div className="absolute inset-0 bg-black bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-200" />
            <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
              {item.duration}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:bg-opacity-100 transition-all duration-200">
                <Play className="h-6 w-6 text-black fill-current" />
              </div>
            </div>
          </>
        )}

        {/* Label Badge */}
        {item.label && (
          <div className="absolute top-3 right-3 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
            {item.label}
          </div>
        )}

        {/* Gradient Overlay for Text */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          {/* User Info */}
          <div className="flex items-center space-x-2 mb-2">
            <img
              src={item.user.avatar}
              alt={item.user.name}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-white text-sm font-medium">{item.user.name}</span>
            {item.user.verified && (
              <CheckCircle className="h-4 w-4 text-blue-400 fill-current" />
            )}
          </div>

          {/* Title */}
          <h3 className="text-white text-sm font-semibold mb-2 line-clamp-2">
            {item.title}
          </h3>
        </div>
      </div>

      {/* Engagement Bar */}
      <div className="p-3 bg-white border-t">
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className="flex items-center space-x-1 hover:text-red-500 transition-colors"
            >
              <Heart className="h-4 w-4" />
              <span className="text-xs">{item.likes}</span>
            </button>
            
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{item.comments}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Share className="h-4 w-4" />
              <span className="text-xs">{item.shares}</span>
            </div>
          </div>

          {/* Follow Button */}
          <button
            onClick={handleFollow}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              item.isFollowing
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-[#2a2626] text-white hover:bg-[#1a1616]'
            }`}
          >
            {item.isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
