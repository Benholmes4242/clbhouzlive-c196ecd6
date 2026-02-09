import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Check, Users, UserPlus, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageRoot } from '@/components/layout/PageRoot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useDebounce } from '@/hooks/useDebounce';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useFriendActions } from '@/hooks/useFriendActions';
import { useRelationshipStatus } from '@/hooks/useRelationshipStatus';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { SocialUser } from '@/hooks/useSocialLists';
import { getProfilePathById } from '@/lib/profileRoutes';

export type ListMode = 'followers' | 'following' | 'friends';

interface UserListPageProps {
  mode: ListMode;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  emptyText: string;
  users: SocialUser[];
  totalCount?: number;
  isLoading: boolean;
  error?: Error | null;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  onRefetch?: () => void;
  backPath?: string;
  isOwnProfile?: boolean;
}

export const UserListPage: React.FC<UserListPageProps> = ({
  mode,
  title,
  subtitle,
  searchPlaceholder,
  emptyText: _emptyText, // kept for API compatibility
  users,
  totalCount,
  isLoading,
  error,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onRefetch,
  backPath,
  isOwnProfile = true,
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  // Track IDs optimistically removed (e.g. after unfriend)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // Filter users client-side based on search and optimistic removals
  const filteredUsers = useMemo(() => {
    let result = users.filter(u => !removedIds.has(u.id));
    if (!debouncedSearch.trim()) return result;
    const query = debouncedSearch.toLowerCase();
    return result.filter(u =>
      u.displayName.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      (u.homeClub && u.homeClub.toLowerCase().includes(query))
    );
  }, [users, debouncedSearch, removedIds]);

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
  };

  const displayTotal = Math.max(0, (totalCount ?? users.length) - removedIds.size);
  const isSearching = debouncedSearch.trim().length > 0;

  const handleUserRemoved = (userId: string) => {
    setRemovedIds(prev => new Set(prev).add(userId));
  };

  // Get mode display name for messages
  const modeDisplayName = mode === 'followers' ? 'followers' : mode === 'following' ? 'following' : 'friends';

  return (
    <PageRoot className="min-h-screen bg-[#F8FAFC]">
      <div className="w-full">
        {/* Scrollable header - scrolls away */}
        <div className="px-4 pt-6 pb-4 bg-[#F8FAFC]">
          {/* Back button */}
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {/* Title block */}
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#1e293b] mb-1">
              {title}
              {displayTotal > 0 && (
                <span className="text-sm font-normal text-[#94a3b8] ml-2">
                  ({displayTotal})
                </span>
              )}
            </h1>
            <p className="text-sm text-[#64748b]">{subtitle}</p>
          </div>
        </div>

        {/* Sticky search bar */}
        <div className="sticky top-0 z-40 bg-[#F8FAFC] border-b border-[#e2e8f0]">
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
              <Input
                type="search"
                placeholder={searchPlaceholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-11 rounded-xl border-[#e2e8f0] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus-visible:ring-[#e2e8f0]"
                aria-label={searchPlaceholder}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-[#F8FAFC] min-h-[50vh]">
          {/* Error state */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Something went wrong
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-[260px] mb-6">
                We couldn't load {modeDisplayName}. Please try again.
              </p>
              {onRefetch && (
                <Button variant="outline" size="sm" onClick={onRefetch}>
                  Try again
                </Button>
              )}
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && !error && (
            <div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-4 border-b border-border/30">
                  {/* Avatar skeleton */}
                  <div className="w-14 h-14 rounded-sq-md bg-muted animate-pulse flex-shrink-0" />
                  
                  {/* Content skeleton */}
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-32" />
                    <div className="h-3 bg-muted animate-pulse rounded w-24" />
                    <div className="h-3 bg-muted animate-pulse rounded w-40" />
                    
                    {/* Button skeletons */}
                    <div className="flex gap-2 pt-1">
                      <div className="h-9 bg-muted animate-pulse rounded-md flex-1" />
                      <div className="h-9 bg-muted animate-pulse rounded-md flex-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty states */}
          {!isLoading && !error && filteredUsers.length === 0 && (
            <>
              {isSearching ? (
                /* Search empty state */
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-[#94a3b8]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1e293b] mb-1 text-center">
                    No results found
                  </h3>
                  <p className="text-sm text-[#64748b] text-center max-w-[260px] mb-4">
                    No matches for "{searchInput}"
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              ) : mode === 'followers' ? (
                /* Followers empty state */
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 text-[#64748b]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1e293b] mb-1 text-center">
                    No followers yet
                  </h3>
                  <p className="text-sm text-[#64748b] text-center max-w-[280px] mb-6">
                    {isOwnProfile 
                      ? "When people follow you, they'll appear here."
                      : "When people follow this golfer, they'll appear here."
                    }
                  </p>
                  {isOwnProfile && (
                    <button
                      onClick={() => navigate('/golferstofollow')}
                      className="px-5 py-2.5 bg-[#e2e8f0] text-[#1e293b] text-sm font-medium rounded-full hover:bg-[#cbd5e1] transition-colors"
                    >
                      Find golfers to follow
                    </button>
                  )}
                </div>
              ) : mode === 'friends' ? (
                /* Friends empty state */
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 text-[#64748b]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1e293b] mb-1 text-center">
                    No friends yet
                  </h3>
                  <p className="text-sm text-[#64748b] text-center max-w-[280px] mb-6">
                    {isOwnProfile 
                      ? "Add friends to plan games and share your golf journey together."
                      : "This golfer hasn't added any friends yet."
                    }
                  </p>
                  {isOwnProfile && (
                    <button
                      onClick={() => navigate('/golferstofollow')}
                      className="px-5 py-2.5 bg-[#e2e8f0] text-[#1e293b] text-sm font-medium rounded-full hover:bg-[#cbd5e1] transition-colors"
                    >
                      Find golfers
                    </button>
                  )}
                </div>
              ) : (
                /* Following empty state */
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-4">
                    <UserPlus className="w-7 h-7 text-[#64748b]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1e293b] mb-1 text-center">
                    Not following anyone yet
                  </h3>
                  <p className="text-sm text-[#64748b] text-center max-w-[280px] mb-6">
                    {isOwnProfile 
                      ? "Find golfers to follow and stay updated on their rounds."
                      : "This golfer isn't following anyone yet."
                    }
                  </p>
                  {isOwnProfile && (
                    <button
                      onClick={() => navigate('/golferstofollow')}
                      className="px-5 py-2.5 bg-[#e2e8f0] text-[#1e293b] text-sm font-medium rounded-full hover:bg-[#cbd5e1] transition-colors"
                    >
                      Find golfers to follow
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* User list */}
          {!isLoading && !error && filteredUsers.length > 0 && (
            <InfiniteUserList
              users={filteredUsers}
              currentUserId={user?.id}
              mode={mode}
              hasNextPage={hasNextPage && !isSearching}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={onLoadMore}
              displayTotal={displayTotal}
              showStatus={!isSearching}
              onUserRemoved={handleUserRemoved}
            />
          )}
        </div>
      </div>
    </PageRoot>
  );
};

// ============================================================================
// InfiniteUserList - handles infinite scroll loading
// ============================================================================

interface InfiniteUserListProps {
  users: SocialUser[];
  currentUserId?: string;
  mode: ListMode;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  displayTotal: number;
  showStatus: boolean;
  onUserRemoved?: (userId: string) => void;
}

const InfiniteUserList: React.FC<InfiniteUserListProps> = ({
  users,
  currentUserId,
  mode,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  displayTotal,
  showStatus,
  onUserRemoved,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreLockRef = useRef(false);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!hasNextPage || !onLoadMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isFetchingNextPage && !loadMoreLockRef.current) {
          loadMoreLockRef.current = true;
          onLoadMore();
          // Unlock after a short delay to prevent rapid-fire loads
          setTimeout(() => {
            loadMoreLockRef.current = false;
          }, 500);
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  const modeDisplayName = mode === 'followers' ? 'followers' : mode === 'following' ? 'following' : 'friends';

  return (
    <>
      {/* User list rows */}
      <div>
        {users.map((socialUser) => (
          <UserRowFlat
            key={socialUser.id}
            user={socialUser}
            currentUserId={currentUserId}
            mode={mode}
            onUserRemoved={onUserRemoved}
          />
        ))}
      </div>

      {/* Sentinel for infinite scroll - no visible spinner */}
      {hasNextPage && <div ref={sentinelRef} className="h-1" />}

      {/* Footer count */}
      {showStatus && displayTotal > 0 && (
        <div className="py-6 text-center">
          <p className="text-xs text-[#94a3b8]">
            Showing {users.length} of {displayTotal} {modeDisplayName}
          </p>
        </div>
      )}
    </>
  );
};

// ============================================================================
// UserRowFlat component - matches GolfersToFollowPage row styling
// ============================================================================

interface UserRowFlatProps {
  user: SocialUser;
  currentUserId?: string;
  mode: ListMode;
  onUserRemoved?: (userId: string) => void;
}

const UserRowFlat: React.FC<UserRowFlatProps> = ({ user, currentUserId, mode, onUserRemoved }) => {
  const navigate = useNavigate();
  const isSelf = currentUserId === user.id;

  const { followUser, unfollowUser, loading: followLoading } = useFollowUser();
  const { sendFriendRequest, unfriend, loading: friendLoading } = useFriendActions({
    currentUserId: currentUserId || '',
  });

  const { data: relationship, isLoading: relationshipLoading } = useRelationshipStatus(
    isSelf ? undefined : user.id
  );

  const [optimisticFollow, setOptimisticFollow] = useState<boolean | null>(null);
  const [optimisticFriend, setOptimisticFriend] = useState<'none' | 'pending' | 'friends' | null>(null);

  const isFollowing = optimisticFollow ?? relationship?.isFollowing ?? false;
  const friendStatus: 'none' | 'pending' | 'friends' = optimisticFriend ?? (
    relationship?.isFriend ? 'friends' :
    relationship?.hasPendingFriendRequestToThem ? 'pending' : 'none'
  );

  const handleRowClick = () => {
    const profilePath = getProfilePathById(user.id, user.creatorOnly, user.username);
    navigate(profilePath);
  };

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId || isSelf) return;

    const wasFollowing = isFollowing;
    setOptimisticFollow(!wasFollowing);

    const success = wasFollowing
      ? await unfollowUser(user.id)
      : await followUser(user.id);

    if (!success) {
      setOptimisticFollow(wasFollowing);
      toast({
        description: wasFollowing ? 'Could not unfollow.' : 'Could not follow.',
        variant: 'destructive',
      });
    }
  };

  const handleFriendAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId || isSelf) return;

    if (friendStatus === 'none') {
      setOptimisticFriend('pending');
      const success = await sendFriendRequest(user.id);
      if (!success) {
        setOptimisticFriend('none');
      }
    } else if (friendStatus === 'friends' && mode === 'friends') {
      // Unfriend action for friends page — optimistically remove row
      const success = await unfriend(user.id);
      if (success) {
        onUserRemoved?.(user.id);
      }
    }
  };

  const clubLine = user.homeClub || 'Home club not set';

  return (
    <button
      onClick={handleRowClick}
      className="w-full flex items-start gap-3 px-4 py-4 hover:bg-muted/50 transition-colors text-left border-b border-border/30 last:border-0"
    >
      {/* Avatar */}
      <SquircleAvatar
        src={user.avatarUrl || undefined}
        alt={user.displayName}
        size={56}
        fallback={user.displayName?.charAt(0) || '?'}
        ringColor={getRingColorForTotalPlayed(0)}
        className="flex-shrink-0"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name row */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-semibold text-foreground truncate">
            {user.displayName}
          </span>
        </div>

        {/* Username */}
        <p className="text-xs text-muted-foreground mb-0.5 truncate">
          @{user.username}
        </p>

        {/* Home club - tertiary color */}
        <p className="text-xs text-[#94a3b8] mb-3 truncate">
          {clubLine}
        </p>

        {/* Action buttons */}
        {!isSelf && currentUserId && !relationshipLoading && (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Follow/Following button */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 flex-1 font-medium",
                isFollowing
                  ? "border-border bg-muted text-muted-foreground hover:bg-muted/80"
                  : "border-[#F79E1B] bg-[#F79E1B]/10 text-[#F79E1B] hover:bg-[#F79E1B]/20"
              )}
              disabled={followLoading}
              onClick={handleFollowToggle}
              aria-label={isFollowing ? `Unfollow ${user.displayName}` : `Follow ${user.displayName}`}
            >
              {isFollowing ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Following
                </>
              ) : (
                'Follow'
              )}
            </Button>

            {/* Friend button - hidden for business profiles, varies by mode and status */}
            {user.profileType === 'personal' && (
              mode === 'friends' && friendStatus === 'friends' ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 flex-1 font-medium border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10"
                  disabled={friendLoading}
                  onClick={handleFriendAction}
                  aria-label={`Unfriend ${user.displayName}`}
                >
                  Unfriend
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 flex-1 font-medium",
                    friendStatus === 'friends'
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                      : friendStatus === 'pending'
                      ? "border-border bg-muted/50 text-muted-foreground"
                      : "border-emerald-500/60 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  )}
                  disabled={friendLoading || friendStatus === 'friends' || friendStatus === 'pending'}
                  onClick={handleFriendAction}
                  aria-label={
                    friendStatus === 'friends'
                      ? `Already friends with ${user.displayName}`
                      : friendStatus === 'pending'
                      ? `Friend request pending for ${user.displayName}`
                      : `Send friend request to ${user.displayName}`
                  }
                >
                  {friendStatus === 'friends' ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Friends
                    </>
                  ) : friendStatus === 'pending' ? (
                    'Request sent'
                  ) : (
                    'Add friend'
                  )}
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </button>
  );
};

export default UserListPage;
