import React from 'react';
import { PiHandsClappingDuotone } from 'react-icons/pi';

interface User {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  verified?: boolean;
}

interface MediaOverlaysProps {
  user?: User;
  likes: number;
  isFeatured?: boolean;
  onLike: (e: React.MouseEvent) => void;
  onMaximize: (e: React.MouseEvent) => void;
  mediaType?: 'video' | 'image';
  size?: 'default' | 'large';
}

const MediaOverlays: React.FC<MediaOverlaysProps> = ({
  user,
  likes,
  isFeatured,
  onLike,
  onMaximize,
  mediaType = 'image',
  size = 'default'
}) => {
  const isLarge = size === 'large';

  return (
    <>
      {/* Like button overlay - with gradient styling */}
      <div className={`absolute bottom-2 left-2 hidden md:block pointer-events-auto z-20 ${isLarge ? 'bottom-4 left-4' : ''}`}>
        <button
          onClick={onLike}
          className={`flex items-center gap-1.5 bg-gradient-to-b from-white/90 to-gray-100/90 border border-gray-200/50 backdrop-blur-sm rounded-full transition-all duration-200 hover:from-gray-50/90 hover:to-gray-200/90 active:from-gray-100/90 active:to-gray-300/90 pointer-events-auto ${
            isLarge ? 'px-4 py-2' : 'px-3 py-1.5'
          }`}
        >
          <PiHandsClappingDuotone className={isLarge ? 'h-5 w-5 text-gray-700' : 'h-4 w-4 text-gray-700'} />
        </button>
      </div>


      {/* User info overlay - larger for featured cards */}
      {user && (
        <div className={`absolute top-2 left-2 flex items-center space-x-2 hidden md:flex ${
          isFeatured ? 'top-4 left-4' : ''
        } ${isLarge ? 'top-4 left-4 space-x-3' : ''}`}>
          <img
            src={user.avatar}
            alt={user.name}
            className={`rounded-full object-cover ${
              isLarge 
                ? 'w-14 h-14 md:w-18 md:h-18' 
                : isFeatured 
                  ? 'w-12 h-12 md:w-16 md:h-16' 
                  : 'w-10 h-10 md:w-14 md:h-14'
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
            }}
          />
          <span className={`text-white font-medium drop-shadow-lg ${
            isLarge ? 'text-base md:text-lg' : 'text-sm md:text-base'
          }`}>
            {user.name}
          </span>
        </div>
      )}
    </>
  );
};

export default MediaOverlays;