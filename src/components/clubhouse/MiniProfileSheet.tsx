import React, { useState, useEffect } from 'react';
import { CheckCircle, Building2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useFollow } from '@/hooks/useFollow';
import { useUserProfilePosts } from '@/hooks/useUserProfilePosts';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { SheetPlaybackProvider, useSheetPlayback } from './SheetPlaybackContext';
import { VideoThumbPlayer } from './VideoThumbPlayer';
import { getProfilePathById } from '@/lib/profileRoutes';

interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  username?: string;
  homeClub?: string;
  handicap?: number;
  isFollowing?: boolean;
  isVerified?: boolean;
  // Business profile fields
  profileType?: 'personal' | 'business';
  isBusiness?: boolean;
  businessCategory?: string;
  businessLocation?: string;
  isVerifiedBusiness?: boolean;
  // Creator-only mode
  creatorOnly?: boolean;
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
      <div className="recent-post-tile relative aspect-square rounded-2xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
        <VideoThumbPlayer
          url={media.url}
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
        "recent-post-tile relative aspect-square rounded-2xl overflow-hidden cursor-pointer",
        "transition-all duration-200 hover:scale-105",
        "focus:outline-none focus:ring-2 focus:ring-black/10"
      )}
      style={{ background: 'rgba(0,0,0,0.04)' }}
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
  const navigate = useNavigate();
  
  // Use the new follow hook
  const { isFollowing: followState, busy: followBusy, toggle: toggleFollow, ensureInitial } = useFollow(user?.id);
  
  const { posts, loading: postsLoading, error: postsError, isEmpty } = useUserProfilePosts(user?.id);
  const { openFullscreen } = useUnifiedFullscreen('profile', {});
  const [isClosing, setIsClosing] = useState(false);
  
  const headerRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollMaxHeight, setScrollMaxHeight] = React.useState<number>();
  const { notifySheetClosing, notifySheetOpened } = useSheetPlayback();

  const isBusiness = user.isBusiness || user.profileType === 'business';

  // Initialize follow state on mount
  useEffect(() => {
    ensureInitial();
  }, [ensureInitial]);

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
    notifySheetClosing();
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      notifySheetOpened();
    }, 500);
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
        const path = getProfilePathById(user.id, user.creatorOnly, user.username);
        navigate(path);
      }, 100);
    }
  };

  const handleNameClick = () => {
    if (user?.id) {
      handleClose();
      // Small delay to ensure modal closes before navigation
      setTimeout(() => {
        const path = getProfilePathById(user.id, user.creatorOnly, user.username);
        navigate(path);
      }, 100);
    }
  };

  const handleFollowClick = async () => {
    if (!user?.id || followBusy) return;
    await toggleFollow();
    onFollow?.();
  };

  const isFollowing = followState === 'following';

  const handlePostClick = (postItem: any) => {
    if (postItem.post_media?.length > 0) {
      // Convert post media to ProfileContentItem format
      const items = postItem.post_media.map((m: any, idx: number) => ({
        id: `${postItem.id}-${idx}`,
        type: m.type as 'image' | 'video',
        src: m.url,
        thumbnailSrc: m.poster_url,
        title: postItem.content || '',
        likes: 0,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.avatar || '',
        },
      }));
      openFullscreen(items, 0);
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
        className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer" 
        onClick={handleBackdropClick}
      />
      
      {/* Light Mode Sheet */}
      <div 
        className={cn(
          "clubhouse-profile-sheet rounded-t-[24px] relative flex flex-col overflow-hidden",
          "transition-all ease-in-out",
          isClosing ? "duration-500 translate-y-4 opacity-0" : "duration-500 translate-y-0 opacity-100"
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          maxHeight: '72vh',
          width: '100%',
          maxWidth: '100vw',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.12)',
          background: '#F8FAFC',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full px-4 pt-3 pb-6 md:px-6">
          {/* Handle */}
          <div className="flex justify-center pb-3">
            <div className="w-12 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.15)' }} />
          </div>

          <div ref={headerRef} className="flex items-start justify-between gap-3 pb-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
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
                <div className="h-14 w-14">
                  <SquircleAvatar
                    size={56}
                    src={user.avatar}
                    alt={user.name}
                  />
                </div>
              </button>

              {/* Name, handle, handicap/business info, home club/location */}
              <div className="flex flex-col min-w-0">
                <button
                  type="button"
                  onClick={handleNameClick}
                  className="text-left text-[16px] font-semibold text-foreground truncate hover:text-foreground/80 transition-colors"
                  disabled={!user?.id}
                >
                  {user.name}
                  {user.isVerified && <CheckCircle className="inline-block w-4 h-4 ml-1 text-blue-500" />}
                </button>
                
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]" style={{ color: 'rgba(0,0,0,0.5)' }}>
                  {user.username && <span>@{user.username}</span>}
                  
                  {isBusiness ? (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-full border px-1.5 py-[1px] text-[11px]" style={{ borderColor: 'rgba(0,0,0,0.12)', color: 'rgba(0,0,0,0.5)' }}>
                        <Building2 className="w-2.5 h-2.5" />
                        Business
                      </span>
                      {user.isVerifiedBusiness && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-[1px] text-[11px] text-emerald-600">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Verified
                        </span>
                      )}
                      {user.businessCategory && (
                        <span className="truncate max-w-[100px] text-[11px]" style={{ color: 'rgba(0,0,0,0.4)' }}>
                          {user.businessCategory}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {user.username && user.handicap !== undefined && user.handicap !== null && <span>·</span>}
                      {user.handicap !== undefined && user.handicap !== null && (
                        <span>HCP {user.handicap}</span>
                      )}
                    </>
                  )}
                </div>
                
                {/* Row 3: home club (personal) or location (business) */}
                {isBusiness ? (
                  user.businessLocation && (
                    <div className="mt-0.5 text-[13px] truncate" style={{ color: 'rgba(0,0,0,0.45)' }}>
                      {user.businessLocation}
                    </div>
                  )
                ) : (
                  user.homeClub && user.homeClub !== 'Example Golf Club' && (
                    <div className="mt-0.5 text-[13px] truncate" style={{ color: 'rgba(0,0,0,0.45)' }}>
                      {user.homeClub}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Right: Follow button */}
            <button
              type="button"
              onClick={handleFollowClick}
              disabled={followBusy}
              className={cn(
                "px-4 py-1.5 text-[13px] font-semibold rounded-full",
                "transition-all duration-150",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isFollowing
                  ? "border text-foreground"
                  : "text-white"
              )}
              style={isFollowing
                ? { background: 'transparent', borderColor: 'rgba(0,0,0,0.12)' }
                : { background: 'rgba(0,0,0,0.85)' }
              }
            >
              {followBusy ? '...' : (isFollowing ? 'Following' : 'Follow')}
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
              <h3 className="pb-2 text-[14px] font-semibold text-foreground">Recent Posts</h3>
              
              {/* Loading State */}
              {postsLoading && (
                <div className="grid grid-cols-2 gap-3 pb-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-[18px] animate-pulse" style={{ background: 'rgba(0,0,0,0.06)' }}
                    />
                  ))}
                </div>
              )}

              {/* Error State */}
              {postsError && !postsLoading && (
                <div className="text-center py-8" style={{ color: 'rgba(0,0,0,0.4)' }}>
                  <p className="mb-2">Couldn't load posts</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="text-sm transition-colors" style={{ color: 'rgba(0,0,0,0.55)' }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty State */}
              {isEmpty && !postsLoading && !postsError && (
                <div className="text-center py-8" style={{ color: 'rgba(0,0,0,0.4)' }}>
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
                        className="relative overflow-hidden rounded-[18px] aspect-square" style={{ background: 'rgba(0,0,0,0.04)' }}
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
