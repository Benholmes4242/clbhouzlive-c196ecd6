import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecommendedCreators } from '@/hooks/useRecommendedCreators';
import { useFollowStatus } from '@/hooks/useFollowStatus';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useFirstRunFlag } from '@/hooks/useFirstRunFlag';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, UserPlus, MoreVertical } from 'lucide-react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AVATAR = { size: 72, radius: 14 };

function Skeleton() {
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div
        className="bg-muted animate-pulse"
        style={{ width: AVATAR.size, height: AVATAR.size, borderRadius: AVATAR.radius }}
      />
      <div className="h-3 w-[70px] bg-muted animate-pulse mt-2 rounded" />
    </div>
  );
}

function ScrollHint({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium shadow-lg animate-pulse pointer-events-none">
      Swipe to see more →
    </div>
  );
}

export default function ShortsSuggestedProfiles() {
  const { data: creators, isLoading, error } = useRecommendedCreators(24);
  const { followingIds, updateFollowStatus } = useFollowStatus(creators.map(c => c.id));
  const { followUser, unfollowUser, loading: followLoading } = useFollowUser();
  const { isFirstRun, markAsSeen } = useFirstRunFlag('shorts-squircle');
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [retrying, setRetrying] = useState(false);

  // Dismiss scroll hint on first scroll
  useEffect(() => {
    if (!isFirstRun || !scrollRef.current) return;

    const handleScroll = () => {
      markAsSeen();
    };

    const element = scrollRef.current;
    element.addEventListener('scroll', handleScroll, { once: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [isFirstRun, markAsSeen]);

  const handleAvatarClick = (userId: string, index: number) => {
    const creator = creators.find(c => c.id === userId);
    analyticsEvents.shortsSquircle.avatarClick(userId, index);
    
    // Mark as seen in localStorage
    const seenIds = JSON.parse(localStorage.getItem('seenCreatorImmersiveIds') || '[]');
    if (!seenIds.includes(userId)) {
      localStorage.setItem('seenCreatorImmersiveIds', JSON.stringify([...seenIds, userId]));
    }

    if (creator?.username) {
      navigate(`/user/${creator.username}`);
    }
  };

  const handleNameClick = (username: string | null, index: number) => {
    if (!username) return;
    analyticsEvents.shortsSquircle.nameClick(username, index);
    navigate(`/user/${username}`);
  };

  const handleFollowToggle = async (userId: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isCurrentlyFollowing = followingIds.has(userId);
    const newFollowingState = !isCurrentlyFollowing;

    // Optimistic update
    updateFollowStatus(userId, newFollowingState);
    analyticsEvents.shortsSquircle.followToggle(userId, newFollowingState, index);

    // API call
    const success = newFollowingState 
      ? await followUser(userId)
      : await unfollowUser(userId);

    // Rollback on error
    if (!success) {
      updateFollowStatus(userId, isCurrentlyFollowing);
    }
  };

  const handleCreateClick = () => {
    analyticsEvents.shortsSquircle.plusClick();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        const event = new CustomEvent('open-create-moment', { detail: { files } });
        window.dispatchEvent(event);
      }
    };
    input.click();
  };

  const handleMuteCreator = (userId: string, username: string | null) => {
    const mutedIds = JSON.parse(localStorage.getItem('muted_creator_ids') || '[]');
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
    const mutedData = JSON.parse(localStorage.getItem('muted_creator_data') || '{}');
    
    mutedData[userId] = expiresAt;
    localStorage.setItem('muted_creator_ids', JSON.stringify([...mutedIds, userId]));
    localStorage.setItem('muted_creator_data', JSON.stringify(mutedData));
    
    toast.success(`Hidden suggestions from ${username || 'this creator'} for 30 days`);
    window.location.reload(); // Refresh to update list
  };

  const handleCopyProfileLink = (username: string | null) => {
    if (!username) return;
    const url = `${window.location.origin}/user/${username}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied!');
  };

  const handleRetry = async () => {
    setRetrying(true);
    // Force re-fetch by reloading
    window.location.reload();
  };

  const handleImageLoad = (creatorId: string) => {
    setLoadedImages(prev => new Set([...prev, creatorId]));
  };

  // Check for seen creators
  const getSeenCreators = () => {
    return new Set(JSON.parse(localStorage.getItem('seenCreatorImmersiveIds') || '[]'));
  };
  const seenCreators = getSeenCreators();

  // Error state
  if (error && !retrying) {
    return (
      <div className="mt-3 px-3 mb-4">
        <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Couldn't load suggestions</p>
          <button
            onClick={handleRetry}
            className="text-sm text-primary hover:underline font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !creators.length) {
    return (
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-3 mt-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (!creators.length) {
    analyticsEvents.shortsSquircle.empty();
    return null;
  }

  return (
    <div className="relative edge-fade mt-3 px-3 mb-4">
      {isFirstRun && <ScrollHint onDismiss={markAsSeen} />}
      
      <div ref={scrollRef} className="overflow-x-auto no-scrollbar">
        <div className="flex gap-4 pr-3">
          {/* + SQUIRCLE */}
          <div className="flex flex-col items-center flex-shrink-0">
            <button
              onClick={handleCreateClick}
              aria-label="Create moment"
              className="flex items-center justify-center bg-background border border-border shadow-sm active:scale-[0.96] transition-transform"
              style={{ width: AVATAR.size, height: AVATAR.size, borderRadius: AVATAR.radius }}
            >
              <span className="text-2xl leading-none text-foreground">＋</span>
            </button>
            <p className="text-xs text-muted-foreground mt-1 truncate w-[70px] text-center">Add</p>
          </div>

          {/* CREATOR SQUIRCLES */}
          {creators.map((creator, index) => {
            const name = creator.display_name || creator.username || 'Creator';
            const initials = name.slice(0, 2).toUpperCase();
            const isFollowing = followingIds.has(creator.id);
            const hasRecentPost = creator.has_recent_post && !seenCreators.has(creator.id);
            const imageLoaded = loadedImages.has(creator.id);

            return (
              <div key={creator.id} className="flex flex-col items-center flex-shrink-0 relative group">
                {/* Avatar with ring for recent posts */}
                <div className="relative">
                  {hasRecentPost && (
                    <div 
                      className="absolute -inset-[2px] rounded-[16px] bg-gradient-to-tr from-primary via-primary/70 to-primary/40 animate-pulse"
                      style={{ borderRadius: AVATAR.radius + 2 }}
                    />
                  )}
                  <button
                    className="relative overflow-hidden border border-border shadow-sm bg-background active:scale-[0.96] transition-all"
                    onClick={() => handleAvatarClick(creator.id, index)}
                    onMouseEnter={() => {
                      // Prefetch on hover (desktop only)
                      if (window.innerWidth >= 768) {
                        // TODO: Add prefetch logic here when implemented
                      }
                    }}
                    aria-label={`View ${name}'s profile`}
                    style={{ width: AVATAR.size, height: AVATAR.size, borderRadius: AVATAR.radius }}
                  >
                    <Avatar className="w-full h-full rounded-none">
                      <AvatarImage
                        src={creator.profile_photo_url || undefined}
                        alt={name}
                        className={`object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => handleImageLoad(creator.id)}
                      />
                      <AvatarFallback className="rounded-none text-lg font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    {/* Follow/Following button */}
                    <button
                      onClick={(e) => handleFollowToggle(creator.id, index, e)}
                      disabled={followLoading}
                      className={`absolute bottom-1 right-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all shadow-sm ${
                        isFollowing
                          ? 'bg-muted/90 text-muted-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                      role="button"
                      aria-pressed={isFollowing}
                    >
                      {isFollowing ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <UserPlus className="w-3 h-3" />
                      )}
                    </button>
                  </button>

                  {/* Context menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleAvatarClick(creator.id, index)}>
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleMuteCreator(creator.id, creator.username)}>
                        Mute Suggestions from {name}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyProfileLink(creator.username)}>
                        Copy Profile Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <button
                  onClick={() => handleNameClick(creator.username, index)}
                  className="text-xs text-foreground mt-1 truncate w-[70px] text-center hover:text-primary transition-colors"
                  title={name}
                >
                  {name}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
