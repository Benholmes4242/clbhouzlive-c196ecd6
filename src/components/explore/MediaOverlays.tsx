import React from 'react';
import { Heart, Maximize2 } from 'lucide-react';

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
}

const MediaOverlays: React.FC<MediaOverlaysProps> = ({
  user,
  likes,
  isFeatured,
  onLike,
  onMaximize
}) => {
  return (
    <>
      {/* Like button overlay - hidden on mobile */}
      <div className="absolute bottom-1 left-3 hidden md:block pointer-events-auto z-20">
        <button
          onClick={onLike}
          className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors pointer-events-auto"
        >
          <div className="flex items-center space-x-1">
            <Heart className="h-4 w-4" />
            <span className="font-medium text-sm">{likes}</span>
          </div>
        </button>
      </div>

      {/* Maximize button overlay - hidden on mobile */}
      <div className="absolute bottom-1 right-1 hidden md:block pointer-events-auto z-20">
        <button
          onClick={onMaximize}
          className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors pointer-events-auto"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* User info overlay - larger for featured cards */}
      {user && (
        <div className={`absolute top-2 left-2 flex items-center space-x-2 hidden md:flex ${
          isFeatured ? 'top-4 left-4' : ''
        }`}>
          <img
            src={user.avatar}
            alt={user.name}
            className={`rounded-full ${isFeatured ? 'w-16 h-16' : 'w-14 h-14'}`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
            }}
          />
          <span className={`text-white font-bold drop-shadow-lg ${
            isFeatured ? 'text-base' : 'text-sm'
          }`}>
            {user.name}
          </span>
        </div>
      )}
    </>
  );
};

export default MediaOverlays;