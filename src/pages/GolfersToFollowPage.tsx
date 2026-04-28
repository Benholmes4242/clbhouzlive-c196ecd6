import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Check, UserPlus, Info, Users, Building2, BadgeCheck, AlertCircle, LucideIcon, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGolfersDiscovery, TabKey } from '@/hooks/useGolfersDiscovery';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useFriendActions } from '@/hooks/useFriendActions';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageRoot } from '@/components/layout/PageRoot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { Button } from '@/components/ui/button';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import SegmentedControl from '@/components/discover/SegmentedControl';
import { Skeleton } from '@/components/ui/skeleton';

import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { getProfilePathById } from '@/lib/profileRoutes';
import { useEditProfileRoute } from '@/hooks/useEditProfileRoute';

// Tab configuration for pill toggle bar
const TABS: { key: TabKey; label: string }[] = [
  { key: 'suggested', label: 'Suggested' },
  { key: 'home_club', label: 'Home Club' },
  { key: 'verified', label: 'Verified' },
];

const EMPTY_STATES: Record<TabKey, { title: string; description: string; icon: LucideIcon }> = {
  suggested: { 
    title: 'No suggestions yet', 
    description: 'Try searching by name or club to find golfers to follow.',
    icon: Users
  },
  home_club: { 
    title: "Your club's still warming up", 
    description: "No golfers from your home club yet. Invite a few friends and you'll have a proper feed in no time.",
    icon: Building2
  },
  verified: { 
    title: "We're new around here", 
    description: "Our verified golfers are currently going through verification. Check back soon to see who's been approved.",
    icon: BadgeCheck
  },
};


const GolfersToFollowPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source');
  
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchQuery = useDebounce(searchInput, 300);
  
  const {
    golfers,
    loading,
    error,
    refetch,
    setSearchQuery,
    activeTab,
    setActiveTab,
    followingIds,
    updateFollowingStatus,
    page,
    setPage,
    totalPages,
    totalCount,
    isSearching,
    hasNoHomeClub,
  } = useGolfersDiscovery();

  const { user } = useSupabaseSession();
  const { followUser, unfollowUser, loading: followLoading } = useFollowUser();
  const { sendFriendRequest, loading: friendLoading } = useFriendActions({ 
    currentUserId: user?.id || '' 
  });
  const [actioningUserId, setActioningUserId] = useState<string | null>(null);
  const [friendRequestsSent, setFriendRequestsSent] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreLockRef = useRef(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Apply debounced search query
  useEffect(() => {
    setSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery, setSearchQuery]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/courses?tab=friends-courses');
    }
  };

  const handleFollowToggle = async (userId: string, userName: string, isFollowing: boolean) => {
    setActioningUserId(userId);
    
    // Optimistic update
    updateFollowingStatus(userId, !isFollowing);
    
    const success = isFollowing
      ? await unfollowUser(userId)
      : await followUser(userId);

    if (!success) {
      // Revert on failure
      updateFollowingStatus(userId, isFollowing);
      toast.error(isFollowing 
          ? 'Could not unfollow. Please try again.'
          : 'Could not follow. Please try again.');
    } else if (isFollowing) {
      toast(`You've unfollowed ${userName}`);
    }
    
    setActioningUserId(null);
  };

  const handleFriendRequest = async (userId: string, userName: string, currentStatus: 'none' | 'pending' | 'friends') => {
    if (currentStatus !== 'none') return;
    
    setActioningUserId(userId);
    
    // Optimistic update
    setFriendRequestsSent(prev => new Set(prev).add(userId));
    
    const success = await sendFriendRequest(userId, undefined);
    
    if (!success) {
      // Revert on failure
      setFriendRequestsSent(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      toast.error('Could not send request. Please try again.');
    }
    
    setActioningUserId(null);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleLoadNext = async () => {
    if (page < totalPages && !isLoadingMore) {
      setIsLoadingMore(true);
      setPage(page + 1);
      // Small delay to allow state to update
      setTimeout(() => setIsLoadingMore(false), 300);
    }
  };

  const showingCount = golfers.length;
  const hasMore = page < totalPages;

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!hasMore || isSearching) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isLoadingMore && !loadMoreLockRef.current) {
          loadMoreLockRef.current = true;
          handleLoadNext();
          setTimeout(() => {
            loadMoreLockRef.current = false;
          }, 500);
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isSearching, isLoadingMore, page, totalPages]);

  // Determine effective friend status (combining API data with optimistic updates)
  const getEffectiveFriendStatus = (golfer: typeof golfers[0]) => {
    if (friendRequestsSent.has(golfer.id)) return 'pending';
    return golfer.friendStatus;
  };

  return (
    <PageRoot className="min-h-screen bg-[#F8FAFC]">
      <div className="w-full">
        {/* Compact sticky nav header */}
        <div className="sticky top-0 z-50 bg-[#F8FAFC] flex items-center px-4 pb-0" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)' }}>
          <button onClick={handleBack} className="p-2 -ml-2">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="flex-1 text-center text-[17px] font-semibold text-foreground pr-7">
            Golfers to follow
          </h1>
        </div>
        
        {/* Sticky section - tabs + search */}
        <div className="sticky z-40 bg-[#F8FAFC]" style={{ top: 'max(env(safe-area-inset-top, 0px), 47px)' }}>
          <SegmentedControl
            tabs={TABS.map(t => ({ id: t.key, label: t.label }))}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as TabKey)}
          />
          {/* Divider matching Watch tab */}
          <div style={{ height: 0.5, background: 'hsl(var(--border) / 0.5)' }} />
          
          {/* Search bar */}
          <div className="px-4 pt-3 pb-3">
            {activeTab === 'home_club' && hasNoHomeClub ? (
              <div className="h-11 px-4 flex items-center rounded-xl border border-border/40 bg-white/50">
                <Search className="h-4 w-4 text-muted-foreground/50 mr-2" />
                <span className="text-sm text-muted-foreground/60">Set your home club to search</span>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                <Input
                  type="search"
                  placeholder="Search golfers by name or club"
                  aria-label="Search golfers by name or club"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 h-11 rounded-xl border-[#e2e8f0] bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus-visible:ring-[#e2e8f0]"
                />
              </div>
            )}
          </div>
          
          {/* Bottom border for visual separation when sticky */}
          <div className="border-b border-border/30" />
        </div>

        {/* Content area */}
        <div className="bg-[#F8FAFC] min-h-[50vh]">
          {/* Home club nudge card - orange style */}
          {activeTab === 'home_club' && hasNoHomeClub && (
            <div className="mx-4 my-4 p-4 bg-[#F79E1B]/10 border border-[#F79E1B]/30 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F79E1B]/20 flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-[#F79E1B]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-[#F79E1B] mb-1">
                    Set your home club
                  </h4>
                  <p className="text-xs text-[#F79E1B]/80 mb-3">
                    Add your home club to find and connect with golfers from your club.
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-[#F79E1B]/50 text-[#F79E1B] hover:bg-[#F79E1B]/10 font-medium"
                    onClick={() => navigate(`${editRoute}?section=golf`)}
                  >
                    Set Home Club
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Something went wrong
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-[260px] mb-6">
                We couldn't load golfers. Please try again.
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && !error ? (
            <div className="divide-y divide-border/30">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-7 w-20 rounded-full" />
                    <Skeleton className="h-7 w-24 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : !error && golfers.length === 0 ? (
            // Empty states
            <div className="flex flex-col items-center justify-center py-16 px-6">
              {isSearching || searchInput ? (
                // Search = no results
                <>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-[#94a3b8]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1e293b] mb-1 text-center">
                    No results found
                  </h3>
                  <p className="text-sm text-[#64748b] text-center max-w-[260px] mb-4">
                    No golfers match "{searchInput}"
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                // Tab-specific empty state with gradient icon
                <>
                  {(() => {
                    const EmptyIcon = EMPTY_STATES[activeTab].icon;
                    return (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-4">
                        <EmptyIcon className="w-7 h-7 text-[#64748b]" />
                      </div>
                    );
                  })()}
                  <h3 className="text-base font-semibold text-[#1e293b] mb-1 text-center">
                    {EMPTY_STATES[activeTab].title}
                  </h3>
                  <p className="text-sm text-[#64748b] text-center max-w-[280px]">
                    {EMPTY_STATES[activeTab].description}
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Golfer list rows */}
              <div className="divide-y divide-[#e2e8f0]">
              {golfers.map((golfer) => {
                const isFollowing = followingIds.has(golfer.id);
                const isActioning = actioningUserId === golfer.id;
                const clubLine = golfer.homeClub || null;
                const friendStatus = getEffectiveFriendStatus(golfer);

                return (
                  <button
                    key={golfer.id}
                    onClick={() => navigate(getProfilePathById(golfer.id, golfer.creatorOnly, golfer.username))}
                    className="w-full text-left px-4 py-3 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="shrink-0">
                        <SquircleAvatar
                          src={golfer.profileImage}
                          alt={golfer.displayName}
                          size={48}
                          fallback={golfer.displayName?.charAt(0)?.toUpperCase() || '?'}
                          ringColor={getRingColorForTotalPlayed(golfer.totalTop100Played || 0) || 'hsl(var(--border))'}
                          hideRing={!golfer.totalTop100Played}
                        />
                      </div>

                      {/* Content area */}
                      <div className="flex-1 min-w-0">
                        {/* Row 1: Name with verified badge */}
                        <div className="flex items-center gap-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {golfer.displayName}
                          </p>
                          {golfer.isVerified && (
                            <VerifiedBadge size="sm" />
                          )}
                        </div>

                        {/* Row 2: Username */}
                        <p className="text-xs text-muted-foreground truncate">
                          @{golfer.username}
                        </p>

                        {/* Row 3: Home club (hidden when empty) */}
                        {clubLine && (
                          <p className="text-xs text-muted-foreground truncate">
                            {clubLine}
                          </p>
                        )}

                        {/* Row 4: Buttons grid */}
                        <div 
                          className="grid grid-cols-2 gap-1.5 pt-2" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Follow/Following button - PRIMARY */}
                          {isFollowing ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollowToggle(golfer.id, golfer.displayName, true);
                              }}
                              disabled={isActioning}
                              aria-label={`Unfollow ${golfer.displayName}`}
                              className="h-7 px-3 text-[11px] font-medium rounded-full border transition-colors transition-transform flex items-center justify-center whitespace-nowrap border-border bg-muted text-muted-foreground hover:bg-muted/80 active:scale-[0.97] gap-1.5"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Following
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollowToggle(golfer.id, golfer.displayName, false);
                              }}
                              disabled={isActioning}
                              aria-label={`Follow ${golfer.displayName}`}
                              className="h-7 px-3 text-[11px] font-medium rounded-full border transition-colors transition-transform flex items-center justify-center whitespace-nowrap border-[#F79E1B] bg-[#F79E1B]/10 text-[#F79E1B] hover:bg-[#F79E1B]/20 active:scale-[0.97]"
                            >
                              Follow
                            </button>
                          )}

                          {/* Add friend button - SECONDARY */}
                          {friendStatus === 'friends' ? (
                            <span
                              aria-label={`Already friends with ${golfer.displayName}`}
                              className="h-7 px-3 text-[11px] font-medium rounded-full border transition-colors flex items-center justify-center whitespace-nowrap border-emerald-500/50 bg-emerald-500/10 text-emerald-600 gap-1.5 cursor-default"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Friends
                            </span>
                          ) : friendStatus === 'pending' ? (
                            <span
                              aria-label={`Friend request pending for ${golfer.displayName}`}
                              className="h-7 px-3 text-[11px] font-medium rounded-full border transition-colors flex items-center justify-center whitespace-nowrap border-border bg-muted/50 text-muted-foreground cursor-default"
                            >
                              Request sent
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFriendRequest(golfer.id, golfer.displayName, friendStatus);
                              }}
                              disabled={isActioning}
                              aria-label={`Send friend request to ${golfer.displayName}`}
                              className="h-7 px-3 text-[11px] font-medium rounded-full border transition-colors transition-transform flex items-center justify-center whitespace-nowrap border-emerald-500/60 bg-transparent text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-[0.97]"
                            >
                              Add friend
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Infinite scroll sentinel - no spinner */}
            {!isSearching && hasMore && (
              <div ref={sentinelRef} className="h-1" />
            )}

            {/* Footer count */}
            {!isSearching && totalCount > 0 && (
              <div className="py-4 text-center">
                <p className="text-xs text-[#94a3b8]">
                  Showing {showingCount} of {totalCount} golfers
                </p>
              </div>
            )}
          </>
        )}
        </div>
      </div>
      <ScrollToTopGlass />
    </PageRoot>
  );
};

export default GolfersToFollowPage;
