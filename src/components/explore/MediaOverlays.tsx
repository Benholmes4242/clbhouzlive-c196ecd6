import React from 'react';
import { PiHandsClappingDuotone } from 'react-icons/pi';
import { Trash2 } from 'lucide-react';

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
  isOwnProfile?: boolean;
  onPostDelete?: (postId: string) => void;
  postId?: string;
}

const MediaOverlays: React.FC<MediaOverlaysProps> = ({
  user,
  likes,
  isFeatured,
  onLike,
  onMaximize,
  mediaType = 'image',
  isOwnProfile = false,
  onPostDelete,
  postId
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (postId && onPostDelete) {
      onPostDelete(postId);
    }
  };

  return (
    <>
      {/* Like button overlay - with gradient styling */}
      <div className="absolute bottom-2 left-2 hidden md:block pointer-events-auto z-20">
        <button
          onClick={onLike}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-b from-white/90 to-gray-100/90 border border-gray-200/50 backdrop-blur-sm rounded-full transition-all duration-200 hover:from-gray-50/90 hover:to-gray-200/90 active:from-gray-100/90 active:to-gray-300/90 pointer-events-auto"
        >
          <PiHandsClappingDuotone className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      {/* Delete button - only show for own profile */}
      {isOwnProfile && postId && onPostDelete && (
        <div className="absolute bottom-2 right-2 hidden md:block pointer-events-auto z-20">
          <button
            onClick={handleDelete}
            className="flex items-center justify-center w-9 h-9 bg-gradient-to-b from-red-500/90 to-red-600/90 border border-red-400/50 backdrop-blur-sm rounded-full transition-all duration-200 hover:from-red-600/90 hover:to-red-700/90 active:from-red-700/90 active:to-red-800/90 pointer-events-auto group"
            aria-label="Delete post"
          >
            <Trash2 className="h-4 w-4 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* User info overlay - larger for featured cards */}
      {user && (
        <div className={`absolute top-2 left-2 flex items-center space-x-2 hidden md:flex ${
          isFeatured ? 'top-4 left-4' : ''
        }`}>
          <img
            src={user.avatar}
            alt={user.name}
            className={`rounded-full object-cover ${isFeatured ? 'w-12 h-12 md:w-16 md:h-16' : 'w-10 h-10 md:w-14 md:h-14'}`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
            }}
          />
          <span className="text-white font-medium drop-shadow-lg text-sm md:text-base">
            {user.name}
          </span>
        </div>
      )}
    </>
  );
};

export default MediaOverlays;