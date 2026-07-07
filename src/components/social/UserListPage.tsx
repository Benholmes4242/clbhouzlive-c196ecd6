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
import { SquircleAvatar, LIGHT_HAIRLINE} from '@/components/ui/SquircleAvatar';
import { useDebounce } from '@/hooks/useDebounce';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useFriendActions } from '@/hooks/useFriendActions';
import { useRelationshipStatuses, type RelationshipStatusRow } from '@/hooks/useRelationshipStatuses';
import { useSocialCounts } from '@/hooks/useSocialCounts';
import { useSuggestedCreators, type SuggestedCreator } from '@/components/watch/hooks/useSuggestedCreators';
import { ChevronRight } from 'lucide-react';
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

// Network page tokens — mirrors Activity page so both read as one system
const INK = '#0F172A';
const INK_SOFT = '#475569';          // INK_60
const INK_45 = '#64748B';
const INK_SUBTLE = '#94A3B8';
const INK_FAINT = '#CBD5E1';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97A10';
const AMBER_SOFT = 'rgba(247,147,30,0.10)';
const AMBER_WASH = 'rgba(247,147,30,0.08)';
const AMBER_BORDER = 'rgba(247,147,30,0.30)';
const HAIR = 'rgba(15,23,42,0.08)';
const HAIR2 = 'rgba(15,23,42,0.12)';
const BORDER = HAIR;
const BG_SURFACE = '#F8FAFC';
const FONT_SERIF = '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export type ListMode = 'followers' | 'following';

type FollowingFilterId = 'all' | 'friends' | 'pending';

interface UserListPageProps {
  mode: ListMode;
  title: string;
  /** @deprecated No longer rendered internally; will be removed once consumers updated */
  subtitle?: string;
  /** @deprecated Kept for backward compatibility — internal placeholder is now uniform. TODO: remove once consumers updated. */
  searchPlaceholder?: string;
  users: SocialUser[];
  totalCount?: number;
  isLoading: boolean;
  error?: Error | null;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  onRefetch?: () => void;
  backPath?: string;
  /** Hide the in-page back chevron + safe-area top pad (e.g. when CompactHeader provides the back arrow). */
  hideBackButton?: boolean;
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
  /** Profile owner's actor id (userId for personal, businessId for business) — used for social counts on filter chips */
  profileUserId?: string;
  /** Profile owner's actor type — defaults to 'personal' */
  profileActorType?: 'personal' | 'business';
  /** Render without its own PageRoot when a route-level shell owns the back header/nav chrome. */
  embeddedInShell?: boolean;
  /** Initial tab override for direct /following routes. */
  initialTab?: 'followers' | 'following';
}

// ---------------------------------------------------------------------------
// Editorial helpers
// ---------------------------------------------------------------------------

import { SectionHeader } from '@/components/ui/SectionHeader';

const FriendBadge: React.FC = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2.5px 7px',
      borderRadius: 6,
      background: AMBER_SOFT,
      color: AMBER_DEEP,
      fontSize: 9.5,
      fontWeight: 800,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      lineHeight: 1,
      flexShrink: 0,
    }}
  >
    Friend
  </span>
);

const HandicapInline: React.FC<{ value: number }> = ({ value }) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
    <span
      style={{
        fontSize: 10,
        fontWeight: 800,
        color: INK_SOFT,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      HCP
    </span>
    <span
      style={{
        fontFamily: FONT_SERIF,
        fontSize: 12.5,
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

// Small amber-bar + uppercase label kicker (matches Activity)
const Kicker: React.FC<{ label: string; barWidth?: number; color?: string }> = ({ label, barWidth = 26, color = AMBER_DEEP }) => (
  <div className="flex items-center" style={{ gap: 8 }}>
    <span style={{ width: barWidth, height: 2.5, background: AMBER, borderRadius: 2 }} />
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color,
      }}
    >
      {label}
    </span>
  </div>
);

const SectionKicker: React.FC<{ label: string; count?: number }> = ({ label, count }) => (
  <div style={{ padding: '18px 16px 10px' }}>
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        color: INK_45,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: 6,
        fontFamily: FONT_SERIF,
      }}
    >
      {label}{typeof count === 'number' ? ` · ${count.toLocaleString()}` : ''}
    </div>
    <div style={{ width: 22, height: 2.5, background: AMBER, borderRadius: 2 }} />
  </div>
);

interface PillTabProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  size?: 'md' | 'sm';
}

const PillTab: React.FC<PillTabProps> = ({ label, count, isActive, onClick, size = 'md' }) => {
  const small = size === 'sm';
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className="shrink-0 inline-flex items-center transition-all active:scale-[0.96]"
      style={{
        padding: small ? '6px 12px' : '8px 14px',
        borderRadius: 30,
        background: isActive ? INK : '#FFFFFF',
        color: isActive ? '#FFFFFF' : INK_SOFT,
        border: isActive ? '1px solid transparent' : `1px solid ${HAIR2}`,
        fontSize: small ? 12.5 : 13,
        fontWeight: small ? 700 : 600,
        gap: 6,
        fontFamily: FONT_SERIF,
        cursor: 'pointer',
      }}
    >
      {label}
      {count > 0 && (
        <span
          className="tabular-nums"
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: 20,
            background: isActive ? 'rgba(255,255,255,0.18)' : '#F1F5F9',
            color: isActive ? '#FFFFFF' : INK_SOFT,
            lineHeight: 1,
          }}
        >
          {count.toLocaleString()}
        </span>
      )}
    </button>
  );
};

interface FollowingFilterChipProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

const FollowingFilterChip: React.FC<FollowingFilterChipProps> = ({ label, count, isActive, onClick }) => (
  <PillTab label={label} count={count} isActive={isActive} onClick={onClick} size="sm" />
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
      return null;
    case 'friend_request_sent':
      return null;
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
  hideBackButton = false,
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
  profileUserId,
  profileActorType = 'personal',
  embeddedInShell = false,
  initialTab: initialTabOverride,
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // Snapshot safe-area top once so the sticky header height doesn't shift.
  const [safeTop, setSafeTop] = useState(0);
  useEffect(() => {
    if (embeddedInShell || hideBackButton) return;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;left:0;height:env(safe-area-inset-top,0px);width:0;visibility:hidden;pointer-events:none;';
    document.body.appendChild(probe);
    setSafeTop(Math.max(probe.getBoundingClientRect().height, 8));
    document.body.removeChild(probe);
  }, [embeddedInShell, hideBackButton]);

  const hasFollowingTab = mode === 'followers' && followingUsers !== undefined;
  const initialTab = searchParams.get('tab') === 'following' || initialTabOverride === 'following' ? 'following' : 'followers';
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(hasFollowingTab ? initialTab : 'followers');

  // Filter state — Following tab + owner view only
  const initialFilter: FollowingFilterId = (() => {
    const f = searchParams.get('filter');
    if (f === 'friends' || f === 'pending') return f;
    return 'all';
  })();
  const [followingFilter, setFollowingFilter] = useState<FollowingFilterId>(initialFilter);

  const handleFilterChange = (filter: FollowingFilterId) => {
    setFollowingFilter(filter);
    const next = new URLSearchParams(searchParams);
    if (filter === 'all') {
      next.delete('filter');
    } else {
      next.set('filter', filter);
    }
    if (next.get('tab') !== 'following') {
      next.set('tab', 'following');
    }
    setSearchParams(next, { replace: true });
  };

  const handleTabChange = (tab: 'followers' | 'following') => {
    setActiveTab(tab);
    setSearchInput('');
    setRemovedIds(new Set());
    setFollowingFilter('all');
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

  // Step 1: Apply removedIds + search filters (no relationship dependency)
  const preRelationshipFiltered = useMemo(() => {
    let result = activeUsers.filter(u => !removedIds.has(u.id));
    if (!debouncedSearch.trim()) return result;
    const query = debouncedSearch.toLowerCase();
    return result.filter(u =>
      u.displayName.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      (u.homeClub && u.homeClub.toLowerCase().includes(query))
    );
  }, [activeUsers, debouncedSearch, removedIds]);

  // Step 2: Scope relationshipMap to pre-filter set (broader than filtered set
  // — required so chip filter logic has access to relationship data for all
  // candidate users, not just currently-visible ones).
  const relationshipQueryIds = useMemo(
    () => preRelationshipFiltered.map(u => u.id),
    [preRelationshipFiltered]
  );
  const { data: relationshipMap = {} } = useRelationshipStatuses(relationshipQueryIds);

  // Step 3: Apply Following filter (Following tab + owner view only)
  const filteredUsers = useMemo(() => {
    if (!isFollowingTab || !isOwnProfile || followingFilter === 'all') {
      return preRelationshipFiltered;
    }
    return preRelationshipFiltered.filter(u => {
      const rel = relationshipMap[u.id];
      if (!rel) return false;
      if (followingFilter === 'friends') return rel.friend_status === 'friends';
      if (followingFilter === 'pending') return rel.friend_status === 'pending_sent';
      return true;
    });
  }, [preRelationshipFiltered, isFollowingTab, isOwnProfile, followingFilter, relationshipMap]);

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
    activeMode === 'followers' ? 'followers' : 'following';

  // Social counts for filter chips (uses profile owner's userId, not viewer's)
  const { data: socialCounts } = useSocialCounts(
    profileUserId ? { type: profileActorType, id: profileUserId } : undefined,
  );
  const friendsCount = socialCounts?.friends ?? 0;

  // Pending count is approximate — only counts relationships in the currently
  // loaded page set. At current scale (39 pending across all users, most users
  // <5), this approximation is acceptable. If users routinely paginate through
  // more than 1 page of pending requests, revisit by adding a dedicated count
  // query.
  const pendingCount = useMemo(() => {
    return Object.values(relationshipMap).filter(
      r => r.friend_status === 'pending_sent'
    ).length;
  }, [relationshipMap]);

  const allFollowingCount = preRelationshipFiltered.length;

  // Tab counts (for inline tab toggle)
  const followersTabCount = Math.max(0, (totalCount ?? users.length) - removedIds.size);
  const followingTabCount = followingTotalCount ?? (followingUsers?.length ?? 0);

  const showFilterChips = isFollowingTab && isOwnProfile;

  const pageContent = (
      <div className="w-full">
        {/* Sticky Network header — mirrors Activity page anatomy */}
        <div
          className={embeddedInShell ? 'relative z-20' : 'sticky top-0 z-40'}
          style={{
            background: BG_SURFACE,
            borderBottom: `1px solid ${HAIR}`,
            paddingTop: embeddedInShell || hideBackButton ? 0 : safeTop + 6,
          }}
        >
          {/* Back row */}
          {!hideBackButton && (
            <div
              className="flex items-center justify-between px-4"
              style={{ paddingBottom: 8, minHeight: 40 }}
            >
              <button
                onClick={handleBack}
                aria-label="Back"
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#FFFFFF', border: `1px solid ${HAIR2}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={18} strokeWidth={2.5} color={INK} />
              </button>
              <span />
            </div>
          )}

          {/* NETWORK kicker + big count title intentionally removed —
              the count now lives in the tab pills, and the shell header
              (or CompactHeader when hideBackButton) already provides the
              route title. */}

          {/* Search + tabs + filter chips */}
          <div className="px-4" style={{ paddingBottom: 10 }}>
            <div className="relative" style={{ marginBottom: 10 }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: INK_SUBTLE }} />
              <Input
                type="search"
                placeholder="Search by name or club"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-11 rounded-xl focus-visible:ring-[#F7931E]/40"
                style={{ background: '#ffffff', border: `1px solid ${HAIR}`, color: INK }}
                aria-label="Search by name or club"
              />
            </div>

            {hasFollowingTab && (
              <div className="flex gap-2" style={{ marginBottom: showFilterChips ? 10 : 0 }}>
                <PillTab
                  label="Followers"
                  count={followersTabCount}
                  isActive={activeTab === 'followers'}
                  onClick={() => handleTabChange('followers')}
                />
                <PillTab
                  label="Following"
                  count={followingTabCount}
                  isActive={activeTab === 'following'}
                  onClick={() => handleTabChange('following')}
                />
              </div>
            )}

            {showFilterChips && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                <FollowingFilterChip
                  label="All"
                  count={allFollowingCount}
                  isActive={followingFilter === 'all'}
                  onClick={() => handleFilterChange('all')}
                />
                <FollowingFilterChip
                  label="Friends"
                  count={friendsCount}
                  isActive={followingFilter === 'friends'}
                  onClick={() => handleFilterChange('friends')}
                />
                <FollowingFilterChip
                  label="Pending"
                  count={pendingCount}
                  isActive={followingFilter === 'pending'}
                  onClick={() => handleFilterChange('pending')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Suggested Golfers — compact horizontal rail (owner view, followers tab, no search) */}
        {isOwnProfile && !isSearching && !isFollowingTab && user?.id && (
          <SuggestedRail
            userId={user.id}
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

          {/* Loading skeletons — Option A row anatomy */}
          {activeIsLoading && !activeError && (
            <div>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="flex items-center"
                  style={{
                    gap: 12,
                    padding: '11px 16px',
                    borderTop: i > 1 ? `1px solid ${HAIR}` : undefined,
                    background: BG_SURFACE,
                  }}
                >
                  <div
                    className="animate-pulse flex-shrink-0"
                    style={{ width: 46, height: 48, borderRadius: '34%', background: 'rgba(15,23,42,0.08)' }}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 animate-pulse rounded" style={{ width: `${55 + ((i * 7) % 30)}%`, background: 'rgba(15,23,42,0.08)' }} />
                    <div className="h-3 animate-pulse rounded" style={{ width: `${40 + ((i * 5) % 25)}%`, background: 'rgba(15,23,42,0.06)' }} />
                  </div>
                  <div className="h-8 w-20 animate-pulse rounded-full flex-shrink-0" style={{ background: 'rgba(15,23,42,0.06)' }} />
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
              ) : isFollowingTab && isOwnProfile && followingFilter !== 'all' ? (
                <EmptyState
                  eyebrow="No matches"
                  icon={<Users className="w-7 h-7" style={{ color: INK_SUBTLE }} />}
                  heading={
                    followingFilter === 'friends'
                      ? 'No friends in following yet'
                      : 'No pending friend requests'
                  }
                  body={
                    followingFilter === 'friends'
                      ? "You're not yet friends with anyone you follow. Send a friend request from a profile to connect."
                      : 'You have no outgoing friend requests waiting on a response.'
                  }
                  ctaLabel="Show all"
                  ctaIsAmber={false}
                  onCta={() => handleFilterChange('all')}
                />
              ) : activeMode === 'followers' ? (
                <EmptyState
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
              ) : (
                <EmptyState
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
              <SectionKicker
                label={activeMode === 'followers' ? 'All Followers' : 'All Following'}
                count={displayTotal}
              />
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
  );

  if (embeddedInShell) {
    return (
      <div className="min-h-screen" style={{ background: BG_SURFACE }}>
        {pageContent}
      </div>
    );
  }

  return (
    <PageRoot className="min-h-screen" style={{ background: BG_SURFACE }}>
      {pageContent}
    </PageRoot>
  );
};

// ---------------------------------------------------------------------------
// Empty state primitive (editorial)
// ---------------------------------------------------------------------------

const EmptyState: React.FC<{
  eyebrow?: string;
  icon: React.ReactNode;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaIsAmber: boolean;
  onCta?: () => void;
}> = ({ eyebrow, icon, heading, body, ctaLabel, ctaIsAmber, onCta }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6">
    {eyebrow && (
      <div style={{ marginBottom: 14 }}>
        <Kicker label={eyebrow} />
      </div>
    )}
    <div
      className="flex items-center justify-center mb-4"
      style={{
        width: 56,
        height: 56,
        borderRadius: '34%',
        background: AMBER_SOFT,
        color: AMBER_DEEP,
      }}
    >
      {icon}
    </div>
    <h3
      style={{
        fontFamily: FONT_SERIF,
        fontSize: 15.5,
        fontWeight: 800,
        color: INK,
        marginBottom: 4,
        textAlign: 'center',
        letterSpacing: '-0.01em',
      }}
    >
      {heading}
    </h3>
    <p className="text-center max-w-[280px] mb-6" style={{ color: INK_45, fontSize: 13, lineHeight: 1.5 }}>
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
// Suggested golfers — compact horizontal rail
// ---------------------------------------------------------------------------

const SuggestedRail: React.FC<{ userId: string; onViewAll: () => void }> = ({ userId, onViewAll }) => {
  const { data: creators, isLoading } = useSuggestedCreators(userId);
  const items = (creators ?? []).filter((c) => !c.isFollowed).slice(0, 12);

  if (!isLoading && items.length === 0) return null;

  return (
    <div style={{ padding: '16px 0 12px', background: BG_SURFACE }}>
      <div className="flex items-end justify-between px-4" style={{ marginBottom: 10 }}>
        <Kicker label="Suggested Golfers" />
        <button
          onClick={onViewAll}
          className="inline-flex items-center active:opacity-70"
          style={{
            gap: 2,
            fontSize: 12.5,
            fontWeight: 700,
            color: AMBER_DEEP,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: FONT_SERIF,
          }}
        >
          See all
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>
      <div
        className="flex overflow-x-auto scrollbar-none"
        style={{ gap: 10, padding: '0 16px', scrollbarWidth: 'none' }}
      >
        {isLoading && items.length === 0
          ? [1, 2, 3, 4].map((i) => <SuggestedRailSkeleton key={i} />)
          : items.map((c) => <SuggestedRailCard key={c.userId} creator={c} />)}
      </div>
    </div>
  );
};

const SuggestedRailSkeleton: React.FC = () => (
  <div
    className="shrink-0 animate-pulse"
    style={{
      width: 128,
      background: '#FFFFFF',
      border: `1px solid ${HAIR}`,
      borderRadius: 16,
      padding: 12,
    }}
  >
    <div style={{ width: 56, height: 58, borderRadius: '34%', background: 'rgba(15,23,42,0.08)', margin: '0 auto 10px' }} />
    <div style={{ height: 10, borderRadius: 4, background: 'rgba(15,23,42,0.08)', marginBottom: 6 }} />
    <div style={{ height: 8, borderRadius: 4, background: 'rgba(15,23,42,0.06)', marginBottom: 10, width: '70%' }} />
    <div style={{ height: 28, borderRadius: 18, background: 'rgba(15,23,42,0.08)' }} />
  </div>
);

const SuggestedRailCard: React.FC<{ creator: SuggestedCreator }> = ({ creator }) => {
  const navigate = useNavigate();
  const { followUser, unfollowUser, loading } = useFollowUser();
  const [followed, setFollowed] = useState<boolean>(!!creator.isFollowed);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = followed;
    setFollowed(!prev);
    const ok = prev ? await unfollowUser(creator.userId) : await followUser(creator.userId);
    if (!ok) setFollowed(prev);
  };

  const goProfile = () => {
    const path = getProfilePathById(creator.userId, false, creator.username);
    navigate(path);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goProfile}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goProfile(); }}
      className="shrink-0 active:scale-[0.98] transition-transform cursor-pointer"
      style={{
        width: 128,
        background: '#FFFFFF',
        border: `1px solid ${HAIR}`,
        borderRadius: 16,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <SquircleAvatar
        src={creator.avatarUrl || undefined}
        alt={creator.displayName}
        size={56}
        fallback={creator.displayName?.charAt(0) || '?'}
        hairlineRing
        ringColor={LIGHT_HAIRLINE}
        className="mb-2"
      />
      <div
        className="truncate w-full"
        style={{ fontSize: 12.5, fontWeight: 700, color: INK, fontFamily: FONT_SERIF, letterSpacing: '-0.005em' }}
      >
        {creator.displayName}
      </div>
      <div
        className="truncate w-full"
        style={{ fontSize: 11, color: INK_45, marginBottom: 10, minHeight: 14 }}
      >
        {creator.homeCourse || (creator.username ? `@${creator.username}` : '')}
      </div>
      <button
        onClick={handleFollow}
        disabled={loading}
        className="w-full inline-flex items-center justify-center active:scale-[0.97]"
        style={{
          height: 28,
          borderRadius: 18,
          fontSize: 12,
          fontWeight: 700,
          fontFamily: FONT_SERIF,
          background: followed ? '#FFFFFF' : INK,
          color: followed ? INK : '#FFFFFF',
          border: followed ? `1px solid ${HAIR2}` : 'none',
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {followed ? 'Following' : 'Follow'}
      </button>
    </div>
  );
};

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
        {users.map((socialUser, idx) => (
          <UserRowFlat
            key={socialUser.id}
            user={socialUser}
            currentUserId={currentUserId}
            mode={mode}
            onUserRemoved={onUserRemoved}
            relationshipStatus={relationshipMap[socialUser.id]}
            isOwnProfile={isOwnProfile}
            isFirst={idx === 0}
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
  isFirst?: boolean;
}

const UserRowFlat: React.FC<UserRowFlatProps> = ({
  user,
  currentUserId,
  mode: _mode,
  onUserRemoved,
  relationshipStatus,
  isOwnProfile,
  isFirst = false,
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
    if (user.actorType === 'business') {
      navigate(user.slug ? `/business/${user.slug}` : `/business/${user.id}`, { state: { source: 'search' } });
      return;
    }
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

  const showFollowingPill = uiState === 'following';

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleRowClick();
        }}
        className="w-full flex items-center text-left transition-colors active:bg-[rgba(15,23,42,0.02)] cursor-pointer"
        style={{
          gap: 12,
          padding: '11px 16px',
          background: '#FFFFFF',
          borderTop: isFirst ? undefined : `1px solid ${HAIR}`,
        }}
      >
        <SquircleAvatar
          src={user.avatarUrl || undefined}
          alt={user.displayName}
          size={46}
          fallback={user.displayName?.charAt(0) || '?'}
          hairlineRing
          ringColor={LIGHT_HAIRLINE}
          className="flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 min-w-0">
            <span
              className="truncate"
              style={{ fontSize: 14.5, fontWeight: 700, color: INK, letterSpacing: '-0.005em', fontFamily: FONT_SERIF }}
            >
              {user.displayName}
            </span>
            {isFriend && <FriendBadge />}
          </div>

          <div
            className="truncate flex items-center"
            style={{ fontSize: 12.5, color: INK_45, gap: 5, lineHeight: 1.35, minWidth: 0 }}
          >
            {user.username && <span className="truncate">@{user.username}</span>}
            {user.username && user.homeClub && <span style={{ color: INK_FAINT }}>·</span>}
            {user.homeClub && <span className="truncate">{user.homeClub}</span>}
            {(user.username || user.homeClub) && showHandicap && (
              <span style={{ color: INK_FAINT }}>·</span>
            )}
            {showHandicap && <HandicapInline value={user.handicapIndex as number} />}
          </div>
        </div>

        {!isSelf && currentUserId && (
          <div
            className="flex items-center flex-shrink-0"
            style={{ gap: 4 }}
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
                  gap: 5,
                  height: 32,
                  padding: '0 14px',
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: primaryAction.disabled ? 'default' : 'pointer',
                  opacity: primaryAction.disabled ? 0.6 : 1,
                  background: primaryAction.isAmber ? AMBER : '#FFFFFF',
                  color: primaryAction.isAmber ? '#FFFFFF' : INK,
                  border: primaryAction.isAmber ? 'none' : `1px solid ${HAIR2}`,
                  whiteSpace: 'nowrap',
                  fontFamily: FONT_SERIF,
                }}
              >
                {primaryAction.icon}
                {primaryAction.label}
              </button>
            )}
            {!primaryAction && showFollowingPill && (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                aria-label={`Unfollow ${user.displayName}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  height: 32,
                  padding: '0 12px',
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: followLoading ? 'default' : 'pointer',
                  opacity: followLoading ? 0.6 : 1,
                  background: '#FFFFFF',
                  color: INK,
                  border: `1px solid ${HAIR2}`,
                  whiteSpace: 'nowrap',
                  fontFamily: FONT_SERIF,
                }}
              >
                <Check className="w-3.5 h-3.5" />
                Following
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
                  width: 32,
                  height: 32,
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  color: INK_45,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 17,
                }}
              >
                <MoreHorizontal size={17} />
              </button>
            )}
          </div>
        )}
      </div>




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
            <SectionHeader tier="standard" kicker="Actions" />
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

          <div
            style={{
              borderTop: `0.5px solid ${BORDER}`,
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
            }}
          >
            <KebabAction
              icon={<UserIcon className="w-4 h-4" />}
              label="View profile"
              onClick={() => {
                setShowKebabSheet(false);
                handleRowClick();
              }}
            />
            {(uiState === 'following' || uiState === 'friends') && (
              <KebabAction
                icon={<MessageCircle className="w-4 h-4" />}
                label="Message"
                onClick={async () => {
                  setShowKebabSheet(false);
                  handleMessage({ stopPropagation: () => {} } as React.MouseEvent);
                }}
              />
            )}
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
