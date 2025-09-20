import React, { useState, useEffect } from 'react';
import { X, MapPin, Target, Play, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useUserProfilePosts } from '@/hooks/useUserProfilePosts';
import { useFullscreenMedia } from '@/hooks/useFullscreenMedia';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';

interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  username?: string;
  homeClub?: string;
  handicap?: number;
  isFollowing?: boolean;
  isVerified?: boolean;
}

interface MiniProfileSheetProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onFollow?: () => void;
}

const MiniProfileSheet = ({ user, isOpen, onClose, onFollow }: MiniProfileSheetProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { followUser, unfollowUser, loading: followLoading } = useFollowUser();
  const { posts, loading: postsLoading, error: postsError, isEmpty } = useUserProfilePosts(user?.id);
  const { openMedia } = useFullscreenMedia();
  const [isFollowing, setIsFollowing] = useState(user?.isFollowing || false);
  const [optimisticFollowing, setOptimisticFollowing] = useState(false);

  // Update following state when user prop changes
  useEffect(() => {
    setIsFollowing(user?.isFollowing || false);
  }, [user?.isFollowing]);

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

  const handleAvatarClick = () => {
    if (user?.username) {
      navigate(`/${user.username}`);
      onClose();
    }
  };

  const handleNameClick = () => {
    if (user?.username) {
      navigate(`/${user.username}`);
      onClose();
    }
  };

  const handleFollowClick = async () => {
    if (!user?.id || followLoading) return;

    // Optimistic update
    const newFollowingState = !isFollowing;
    setOptimisticFollowing(true);
    setIsFollowing(newFollowingState);

    try {
      const success = newFollowingState
        ? await followUser(user.id)
        : await unfollowUser(user.id);

      if (!success) {
        // Revert optimistic update on failure
        setIsFollowing(!newFollowingState);
      } else {
        // Call parent onFollow callback if provided
        onFollow?.();
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsFollowing(!newFollowingState);
    } finally {
      setOptimisticFollowing(false);
    }
  };

  const handlePostClick = (post: any) => {
    if (post.post_media?.length > 0) {
      const media = post.post_media[0];
      openMedia(
        media.media_url,
        media.media_type,
        'User post',
        undefined,
        {
          id: user.id,
          displayName: user.name,
          profile_photo_url: user.avatar
        },
        user.name,
        post.content
      );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-end justify-center"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Enhanced Backdrop with more dimming */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      
      {/* Liquid Glass Sheet */}
      <div 
        className={cn(
          "relative w-full max-h-[75vh] overflow-hidden",
          "bg-black/20 backdrop-blur-xl border border-white/10",
          "rounded-t-3xl shadow-2xl shadow-black/50",
          "animate-slide-in-up motion-reduce:animate-none",
          // Glass surface styling
          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
        )}
        style={{ maxWidth: isMobile ? '100%' : '480px' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-white/30 rounded-full" />
        </div>

        {/* Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-full transition-all duration-200",
              "bg-black/20 backdrop-blur-sm border border-white/10",
              "hover:bg-white/10 hover:scale-105",
              "focus:ring-2 focus:ring-white/30 focus:outline-none"
            )}
            aria-label="Close profile"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-full pb-6">
          {/* User Info Header */}
          <div className="px-6 pt-2 pb-6">
            <div className="flex items-start gap-4">
              {/* Clickable Avatar */}
              <button
                onClick={handleAvatarClick}
                className={cn(
                  "flex-shrink-0 transition-transform duration-200",
                  "hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full",
                  user?.username ? "cursor-pointer" : "cursor-default"
                )}
                disabled={!user?.username}
              >
                <OptimizedAvatar
                  src={user.avatar}
                  alt={user.name}
                  size={64}
                  fallback={user.name?.charAt(0)}
                  className="ring-2 ring-white/20"
                />
              </button>
              
              <div className="flex-1 min-w-0">
                {/* Clickable Name */}
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={handleNameClick}
                    className={cn(
                      "text-left transition-colors duration-200",
                      "hover:text-white/80 focus:text-white/80 focus:outline-none",
                      user?.username ? "cursor-pointer" : "cursor-default"
                    )}
                    disabled={!user?.username}
                  >
                    <h3 className="font-semibold text-lg text-white truncate">
                      {user.name}
                    </h3>
                  </button>
                  {user.isVerified && (
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  )}
                </div>
                
                {user.username && (
                  <p className="text-white/60 text-sm mb-2">@{user.username}</p>
                )}
                
                {/* Conditional Metadata */}
                {(user.homeClub || user.handicap !== undefined) && (
                  <div className="flex items-center gap-4 text-sm text-white/60">
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
                )}
              </div>

              {/* Subtle Orange Follow Button */}
              <button
                onClick={handleFollowClick}
                disabled={followLoading || optimisticFollowing}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 min-w-[80px]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isFollowing
                    ? "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                    : "border border-orange-400/50 text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 hover:border-orange-400/70"
                )}
              >
                {followLoading || optimisticFollowing ? '...' : (isFollowing ? 'Following' : 'Follow')}
              </button>
            </div>
          </div>

          {/* Subtle Divider */}
          <div className="mx-6 mb-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Recent Posts Section */}
          <div className="px-6">
            <h4 className="font-medium text-white mb-4">Recent Posts</h4>
            
            {/* Loading State */}
            {postsLoading && (
              <div className={cn(
                "grid gap-2",
                isMobile ? "grid-cols-2" : "grid-cols-3"
              )}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-white/5 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Error State */}
            {postsError && !postsLoading && (
              <div className="text-center py-8 text-white/60">
                <p className="mb-2">Couldn't load posts</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="text-sm text-orange-300 hover:text-orange-200 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {isEmpty && !postsLoading && !postsError && (
              <div className="text-center py-8 text-white/60">
                <p>No posts yet</p>
              </div>
            )}

            {/* Posts Grid */}
            {!postsLoading && !postsError && posts.length > 0 && (
              <div className={cn(
                "grid gap-2",
                isMobile ? "grid-cols-2" : "grid-cols-3"
              )}>
                {posts.slice(0, isMobile ? 6 : 9).map((post) => {
                  const media = post.post_media[0];
                  if (!media) return null;

                  return (
                    <div
                      key={post.id}
                      onClick={() => handlePostClick(post)}
                      className={cn(
                        "relative aspect-square bg-white/5 rounded-2xl overflow-hidden cursor-pointer",
                        "transition-all duration-200 hover:scale-105 hover:bg-white/10",
                        "focus:outline-none focus:ring-2 focus:ring-white/30"
                      )}
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePostClick(post);
                        }
                      }}
                    >
                      <img
                        src={media.poster_url || media.media_url}
                        alt="User post"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {media.media_type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                            <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                      )}
                      {/* Gradient overlay for better contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniProfileSheet;