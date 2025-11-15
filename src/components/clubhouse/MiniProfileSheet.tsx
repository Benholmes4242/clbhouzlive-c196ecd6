import React, { useState, useEffect } from 'react';
import { X, MapPin, Target, Play, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useUserProfilePosts } from '@/hooks/useUserProfilePosts';
import { useFullscreenMedia } from '@/hooks/useFullscreenMedia';
import { Squircle } from '@/components/ui/squircle';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { SheetPlaybackProvider, useSheetPlayback } from './SheetPlaybackContext';
import { VideoThumbPlayer } from './VideoThumbPlayer';

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
      {/* Enhanced Backdrop with more dimming - make it clickable */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer" 
        onClick={handleBackdropClick}
      />
      
      {/* Liquid Glass Sheet with Fixed Height */}
      <div 
        className={cn(
          "mini-profile-sheet relative flex flex-col overflow-hidden",
          "bg-black/20 backdrop-blur-xl border border-white/10",
          "rounded-t-3xl shadow-2xl shadow-black/50",
          "transition-transform duration-300 ease-out",
          isClosing ? "animate-slide-out-down" : "animate-slide-in-up",
          // Glass surface styling
          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
        )}
        style={{
          paddingBottom: 'var(--bottom-nav-height)'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking on the sheet
      >
        {/* Close Button - moved further to top right and smaller */}
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={handleClose}
            className={cn(
              "p-1 rounded-full transition-all duration-200",
              "bg-black/20 backdrop-blur-sm border border-white/10",
              "hover:bg-white/10 hover:scale-105",
              "focus:ring-2 focus:ring-white/30 focus:outline-none"
            )}
            aria-label="Close profile"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          {/* Header Section with Fixed Height */}
          <div ref={headerRef} className="sheet-header flex-shrink-0">
            {/* Single Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>
            {/* User Info */}
            <div className="px-6 pt-2 pb-6">
              <div className="flex items-start gap-4">
                {/* Clickable Avatar */}
                <button
                  onClick={handleAvatarClick}
                  className={cn(
                    "flex-shrink-0 transition-transform duration-200",
                    "hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full",
                    user?.id ? "cursor-pointer" : "cursor-default"
                  )}
                  disabled={!user?.id}
                >
                  <Squircle width={80} height={80}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '32px', fontWeight: 600 }}>
                        {user.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </Squircle>
                </button>
                
                  <div className="flex-1 min-w-0">
                    {/* Clickable Name - Single Line with Ellipsis */}
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={handleNameClick}
                        className={cn(
                          "text-left transition-colors duration-200 flex-1 min-w-0",
                          "hover:text-white/80 focus:text-white/80 focus:outline-none",
                          user?.id ? "cursor-pointer" : "cursor-default"
                        )}
                        disabled={!user?.id}
                      >
                        <h3 className="sheet-title font-semibold text-lg text-white">
                          {user.name}
                        </h3>
                    </button>
                    {user.isVerified && (
                      <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                  
                  {user.username && (
                    <p className="text-white/60 text-sm mb-2 truncate">@{user.username}</p>
                  )}
                  
                  {/* Conditional Metadata - Single Line */}
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    {user.homeClub && user.homeClub !== 'Example Golf Club' && (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{user.homeClub}</span>
                      </div>
                    )}
                    {user.handicap !== undefined && user.handicap !== null && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Target className="w-4 h-4" />
                        <span>{user.handicap} HCP</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Follow Button - Fixed Width */}
                <button
                  onClick={handleFollowClick}
                  disabled={followLoading || optimisticFollowing}
                  className={cn(
                    "follow-btn px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 min-w-[80px] flex-shrink-0",
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
            <div className="mx-6 mb-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Recent Posts Section - Scrollable */}
          <div className="flex-1 flex flex-col min-h-0">
            <section aria-labelledby="recent-posts-title" className="px-6 flex-1 flex flex-col min-h-0">
              <h4 id="recent-posts-title" className="font-medium text-white mb-4 flex-shrink-0">Recent Posts</h4>
              
              <div
                id="recent-posts-scroll"
                ref={scrollRef}
                role="region"
                aria-label="Recent Posts, scrollable"
                tabIndex={0}
                className="sheet-scroll flex-1"
                style={scrollMaxHeight ? { maxHeight: `${scrollMaxHeight}px` } : undefined}
              >
                {/* Loading State */}
                {postsLoading && (
                  <div className={cn(
                    "grid gap-2 p-2",
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
                    "grid gap-2 p-2",
                    isMobile ? "grid-cols-2" : "grid-cols-3"
                  )}>
                    {posts.slice(0, isMobile ? 6 : 9).map((post) => {
                      const media = post.post_media[0];
                      if (!media) return null;

                    return (
                      <RecentPostTile
                        key={post.id}
                        media={media}
                        onTileClick={() => handlePostClick(post)}
                        ioRoot={scrollRef.current}
                      />
                    );
                    })}
                  </div>
                )}
              </div>
            </section>
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