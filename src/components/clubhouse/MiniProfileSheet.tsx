import React, { useState, useEffect } from 'react';
import { X, MapPin, Target, Play, CheckCircle, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useUserProfilePosts } from '@/hooks/useUserProfilePosts';
import { useFullscreenMedia } from '@/hooks/useFullscreenMedia';
import SquircleImage from '@/components/ui/SquircleImage';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { SheetPlaybackProvider, useSheetPlayback } from './SheetPlaybackContext';
import { VideoThumbPlayer } from './VideoThumbPlayer';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { CLUBHOUSE_SHEET_HEIGHT, CLUBHOUSE_SHEET_BACKDROP_CLASS } from '@/constants/clubhouseSheets';

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

function bumpPosterTime(url: string, nextTime = '2s') {
  try {
    const u = new URL(url);
    u.searchParams.set('time', nextTime);
    return u.toString();
  } catch {
    return url;
  }
}

function RecentPostTile({ 
  media, 
  onTileClick,
  ioRoot
}: { 
  media: { type: 'image' | 'video'; url: string; posterUrl?: string };
  onTileClick: () => void;
  ioRoot?: Element | null;
}) {
  const isVideo = media.type === 'video';

  if (isVideo) {
    return (
      <div className="recent-post-tile relative aspect-square bg-white/5 rounded-2xl overflow-hidden">
        <VideoThumbPlayer
          url={media.url}
          poster={media.posterUrl ?? ''}
          ioRoot={ioRoot}
          className="w-full h-full"
        />
        {/* Gradient overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
    );
  }

  // build retry poster for video (e.g., 2s frame), only if we used 1s above
  const retryPoster = isVideo && media.posterUrl
    ? bumpPosterTime(media.posterUrl, '2s')
    : undefined;

  const srcForImg = isVideo ? (media.posterUrl ?? '') : media.url;

  return (
    <div
      onClick={onTileClick}
      className={cn(
        "recent-post-tile relative aspect-square bg-white/5 rounded-2xl overflow-hidden cursor-pointer",
        "transition-all duration-200 hover:scale-105 hover:bg-white/10",
        "focus:outline-none focus:ring-2 focus:ring-white/30"
      )}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTileClick();
        }
      }}
    >
      <ImageWithFallback
        src={srcForImg}
        retrySrc={retryPoster}
        placeholderSrc="/placeholders/post-tile.jpg"
        className="w-full h-full object-cover"
        alt="User post"
        onHardFail={() => {
          // optional: breadcrumb, not console spam
          if (process.env.NODE_ENV === 'development') {
            console.debug('[MiniProfileSheet] poster hard-fail', media);
          }
        }}
      />
      {/* Gradient overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
}

const MiniProfileSheetContent = ({ user, isOpen, onClose, onFollow }: MiniProfileSheetProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { followUser, unfollowUser, loading: followLoading } = useFollowUser();
  const { posts, loading: postsLoading, error: postsError, isEmpty } = useUserProfilePosts(user?.id);
  const { openMedia } = useFullscreenMedia();
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();
  const [isFollowing, setIsFollowing] = useState(user?.isFollowing || false);
  const [optimisticFollowing, setOptimisticFollowing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const headerRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollMaxHeight, setScrollMaxHeight] = React.useState<number>();
  const { setSheetClosing } = useSheetPlayback();

  // Update following state when user prop changes
  useEffect(() => {
    setIsFollowing(user?.isFollowing || false);
  }, [user?.isFollowing]);

  // Reset closing state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  // Measure header height to calculate scroll region height
  React.useLayoutEffect(() => {
    const measure = () => {
      const sheet = document.querySelector<HTMLElement>('.mini-profile-sheet');
      const header = headerRef.current;
      if (!sheet || !header) return;
      
      const sheetHeight = sheet.getBoundingClientRect().height;
      const headerHeight = header.getBoundingClientRect().height;
      const verticalPadding = 24; // Total internal vertical padding
      
      setScrollMaxHeight(Math.max(160, sheetHeight - headerHeight - verticalPadding));
    };

    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(measure, 100);
      
      const resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(document.documentElement);
      if (headerRef.current) {
        resizeObserver.observe(headerRef.current);
      }
      
      return () => {
        clearTimeout(timer);
        resizeObserver.disconnect();
      };
    }
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setSheetClosing(true); // Pause all videos
    // Wait for slide-out animation to complete before calling onClose
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setSheetClosing(false); // Reset for next time
    }, 300); // Match animation duration
  };

  const handleBackdropClick = () => {
    handleClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleAvatarClick = () => {
    if (user?.id) {
      handleClose();
      // Small delay to ensure modal closes before navigation
      setTimeout(() => {
        navigate(`/profile/${user.id}`);
      }, 100);
    }
  };

  const handleNameClick = () => {
    if (user?.id) {
      handleClose();
      // Small delay to ensure modal closes before navigation
      setTimeout(() => {
        navigate(`/profile/${user.id}`);
      }, 100);
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
      // For videos, use the original HLS URL, for images use the image URL
      const mediaUrl = media.type === 'video' ? media.url : media.url;
      openMedia(
        mediaUrl,
        media.type,
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
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div 
        className={cn("absolute inset-0 cursor-pointer", CLUBHOUSE_SHEET_BACKDROP_CLASS)}
        onClick={handleBackdropClick}
      />
      
      {/* Dark Glass Sheet */}
      <div 
        className={cn(
          "clubhouse-profile-sheet glass-dark rounded-t-[24px] relative flex flex-col overflow-hidden",
          "transition-all duration-[280ms] ease-[cubic-bezier(0.19,1,0.22,1)]",
          isClosing ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          maxHeight: CLUBHOUSE_SHEET_HEIGHT,
          width: '100%',
          maxWidth: '100vw'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full px-4 pt-3 pb-6 md:px-6">
          {/* Handle */}
          <div className="flex justify-center pb-3">
            <div className="w-12 h-1 bg-white/30 rounded-full" />
          </div>

          {/* Header / Hero Row */}
          <div ref={headerRef} className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
            {/* Left: avatar + name + meta */}
            <div className="flex flex-1 items-start gap-3 min-w-0">
              {/* Avatar */}
              <button
                onClick={handleAvatarClick}
                className={cn(
                  "flex-shrink-0 transition-transform duration-200",
                  "hover:scale-105 focus:scale-105 focus:outline-none",
                  user?.id ? "cursor-pointer" : "cursor-default"
                )}
                disabled={!user?.id}
              >
                <div className="h-14 w-14 overflow-hidden">
                  <SquircleImage
                    size={56}
                    src={user.avatar || '/placeholder.svg'}
                    alt={user.name}
                    ringWidth={0}
                  />
                </div>
              </button>

              {/* Name, handle, handicap, home club */}
              <div className="flex flex-col min-w-0">
                <button
                  type="button"
                  onClick={handleNameClick}
                  className="text-left text-[16px] font-semibold text-white truncate hover:text-white/80 transition-colors"
                  disabled={!user?.id}
                >
                  {user.name}
                  {user.isVerified && <CheckCircle className="inline-block w-4 h-4 ml-1 text-blue-400" />}
                </button>
                
                {/* Row 2: @handle + handicap */}
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-white/70">
                  {user.username && <span>@{user.username}</span>}
                  {user.username && user.handicap !== undefined && user.handicap !== null && <span>·</span>}
                  {user.handicap !== undefined && user.handicap !== null && (
                    <span>HCP {user.handicap}</span>
                  )}
                </div>
                
                {/* Row 3: home club */}
                {user.homeClub && user.homeClub !== 'Example Golf Club' && (
                  <div className="mt-0.5 text-[13px] text-white/70 truncate">
                    {user.homeClub}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Follow button */}
            <button
              type="button"
              onClick={handleFollowClick}
              disabled={followLoading || optimisticFollowing}
              className={cn(
                "btn-frosted-white px-4 py-1.5 text-[13px] font-semibold rounded-full",
                "bg-white/16 backdrop-blur-[18px] border border-white/45 text-white",
                "shadow-[0_0_12px_rgba(0,0,0,0.35)]",
                "transition-all duration-150",
                "hover:bg-white/22 hover:-translate-y-px hover:shadow-[0_6px_14px_rgba(0,0,0,0.45)]",
                "active:translate-y-0 active:shadow-[0_2px_8px_rgba(0,0,0,0.35)]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {followLoading || optimisticFollowing ? '...' : (isFollowing ? 'Following' : 'Follow')}
            </button>
          </div>

          {/* Scrollable Recent Posts Section */}
          <div className="pt-3">
            <div 
              className="clubhouse-profile-scroll max-h-[60vh] overflow-y-auto overscroll-contain"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth'
              }}
            >
              <h3 className="pb-2 text-[14px] font-semibold text-white">Recent Posts</h3>
              
              {/* Loading State */}
              {postsLoading && (
                <div className="grid grid-cols-2 gap-3 pb-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-black/40 rounded-[18px] animate-pulse"
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
                    className="text-sm text-white/80 hover:text-white transition-colors"
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
                <div className="grid grid-cols-2 gap-3 pb-2">
                  {posts.slice(0, 6).map((post) => {
                    const media = post.post_media[0];
                    if (!media) return null;

                    return (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => handlePostClick(post)}
                        className="relative overflow-hidden rounded-[18px] bg-black/40 aspect-square"
                      >
                        <RecentPostTile
                          media={media}
                          onTileClick={() => {}}
                          ioRoot={scrollRef.current}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MiniProfileSheet = (props: MiniProfileSheetProps) => {
  if (!props.isOpen) return null;
  
  return (
    <SheetPlaybackProvider>
      <MiniProfileSheetContent {...props} />
    </SheetPlaybackProvider>
  );
};

export default MiniProfileSheet;