import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  Search,
  Check,
  Users,
  UserPlus,
  AlertCircle,
  MoreHorizontal,
  MessageCircle,
  X,
  UserMinus,
  BellOff,
  Ban,
  User as UserIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PageRoot } from '@/components/layout/PageRoot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useDebounce } from '@/hooks/useDebounce';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useFriendActions } from '@/hooks/useFriendActions';
import { useRelationshipStatuses, type RelationshipStatusRow } from '@/hooks/useRelationshipStatuses';
import { SuggestedCreatorsShelf } from '@/components/shared/SuggestedCreatorsShelf';
import { Sheet, SheetContent } from '@/components/ui/sheet';

import { toast } from 'sonner';
import type { SocialUser } from '@/hooks/useSocialLists';
import { getProfilePathById } from '@/lib/profileRoutes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Locked editorial tokens — consistent with polish arc
const INK = '#0F172A';
const INK_SOFT = '#475569';
const INK_SUBTLE = '#94A3B8';
const INK_FAINT = '#CBD5E1';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97A10';
const AMBER_WASH = 'rgba(247,147,30,0.08)';
const AMBER_BORDER = 'rgba(247,147,30,0.30)';
const BORDER = 'rgba(15,23,42,0.07)';
const BG_SURFACE = '#F8FAFC';
const FONT_SERIF = 'Georgia, "Times New Roman", serif';

export type ListMode = 'followers' | 'following' | 'friends';

interface UserListPageProps {
  mode: ListMode;
  title: string;
  /** @deprecated No longer rendered internally; will be removed once consumers updated */
  subtitle: string;
  /** @deprecated Kept for backward compatibility — internal placeholder is now uniform. TODO: remove once consumers updated. */
  searchPlaceholder: string;
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
  // Following tab support (only for followers mode)
  followingUsers?: SocialUser[];
  followingTotalCount?: number;
  followingIsLoading?: boolean;
  followingError?: Error | null;
  followingHasNextPage?: boolean;
  followingIsFetchingNextPage?: boolean;
  onFollowingLoadMore?: () => void;
  onFollowingRefetch?: () => void;
  profileUsername?: string;
}

// ---------------------------------------------------------------------------
// Editorial helpers
// ---------------------------------------------------------------------------

const SectionEyebrow: React.FC<{ label: string; count?: number }> = ({ label, count }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ width: 3, height: 10, background: AMBER, borderRadius: 1 }} />
    <span
      style={{
        fontSize: 10,
        fontWeight: 800,
        color: INK_SUBTLE,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        fontFeatureSettings: '"kern" 1, "liga" 1',
      }}
    >
      {label}
    </span>
    {count != null && (
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: INK_FAINT,
          letterSpacing: '0.16em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count.toLocaleString()}
      </span>
    )}
  </div>
);

const FriendBadge: React.FC = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 6px',
      borderRadius: 4,
      background: AMBER_WASH,
      border: `1px solid ${AMBER_BORDER}`,
      color: AMBER_DEEP,
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      lineHeight: 1,
      flexShrink: 0,
    }}
  >
    Friend
  </span>
);

const HandicapInline: React.FC<{ value: number }> = ({ value }) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        color: INK_SUBTLE,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      HCP
    </span>
    <span
      style={{
        fontFamily: FONT_SERIF,
        fontSize: 12,
        fontWeight: 700,
        color: INK,
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"kern" 1, "liga" 1',
      }}
    >
      {value.toFixed(1)}
    </span>
  </span>
);

// ---------------------------------------------------------------------------
// Relationship UI state derivation + primary action config
// ---------------------------------------------------------------------------

type RelationshipUIState =
  | 'self'
  | 'stranger'
  | 'following'
  | 'friends'
  | 'friend_request_sent'
  | 'friend_request_received';

interface PrimaryActionConfig {
  label: string;
  icon: React.ReactNode;
  isAmber: boolean;
  ariaLabel: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

function getPrimaryActionConfig(
  state: RelationshipUIState,
  user: SocialUser,
  handlers: {
    onFollow: (e: React.MouseEvent) => void;
    onMessage: (e: React.MouseEvent) => void;
    onCancelRequest: (e: React.MouseEvent) => void;
    onAcceptRequest: (e: React.MouseEvent) => void;
  },
  loading: boolean,
): PrimaryActionConfig | null {
  switch (state) {
    case 'self':
      return null;
    case 'stranger':
      return {
        label: 'Follow',
        icon: <UserPlus className="w-3.5 h-3.5" />,
        isAmber: true,
        ariaLabel: `Follow ${user.displayName}`,
        onClick: handlers.onFollow,
        disabled: loading,
      };
    case 'following':
    case 'friends':
      return {
        label: 'Message',
        icon: <MessageCircle className="w-3.5 h-3.5" />,
        isAmber: false,
        ariaLabel: `Message ${user.displayName}`,
        onClick: handlers.onMessage,
      };
    case 'friend_request_sent':
      return {
        label: 'Cancel',
        icon: <X className="w-3.5 h-3.5" />,
        isAmber: false,
        ariaLabel: `Cancel friend request to ${user.displayName}`,
        onClick: handlers.onCancelRequest,
        disabled: loading,
      };
    case 'friend_request_received':
      return {
        label: 'Accept',
        icon: <Check className="w-3.5 h-3.5" />,
        isAmber: true,
        ariaLabel: `Accept friend request from ${user.displayName}`,
        onClick: handlers.onAcceptRequest,
        disabled: loading,
      };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export const UserListPage: React.FC<UserListPageProps> = ({
  mode,
  title,
  subtitle: _subtitle,
  searchPlaceholder: _searchPlaceholder,
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
  followingUsers,
  followingTotalCount,
  followingIsLoading,
  followingError,
  followingHasNextPage,
  followingIsFetchingNextPage,
  onFollowingLoadMore,
  onFollowingRefetch,
  profileUsername: _profileUsername,
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const hasFollowingTab = mode === 'followers' && followingUsers !== undefined;
  const initialTab = searchParams.get('tab') === 'following' ? 'following' : 'followers';
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(hasFollowingTab ? initialTab : 'followers');

  const handleTabChange = (tab: 'followers' | 'following') => {
    setActiveTab(tab);
    setSearchInput('');
    setRemovedIds(new Set());
    if (tab === 'following') {
      setSearchParams({ tab: 'following' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const isFollowingTab = hasFollowingTab && activeTab === 'following';
  const activeUsers = isFollowingTab ? (followingUsers ?? []) : users;
  const activeTotalCount = isFollowingTab ? followingTotalCount : totalCount;
  const activeIsLoading = isFollowingTab ? (followingIsLoading ?? false) : isLoading;
  const activeError = isFollowingTab ? (followingError ?? null) : error;
  const activeHasNextPage = isFollowingTab ? followingHasNextPage : hasNextPage;
  const activeIsFetchingNextPage = isFollowingTab ? followingIsFetchingNextPage : isFetchingNextPage;
  const activeOnLoadMore = isFollowingTab ? onFollowingLoadMore : onLoadMore;
  const activeOnRefetch = isFollowingTab ? onFollowingRefetch : onRefetch;
  const activeMode: ListMode = isFollowingTab ? 'following' : mode;

  const displayTitle = isFollowingTab ? 'Following' : title;

  const filteredUsers = useMemo(() => {
    let result = activeUsers.filter(u => !removedIds.has(u.id));
    if (!debouncedSearch.trim()) return result;
    const query = debouncedSearch.toLowerCase();
    return result.filter(u =>
      u.displayName.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      (u.homeClub && u.homeClub.toLowerCase().includes(query))
    );
  }, [activeUsers, debouncedSearch, removedIds]);

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleClearSearch = () => setSearchInput('');

  const displayTotal = Math.max(0, (activeTotalCount ?? activeUsers.length) - removedIds.size);
  const isSearching = debouncedSearch.trim().length > 0;

  const handleUserRemoved = (userId: string) => {
    setRemovedIds(prev => new Set(prev).add(userId));
  };

  const modeDisplayName =
    activeMode === 'followers' ? 'followers' : activeMode === 'following' ? 'following' : 'friends';

  const visibleUserIds = useMemo(() => filteredUsers.map(u => u.id), [filteredUsers]);
  const { data: relationshipMap = {} } = useRelationshipStatuses(visibleUserIds);

  // Tab counts (for inline tab toggle)
  const followersTabCount = Math.max(0, (totalCount ?? users.length) - removedIds.size);
  const followingTabCount = followingTotalCount ?? (followingUsers?.length ?? 0);

  return (
    <PageRoot className="min-h-screen" style={{ background: BG_SURFACE }}>
      <div className="w-full">
        {/* Sticky editorial header */}
        <div
          className="sticky top-0 z-40 backdrop-blur-xl"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
            background: 'rgba(248,250,252,0.97)',
            borderBottom: `0.5px solid ${BORDER}`,
          }}
        >
          {/* Back row */}
          <div className="flex items-center px-2 pt-1 pb-1">
            <button
              onClick={handleBack}
              className="flex items-center justify-center min-h-[44px] min-w-[44px]"
              style={{ color: INK }}
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Eyebrow + title */}
          <div className="px-5 pb-3">
            <SectionEyebrow label="Network" />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
              <h1
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 32,
                  fontWeight: 900,
                  color: INK,
                  lineHeight: 1.05,
                  letterSpacing: '-0.01em',
                  margin: 0,
                  fontFeatureSettings: '"kern" 1, "liga" 1',
                }}
              >
                {displayTitle}
              </h1>
              {displayTotal > 0 && (
                <span
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: 26,
                    fontWeight: 700,
                    color: AMBER_DEEP,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.05,
                  }}
                >
                  {displayTotal.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Search + tabs */}
          <div className="px-4 pb-3 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: INK_SUBTLE }} />
              <Input
                type="search"
                placeholder="Search by name or club"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-11 rounded-xl focus-visible:ring-[#F7931E]/40"
                style={{ background: '#ffffff', border: `1px solid ${BORDER}`, color: INK }}
                aria-label="Search by name or club"
              />
            </div>

            {hasFollowingTab && (
              <div className="flex gap-2">
                {(['followers', 'following'] as const).map((tabKey) => {
                  const isActive = activeTab === tabKey;
                  const count = tabKey === 'followers' ? followersTabCount : followingTabCount;
                  const label = tabKey === 'followers' ? 'Followers' : 'Following';
                  return (
                    <button
                      key={tabKey}
                      onClick={() => handleTabChange(tabKey)}
                      aria-pressed={isActive}
                      style={{
                        flex: 1,
                        minHeight: 36,
                        background: isActive ? INK : 'transparent',
                        color: isActive ? '#FFFFFF' : INK_SOFT,
                        border: isActive ? 'none' : `1px solid ${BORDER}`,
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {label}
                      <span
                        style={{
                          opacity: isActive ? 0.85 : 0.7,
                          fontWeight: 600,
                        }}
                      >
                        {count.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Suggested Golfers strip — owner view, no active search */}
        {isOwnProfile && !isSearching && user?.id && (
          <SuggestedCreatorsShelf
            userId={user.id}
            title="Discover · Suggested Golfers"
            variant="light"
            showViewAll
            onViewAll={() => navigate('/golferstofollow')}
          />
        )}

        {/* Content */}
        <div style={{ background: BG_SURFACE }} className="min-h-[50vh]">
          {/* Error state */}
          {activeError && !activeIsLoading && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 style={{ fontFamily: FONT_SERIF, fontSize: 20, fontWeight: 700, color: INK, marginBottom: 4 }}>
                Something went wrong
              </h3>
              <p className="text-sm text-center max-w-[260px] mb-6" style={{ color: INK_SOFT }}>
                We couldn't load {modeDisplayName}. Please try again.
              </p>
              {activeOnRefetch && (
                <button
                  onClick={activeOnRefetch}
                  className="px-5 py-2.5 text-white text-sm font-semibold rounded-full transition-colors active:scale-[0.97] min-h-[44px]"
                  style={{ backgroundColor: AMBER }}
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {/* Loading skeletons */}
          {activeIsLoading && !activeError && (
            <div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{ borderBottom: `0.5px solid ${BORDER}`, background: '#FFFFFF' }}
                >
                  <div className="w-14 h-14 rounded-sq-md animate-pulse flex-shrink-0" style={{ background: 'rgba(15,23,42,0.08)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 animate-pulse rounded w-32" style={{ background: 'rgba(15,23,42,0.08)' }} />
                    <div className="h-3 animate-pulse rounded w-24" style={{ background: 'rgba(15,23,42,0.06)' }} />
                    <div className="h-3 animate-pulse rounded w-40" style={{ background: 'rgba(15,23,42,0.06)' }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-9 w-24 animate-pulse rounded-md" style={{ background: 'rgba(15,23,42,0.06)' }} />
                    <div className="h-9 w-9 animate-pulse rounded-md" style={{ background: 'rgba(15,23,42,0.04)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty states */}
          {!activeIsLoading && !activeError && filteredUsers.length === 0 && (
            <>
              {isSearching ? (
                <EmptyState
                  eyebrow="No matches"
                  icon={<Search className="w-6 h-6" style={{ color: INK_SUBTLE }} />}
                  heading="No results found"
                  body={`No matches for "${searchInput}"`}
                  ctaLabel="Clear search"
                  ctaIsAmber={false}
                  onCta={handleClearSearch}
                />
              ) : activeMode === 'followers' ? (
                <EmptyState
                  eyebrow="Empty list"
                  icon={<Users className="w-7 h-7" style={{ color: INK_SUBTLE }} />}
                  heading="No followers yet"
                  body={
                    isOwnProfile
                      ? "When people follow you, they'll appear here."
                      : "When people follow this golfer, they'll appear here."
                  }
                  ctaLabel={isOwnProfile ? 'Find golfers to follow' : undefined}
                  ctaIsAmber
                  onCta={isOwnProfile ? () => navigate('/golferstofollow') : undefined}
                />
              ) : activeMode === 'friends' ? (
                <EmptyState
                  eyebrow="Empty list"
                  icon={<Users className="w-7 h-7" style={{ color: INK_SUBTLE }} />}
                  heading="No friends yet"
                  body={
                    isOwnProfile
                      ? 'Add friends to plan games and share your golf journey together.'
                      : "This golfer hasn't added any friends yet."
                  }
                  ctaLabel={isOwnProfile ? 'Find golfers' : undefined}
                  ctaIsAmber
                  onCta={isOwnProfile ? () => navigate('/golferstofollow') : undefined}
                />
              ) : (
                <EmptyState
                  eyebrow="Empty list"
                  icon={<UserPlus className="w-7 h-7" style={{ color: INK_SUBTLE }} />}
                  heading="Not following anyone yet"
                  body={
                    isOwnProfile
                      ? 'Find golfers to follow and stay updated on their rounds.'
                      : "This golfer isn't following anyone yet."
                  }
                  ctaLabel={isOwnProfile ? 'Find golfers to follow' : undefined}
                  ctaIsAmber
                  onCta={isOwnProfile ? () => navigate('/golferstofollow') : undefined}
                />
              )}
            </>
          )}

          {/* User list */}
          {!activeIsLoading && !activeError && filteredUsers.length > 0 && (
            <>
              <div style={{ padding: '20px 20px 10px' }}>
                <SectionEyebrow
                  label={
                    activeMode === 'followers' ? 'All Followers' :
                    activeMode === 'following' ? 'All Following' :
                    'All Friends'
                  }
                  count={displayTotal}
                />
              </div>
              <InfiniteUserList
                users={filteredUsers}
                currentUserId={user?.id}
                mode={activeMode}
                hasNextPage={activeHasNextPage && !isSearching}
                isFetchingNextPage={activeIsFetchingNextPage}
                onLoadMore={activeOnLoadMore}
                onUserRemoved={handleUserRemoved}
                relationshipMap={relationshipMap}
                isOwnProfile={isOwnProfile}
              />
            </>
          )}
        </div>
      </div>
    </PageRoot>
  );
};

// ---------------------------------------------------------------------------
// Empty state primitive (editorial)
// ---------------------------------------------------------------------------

const EmptyState: React.FC<{
  eyebrow: string;
  icon: React.ReactNode;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaIsAmber: boolean;
  onCta?: () => void;
}> = ({ eyebrow, icon, heading, body, ctaLabel, ctaIsAmber, onCta }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6">
    <div style={{ marginBottom: 12 }}>
      <SectionEyebrow label={eyebrow} />
    </div>
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
      style={{ background: 'rgba(15,23,42,0.05)', border: `1px solid ${BORDER}` }}
    >
      {icon}
    </div>
    <h3
      style={{
        fontFamily: FONT_SERIF,
        fontSize: 20,
        fontWeight: 700,
        color: INK,
        marginBottom: 4,
        textAlign: 'center',
      }}
    >
      {heading}
    </h3>
    <p className="text-sm text-center max-w-[280px] mb-6" style={{ color: INK_SOFT }}>
      {body}
    </p>
    {ctaLabel && onCta && (
      <button
        onClick={onCta}
        className="px-5 py-2.5 text-sm font-semibold rounded-full transition-colors active:scale-[0.97] min-h-[44px]"
        style={
          ctaIsAmber
            ? { backgroundColor: AMBER, color: '#FFFFFF' }
            : { background: 'transparent', color: INK_SOFT }
        }
      >
        {ctaLabel}
      </button>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// InfiniteUserList
// ---------------------------------------------------------------------------

interface InfiniteUserListProps {
  users: SocialUser[];
  currentUserId?: string;
  mode: ListMode;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  onUserRemoved?: (userId: string) => void;
  relationshipMap: Record<string, RelationshipStatusRow>;
  isOwnProfile: boolean;
}

const InfiniteUserList: React.FC<InfiniteUserListProps> = ({
  users,
  currentUserId,
  mode,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onUserRemoved,
  relationshipMap,
  isOwnProfile,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreLockRef = useRef(false);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
          lockTimerRef.current = setTimeout(() => {
            loadMoreLockRef.current = false;
          }, 500);
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  return (
    <>
      <div>
        {users.map((socialUser) => (
          <UserRowFlat
            key={socialUser.id}
            user={socialUser}
            currentUserId={currentUserId}
            mode={mode}
            onUserRemoved={onUserRemoved}
            relationshipStatus={relationshipMap[socialUser.id]}
            isOwnProfile={isOwnProfile}
          />
        ))}
      </div>

      {hasNextPage && <div ref={sentinelRef} className="h-1" />}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div
            className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: AMBER, borderTopColor: 'transparent' }}
          />
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// UserRowFlat — single primary action + kebab
// ---------------------------------------------------------------------------

interface UserRowFlatProps {
  user: SocialUser;
  currentUserId?: string;
  mode: ListMode;
  onUserRemoved?: (userId: string) => void;
  relationshipStatus?: RelationshipStatusRow;
  isOwnProfile: boolean;
}

const UserRowFlat: React.FC<UserRowFlatProps> = ({
  user,
  currentUserId,
  mode: _mode,
  onUserRemoved,
  relationshipStatus,
  isOwnProfile,
}) => {
  const navigate = useNavigate();
  const isSelf = currentUserId === user.id;

  const { followUser, unfollowUser, loading: followLoading } = useFollowUser();
  const {
    sendFriendRequest: _sendFriendRequest,
    acceptFriendRequest,
    cancelFriendRequest,
    unfriend,
    loading: friendLoading,
  } = useFriendActions({
    currentUserId: currentUserId || '',
  });

  const [optimisticFollow, setOptimisticFollow] = useState<boolean | null>(null);
  const [optimisticFriend, setOptimisticFriend] =
    useState<'none' | 'pending' | 'friends' | null>(null);
  const [showUnfriendDialog, setShowUnfriendDialog] = useState(false);
  const [showKebabSheet, setShowKebabSheet] = useState(false);

  const isFollowing = optimisticFollow ?? relationshipStatus?.is_following ?? false;

  const uiState: RelationshipUIState = (() => {
    if (isSelf) return 'self';
    if (optimisticFriend === 'friends') return 'friends';
    if (optimisticFriend === 'pending') return 'friend_request_sent';
    if (optimisticFriend === 'none') {
      // Cancelled/unfriended optimistically — fall through to follow state
      if (isFollowing) return 'following';
      return 'stranger';
    }
    if (relationshipStatus?.friend_status === 'friends') return 'friends';
    if (relationshipStatus?.friend_status === 'pending_sent') return 'friend_request_sent';
    if (relationshipStatus?.friend_status === 'pending_received') return 'friend_request_received';
    if (isFollowing) return 'following';
    return 'stranger';
  })();

  const isFriend = uiState === 'friends';
  const isPersonalProfile = user.profileType === 'personal';

  const handleRowClick = () => {
    const profilePath = getProfilePathById(user.id, user.creatorOnly, user.username);
    navigate(profilePath);
  };

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId || isSelf) return;
    const wasFollowing = isFollowing;
    setOptimisticFollow(!wasFollowing);
    const success = wasFollowing ? await unfollowUser(user.id) : await followUser(user.id);
    if (!success) {
      setOptimisticFollow(wasFollowing);
      toast.error(wasFollowing ? 'Could not unfollow.' : 'Could not follow.');
    }
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    // NOTE: No /messages?to= route exists yet. Routing to inbox until DM-create
    // surface is built. Tracked in Brief #6 resume queue.
    navigate('/messages');
  };

  const handleCancelRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOptimisticFriend('none');
    const success = await cancelFriendRequest(user.id);
    if (!success) setOptimisticFriend('pending');
  };

  const handleAcceptRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOptimisticFriend('friends');
    const success = await acceptFriendRequest(user.id);
    if (!success) setOptimisticFriend(null);
  };

  const confirmUnfriend = async () => {
    setShowUnfriendDialog(false);
    const success = await unfriend(user.id);
    if (success) {
      onUserRemoved?.(user.id);
    }
  };

  const primaryAction = getPrimaryActionConfig(
    uiState,
    user,
    {
      onFollow: handleFollowToggle,
      onMessage: handleMessage,
      onCancelRequest: handleCancelRequest,
      onAcceptRequest: handleAcceptRequest,
    },
    followLoading || friendLoading,
  );

  const showHandicap = user.handicapIndex != null && user.showHandicap;
  // Brief #6: kebab visible only on owner view (visitors don't manage relationships)
  const showKebab = isOwnProfile && !isSelf && !!currentUserId && isPersonalProfile;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleRowClick();
        }}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors active:bg-[rgba(15,23,42,0.03)] cursor-pointer"
        style={{ background: '#FFFFFF' }}
      >
        <SquircleAvatar
          src={user.avatarUrl || undefined}
          alt={user.displayName}
          size={56}
          fallback={user.displayName?.charAt(0) || '?'}
          hideRing
          className="flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
            <span
              className="truncate"
              style={{ fontSize: 14, fontWeight: 700, color: INK, letterSpacing: '-0.005em' }}
            >
              {user.displayName}
            </span>
            {isFriend && <FriendBadge />}
          </div>

          {user.username && (
            <p className="text-xs truncate" style={{ color: INK_SUBTLE, marginBottom: 2 }}>
              @{user.username}
            </p>
          )}

          {(user.homeClub || showHandicap) && (
            <div className="flex items-center gap-1.5 min-w-0" style={{ marginTop: 2 }}>
              {user.homeClub && (
                <span className="text-xs truncate" style={{ color: INK_SOFT }}>
                  {user.homeClub}
                </span>
              )}
              {user.homeClub && showHandicap && (
                <span style={{ color: INK_FAINT, fontSize: 11 }}>·</span>
              )}
              {showHandicap && <HandicapInline value={user.handicapIndex as number} />}
            </div>
          )}
        </div>

        {!isSelf && currentUserId && (
          <div
            className="flex items-center gap-1.5 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                aria-label={primaryAction.ariaLabel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: primaryAction.disabled ? 'default' : 'pointer',
                  opacity: primaryAction.disabled ? 0.6 : 1,
                  background: primaryAction.isAmber ? AMBER : '#FFFFFF',
                  color: primaryAction.isAmber ? '#FFFFFF' : INK,
                  border: primaryAction.isAmber ? 'none' : `1px solid ${BORDER}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {primaryAction.icon}
                {primaryAction.label}
              </button>
            )}
            {showKebab && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowKebabSheet(true);
                }}
                aria-label={`More actions for ${user.displayName}`}
                style={{
                  width: 36,
                  height: 36,
                  background: 'transparent',
                  border: 0,
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: INK_SUBTLE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inset divider */}
      <div className="ml-[72px]" style={{ borderBottom: `0.5px solid ${BORDER}` }} />

      {/* Kebab actions sheet */}
      <Sheet open={showKebabSheet} onOpenChange={setShowKebabSheet}>
        <SheetContent
          side="bottom"
          className="p-0 rounded-t-2xl"
          style={{ background: '#FFFFFF', border: 'none', maxHeight: '80vh' }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div style={{ width: 36, height: 4, borderRadius: 2, background: INK_FAINT }} />
          </div>

          {/* Header */}
          <div className="px-5 pt-3 pb-2">
            <SectionEyebrow label="Actions" />
            <div
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 18,
                fontWeight: 700,
                color: INK,
                marginTop: 4,
              }}
            >
              {user.displayName}
            </div>
          </div>

          <div style={{ borderTop: `0.5px solid ${BORDER}` }}>
            <KebabAction
              icon={<UserIcon className="w-4 h-4" />}
              label="View profile"
              onClick={() => {
                setShowKebabSheet(false);
                handleRowClick();
              }}
            />
            <KebabAction
              icon={<BellOff className="w-4 h-4" />}
              label="Mute notifications"
              onClick={() => {
                setShowKebabSheet(false);
                toast.success('Mute coming soon');
              }}
            />
            {uiState === 'following' && (
              <KebabAction
                icon={<UserMinus className="w-4 h-4" />}
                label="Unfollow"
                onClick={async () => {
                  setShowKebabSheet(false);
                  await handleFollowToggle({ stopPropagation: () => {} } as React.MouseEvent);
                }}
              />
            )}
            {uiState === 'friends' && (
              <KebabAction
                icon={<UserMinus className="w-4 h-4" />}
                label="Remove friend"
                onClick={() => {
                  setShowKebabSheet(false);
                  setShowUnfriendDialog(true);
                }}
              />
            )}
            {uiState === 'friend_request_sent' && (
              <KebabAction
                icon={<X className="w-4 h-4" />}
                label="Cancel friend request"
                onClick={async () => {
                  setShowKebabSheet(false);
                  await handleCancelRequest({ stopPropagation: () => {} } as React.MouseEvent);
                }}
              />
            )}
            <KebabAction
              icon={<Ban className="w-4 h-4" />}
              label="Block"
              destructive
              onClick={() => {
                setShowKebabSheet(false);
                toast.success('Block coming soon');
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Unfriend confirmation — preserved */}
      <AlertDialog open={showUnfriendDialog} onOpenChange={setShowUnfriendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove friend?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll no longer be friends with {user.displayName}. You can send a friend request again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnfriend}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const KebabAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}> = ({ icon, label, destructive, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-5 py-3.5 text-left active:bg-[rgba(15,23,42,0.03)]"
    style={{
      borderBottom: `0.5px solid ${BORDER}`,
      color: destructive ? '#DC2626' : INK,
      background: '#FFFFFF',
      minHeight: 48,
    }}
  >
    <span style={{ color: destructive ? '#DC2626' : INK_SOFT, display: 'inline-flex' }}>
      {icon}
    </span>
    <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
  </button>
);

export default UserListPage;
