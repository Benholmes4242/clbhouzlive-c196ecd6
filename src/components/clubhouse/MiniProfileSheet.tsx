import React, { useState } from 'react';
import { X, User, MapPin, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  username?: string;
  homeClub?: string;
  handicap?: number;
  isFollowing?: boolean;
  posts?: Array<{
    id: string;
    type: 'video' | 'image';
    src: string;
    thumbnail?: string;
  }>;
}

interface MiniProfileSheetProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onFollow?: () => void;
}

const MiniProfileSheet = ({ user, isOpen, onClose, onFollow }: MiniProfileSheetProps) => {
  const isMobile = useIsMobile();

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Mock posts data if not provided
  const posts = user.posts || Array.from({ length: 9 }, (_, i) => ({
    id: `post-${i}`,
    type: 'video' as const,
    src: `https://images.unsplash.com/photo-${1500000000 + i}?w=200&h=200&fit=crop`,
    thumbnail: `https://images.unsplash.com/photo-${1500000000 + i}?w=200&h=200&fit=crop`
  }));

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-end justify-center"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Sheet */}
      <div 
        className={cn(
          "relative w-full bg-white rounded-t-2xl max-h-[70vh] overflow-hidden",
          "animate-slide-in-up"
        )}
        style={{ maxWidth: isMobile ? '100%' : '480px' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center px-6 pb-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-full pb-6">
          {/* User Info */}
          <div className="px-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {user.name}
                </h3>
                {user.username && (
                  <p className="text-gray-600 text-sm">@{user.username}</p>
                )}
                
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  {user.homeClub && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{user.homeClub}</span>
                    </div>
                  )}
                  {user.handicap !== undefined && (
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{user.handicap} HCP</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={onFollow}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors min-w-[80px]",
                  user.isFollowing
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-accent text-white hover:bg-accent/90"
                )}
              >
                {user.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="px-6">
            <h4 className="font-medium text-gray-900 mb-3">Recent Posts</h4>
            <div className="grid grid-cols-3 gap-1">
              {posts.slice(0, 9).map((post) => (
                <div
                  key={post.id}
                  className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <img
                    src={post.thumbnail || post.src}
                    alt="Post"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {post.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniProfileSheet;