import React, { useState, useEffect, useRef } from 'react';
import { X, User, MapPin, Target, Play, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserPosts, UserPostData } from '@/hooks/useUserPosts';
import { useFollowUser } from '@/hooks/useFollowUser';

interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  username?: string;
  homeClub?: string;
  handicap?: number;
  isFollowing?: boolean;
  verified?: boolean;
}

interface MiniProfileSheetProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onFollow?: () => void;
}

const MiniProfileSheet = ({ user, isOpen, onClose, onFollow }: MiniProfileSheetProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followingState, setFollowingState] = useState(user?.isFollowing || false);

  // Fetch real user posts
  const { posts, loading: postsLoading, error: postsError, refetch: refetchPosts } = useUserPosts(
    user?.id || '', 
    isOpen && !!user?.id
  );

  // Follow mutation
  const followMutation = useFollowUser();

  // Update local following state when user prop changes
  useEffect(() => {
    setFollowingState(user?.isFollowing || false);
  }, [user?.isFollowing]);

  // Focus management and reduced motion
  useEffect(() => {
    if (isOpen) {
      // Focus trap setup
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      // Focus the close button when sheet opens (for accessibility)
      setTimeout(() => closeButtonRef.current?.focus(), 100);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAvatarClick = () => {
    navigate(`/profile/${user.id}`);
    onClose();
  };

  const handleNameClick = () => {
    navigate(`/profile/${user.id}`);
    onClose();
  };

  const handleFollowClick = async () => {
    if (isFollowLoading) return;
    
    setIsFollowLoading(true);
    const previousState = followingState;
    
    // Optimistic update
    setFollowingState(!followingState);
    
    try {
      await followMutation.mutateAsync({
        userId: user.id,
        isFollowing: followingState
      });
      
      // Call parent callback if provided
      onFollow?.();
    } catch (error) {
      // Revert optimistic update on error
      setFollowingState(previousState);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handlePostClick = (post: UserPostData) => {
    // Navigate to post detail or open in Clubhouse context
    // For now, we'll just log the click
    console.log('Post clicked:', post);
    // TODO: Implement post navigation logic
  };

  const renderPostsGrid = () => {
    if (postsLoading) {
      // Skeleton loading state
      return (
        <div className={cn(
          "grid gap-1.5",
          isMobile ? "grid-cols-2" : "grid-cols-3"
        )}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="aspect-square bg-white/10 rounded-lg animate-pulse"
            />
          ))}
        </div>
      );
    }

    if (postsError) {
      return (
        <div className="text-center py-8">
          <p className="text-white/70 text-sm mb-3">Couldn't load posts</p>
          <button
            onClick={() => refetchPosts()}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-8">
          <User className="w-8 h-8 text-white/40 mx-auto mb-2" />
          <p className="text-white/70 text-sm">No posts yet</p>
        </div>
      );
    }

    return (
      <div className={cn(
        "grid gap-1.5",
        isMobile ? "grid-cols-2" : "grid-cols-3"
      )}>
        {posts.slice(0, isMobile ? 6 : 9).map((post) => (
          <button
            key={post.id}
            onClick={() => handlePostClick(post)}
            className="relative aspect-square bg-white/10 rounded-lg overflow-hidden hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <img
              src={post.thumbnail || post.src}
              alt={post.title || 'Post'}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop';
              }}
            />
            {post.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-[65] flex items-end justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-sheet-title"
    >
      {/* Enhanced backdrop with more dimming */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Liquid Glass Sheet */}
      <div 
        ref={sheetRef}
        className={cn(
          "relative w-full max-h-[75vh] overflow-hidden",
          "bg-black/40 backdrop-blur-2xl",
          "border border-white/20 rounded-t-2xl",
          "shadow-2xl shadow-black/50",
          // Smooth slide-up animation with subtle overshoot
          "animate-[slide-up_0.4s_cubic-bezier(0.34,1.56,0.64,1)]",
          // Reduced motion support
          "motion-reduce:animate-[fade-in_0.2s_ease-out]"
        )}
        style={{ maxWidth: isMobile ? '100%' : '480px' }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Header Row */}
        <div className="flex items-center justify-between px-6 pb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Clickable Avatar */}
            <button
              onClick={handleAvatarClick}
              className="relative flex-shrink-0 rounded-full overflow-hidden hover:ring-2 hover:ring-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label={`View ${user.name}'s profile`}
            >
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                alt={user.name}
                className="w-12 h-12 object-cover"
              />
            </button>
            
            {/* Clickable Name & Details */}
            <button
              onClick={handleNameClick}
              className="flex-1 min-w-0 text-left hover:bg-white/10 rounded-lg p-1 -m-1 transition-colors duration-200 focus:outline-none focus:bg-white/10"
              aria-label={`View ${user.name}'s profile`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <h3 
                  id="profile-sheet-title"
                  className="font-semibold text-white truncate"
                >
                  {user.name}
                </h3>
                {user.verified && (
                  <CheckCircle className="w-4 h-4 text-discover-orange flex-shrink-0" />
                )}
              </div>
              {user.username && (
                <p className="text-white/70 text-sm truncate">@{user.username}</p>
              )}
              
              {/* Metadata line */}
              <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
                {user.homeClub && (
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{user.homeClub}</span>
                  </div>
                )}
                {user.handicap !== undefined && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span>•</span>
                    <Target className="w-3 h-3" />
                    <span>{user.handicap} HCP</span>
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Subtle Orange Follow Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleFollowClick}
              disabled={isFollowLoading}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 min-w-[80px] border",
                "focus:outline-none focus:ring-2 focus:ring-white/30",
                followingState
                  ? "bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/40"
                  : "bg-discover-orange/20 text-discover-orange border-discover-orange/40 hover:bg-discover-orange/30 hover:border-discover-orange/60 hover:shadow-lg hover:shadow-discover-orange/20",
                isFollowLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isFollowLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                followingState ? 'Following' : 'Follow'
              )}
            </button>

            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Close profile"
            >
              <X className="w-5 h-5 text-white/80" />
            </button>
          </div>
        </div>

        {/* Subtle divider */}
        <div className="mx-6 mb-4 h-px bg-white/10" />

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-full pb-6">
          {/* Recent Posts Section */}
          <div className="px-6">
            <h4 className="font-medium text-white mb-3">Recent Posts</h4>
            {renderPostsGrid()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniProfileSheet;