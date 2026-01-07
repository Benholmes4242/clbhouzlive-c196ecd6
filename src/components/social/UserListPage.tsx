import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Check, Loader2 } from 'lucide-react';
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
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  backPath?: string;
}

export const UserListPage: React.FC<UserListPageProps> = ({
  mode,
  title,
  subtitle,
  searchPlaceholder,
  emptyText,
  users,
  totalCount,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  backPath,
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Filter users client-side based on search
  const filteredUsers = useMemo(() => {
    if (!debouncedSearch.trim()) return users;
    const query = debouncedSearch.toLowerCase();
    return users.filter(u =>
      u.displayName.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      (u.homeClub && u.homeClub.toLowerCase().includes(query))
    );
  }, [users, debouncedSearch]);

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

  const showingCount = filteredUsers.length;
  const displayTotal = totalCount ?? users.length;

  return (
    <PageRoot className="bg-muted/40">
      <div className="w-full">
        {/* Back CTA */}
        <div className="px-4 pt-6">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">Back</span>
          </button>
        </div>

        {/* Title block */}
        <div className="text-center px-4 pt-4 pb-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
            {displayTotal > 0 && (
              <span className="text-[10px] text-muted-foreground/50 ml-1 align-middle">
                {displayTotal}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>

        {/* Search bar */}
        <div className="px-6 mt-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-11 rounded-xl border-border/40 bg-white/35"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="divide-y divide-border/25">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-sq-md bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded-full bg-muted animate-pulse" />
                  <div className="h-3 w-1/3 rounded-full bg-muted/60 animate-pulse" />
                </div>
                <div className="h-7 w-20 rounded-sq-xs bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-4 py-16 px-6">
            {searchInput ? (
              <>
                <p className="text-sm font-medium text-foreground">No results found</p>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  Try a different name or club.
                </p>
                <Button variant="secondary" size="sm" onClick={handleClearSearch}>
                  Clear search
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground max-w-[280px]">{emptyText}</p>
            )}
          </div>
        ) : (
          <>
            {/* User list rows */}
            <div className="divide-y divide-border/25">
              {filteredUsers.map((socialUser) => (
                <UserRowFlat
                  key={socialUser.id}
                  user={socialUser}
                  currentUserId={user?.id}
                  mode={mode}
                />
              ))}
            </div>

            {/* Load more */}
            {hasNextPage && onLoadMore && !searchInput && (
              <div className="mt-6 px-6">
                <Button
                  variant="secondary"
                  onClick={onLoadMore}
                  disabled={isFetchingNextPage}
                  className="w-full max-w-[420px] mx-auto block rounded-xl"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more'
                  )}
                </Button>
              </div>
            )}

            {/* Status text */}
            {displayTotal > 0 && !searchInput && (
              <p className="mt-4 pb-6 text-center text-xs text-muted-foreground">
                Showing {showingCount} of {displayTotal} {mode}
              </p>
            )}
          </>
        )}
      </div>
    </PageRoot>
  );
};

// ============================================================================
// Inline UserRowFlat component (matches GolfersToFollowPage row styling)
// ============================================================================

interface UserRowFlatProps {
  user: SocialUser;
  currentUserId?: string;
  mode: ListMode;
}

const UserRowFlat: React.FC<UserRowFlatProps> = ({ user, currentUserId, mode }) => {
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
    navigate(`/users/${user.id}`);
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
      // Unfriend action for friends page
      const success = await unfriend(user.id);
      if (success) {
        setOptimisticFriend('none');
      }
    }
  };

  const clubLine = user.homeClub || 'Home club not set';

  return (
    <button
      onClick={handleRowClick}
      className="w-full text-left px-6 py-4 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <SquircleAvatar
            src={user.avatarUrl || undefined}
            alt={user.displayName}
            size={56}
            fallback={user.displayName?.charAt(0) || '?'}
            ringColor={getRingColorForTotalPlayed(0)}
          />
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Name */}
          <p className="text-sm font-semibold text-foreground truncate">
            {user.displayName}
          </p>

          {/* Row 2: Username */}
          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>

          {/* Row 3: Home club */}
          <p className="text-sm text-muted-foreground truncate">{clubLine}</p>
          {!isSelf && currentUserId && !relationshipLoading && (
            <div
              className="grid grid-cols-2 gap-2 pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Follow/Following button */}
              {isFollowing ? (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className="h-8 px-3 text-xs font-medium rounded-sq-sm border transition-colors flex items-center justify-center whitespace-nowrap border-border bg-muted text-foreground/80 gap-1"
                >
                  <Check className="h-3 w-3" />
                  Following
                </button>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className="h-8 px-3 text-xs font-medium rounded-sq-sm border transition-colors flex items-center justify-center whitespace-nowrap border-[hsl(var(--tab-orange))] bg-[hsl(var(--tab-orange))]/10 text-[hsl(var(--tab-orange))] hover:bg-[hsl(var(--tab-orange))]/20"
                >
                  Follow
                </button>
              )}

              {/* Friend button */}
              {friendStatus === 'friends' ? (
                mode === 'friends' ? (
                  <button
                    onClick={handleFriendAction}
                    disabled={friendLoading}
                    className="h-8 px-3 text-xs font-medium rounded-sq-sm border transition-colors flex items-center justify-center whitespace-nowrap border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10"
                  >
                    Unfriend
                  </button>
                ) : (
                  <span className="h-8 px-3 text-xs font-medium rounded-sq-sm border transition-colors flex items-center justify-center whitespace-nowrap border-emerald-500/50 bg-emerald-500/10 text-emerald-600 gap-1 cursor-default">
                    <Check className="h-2.5 w-2.5" />
                    Friends
                  </span>
                )
              ) : friendStatus === 'pending' ? (
                <span className="h-8 px-3 text-xs font-medium rounded-sq-sm border transition-colors flex items-center justify-center whitespace-nowrap border-border bg-muted/50 text-muted-foreground cursor-default">
                  Request sent
                </span>
              ) : (
                <button
                  onClick={handleFriendAction}
                  disabled={friendLoading}
                  className="h-8 px-3 text-xs font-medium rounded-sq-sm border transition-colors flex items-center justify-center whitespace-nowrap border-emerald-500/60 bg-transparent text-emerald-600 hover:bg-emerald-50"
                >
                  Add friend
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default UserListPage;
