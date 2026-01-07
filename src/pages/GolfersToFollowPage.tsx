import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, Check, UserPlus, Info, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGolfersDiscovery, TabKey } from '@/hooks/useGolfersDiscovery';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useFriendActions } from '@/hooks/useFriendActions';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PageRoot } from '@/components/layout/PageRoot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

// Tab trigger class matching Courses page exactly
const tabTriggerClass = "relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out data-[state=active]:after:w-full data-[state=inactive]:after:w-0 data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-[0.85]";

const EMPTY_STATES: Record<TabKey, { title: string; description: string }> = {
  suggested: { title: 'No suggestions yet.', description: 'Try searching by name or club.' },
  home_club: { title: "Your club's still warming up.", description: "No golfers from your home club yet. Invite a few friends and you'll have a proper feed in no time." },
  verified: { title: "We're new around here.", description: "Our verified golfers are currently going through verification. Check back soon to see who's been approved." },
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
      toast({
        description: isFollowing 
          ? 'Could not unfollow. Please try again.'
          : 'Could not follow. Please try again.',
        variant: 'destructive',
      });
    } else if (isFollowing) {
      toast({ description: `You've unfollowed ${userName}` });
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
      toast({
        description: 'Could not send request. Please try again.',
        variant: 'destructive',
      });
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
    <PageRoot className="bg-muted/40">
      <div className="w-full">
        {/* Back CTA - 24px below header */}
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

        {/* Title block - centered beneath back button */}
        <div className="text-center px-4 pt-4 pb-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Golfers to follow
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Discover new golfers and build your community.
          </p>
        </div>

        {/* Tabs - matching Courses page styling exactly */}
        <div className="px-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-transparent border-0 px-0 py-0 mb-block gap-0">
              <TabsTrigger value="suggested" className={tabTriggerClass}>
                Suggested
              </TabsTrigger>
              <TabsTrigger value="home_club" className={tabTriggerClass}>
                Home Club
              </TabsTrigger>
              <TabsTrigger value="verified" className={tabTriggerClass}>
                Verified
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Home club nudge card when on home_club tab with no club set */}
        {activeTab === 'home_club' && hasNoHomeClub && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Set your home club</p>
                <p className="text-xs text-amber-700 mt-0.5 mb-3">
                  Add your home club to find golfers from your club.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-amber-300 bg-white hover:bg-amber-100 text-amber-800"
                  onClick={() => navigate('/edit-profile?section=golf')}
                >
                  Set Home Club
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Search bar - disabled on home_club tab when no club set */}
        <div className="px-6 mt-4 mb-4">
          {activeTab === 'home_club' && hasNoHomeClub ? (
            <div className="h-11 px-4 flex items-center rounded-xl border border-border/40 bg-muted/30">
              <Search className="h-4 w-4 text-muted-foreground/50 mr-2" />
              <span className="text-sm text-muted-foreground/60">Set your home club to search</span>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search golfers by name or club"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-11 rounded-xl border-border/40 bg-white/35"
              />
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
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
        ) : golfers.length === 0 ? (
          // Empty states
          <div className="flex flex-col items-center text-center gap-4 py-16 px-6">
            {isSearching || searchInput ? (
              // Search = no results
              <>
                <p className="text-sm font-medium text-foreground">No golfers found</p>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  Try a different name or club.
                </p>
                <Button variant="secondary" size="sm" onClick={handleClearSearch}>
                  Clear search
                </Button>
              </>
            ) : (
              // Tab-specific empty state
              <>
                <p className="text-sm font-medium text-foreground">
                  {EMPTY_STATES[activeTab].title}
                </p>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  {EMPTY_STATES[activeTab].description}
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Golfer list rows */}
            <div className="divide-y divide-border/25">
              {golfers.map((golfer) => {
                const isFollowing = followingIds.has(golfer.id);
                const isActioning = actioningUserId === golfer.id;
                const clubLine = golfer.homeClub || 'Home club not set';
                const friendStatus = getEffectiveFriendStatus(golfer);

                return (
                  <button
                    key={golfer.id}
                    onClick={() => navigate(`/users/${golfer.id}`)}
                    className="w-full text-left px-6 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar - no overlay */}
                      <div className="shrink-0">
                        <SquircleAvatar
                          src={golfer.profileImage}
                          alt={golfer.displayName}
                          size={56}
                          fallback={golfer.displayName?.charAt(0) || '?'}
                          ringColor={getRingColorForTotalPlayed(golfer.totalTop100Played || 0)}
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

                        {/* Row 3: Home club */}
                        <p className="text-xs text-muted-foreground truncate">
                          {clubLine}
                        </p>

                        {/* Row 3: Buttons grid */}
                        <div 
                          className="grid grid-cols-2 gap-2 pt-2" 
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
                              className="h-8 px-3 text-xs font-medium rounded-sq-sm border transition-colors flex items-center justify-center whitespace-nowrap border-border bg-muted text-foreground/80 gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Following
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollowToggle(golfer.id, golfer.displayName, false);
                              }}
                              disabled={isActioning}
                              className="h-8 px-3 text-xs font-medium rounded-sq-sm border transition-colors flex items-center justify-center whitespace-nowrap border-[#F79E1B] bg-[#F79E1B]/10 text-[#F79E1B] hover:bg-[#F79E1B]/20"
                            >
                              Follow
                            </button>
                          )}

                          {/* Add friend button - SECONDARY */}
                          {friendStatus === 'friends' ? (
                            <span
                              className="h-8 px-3 text-xs font-medium rounded-sq-sm border transition-colors flex items-center justify-center whitespace-nowrap border-emerald-500/50 bg-emerald-500/10 text-emerald-600 gap-1 cursor-default"
                            >
                              <Check className="h-2.5 w-2.5" />
                              Friends
                            </span>
                          ) : friendStatus === 'pending' ? (
                            <span
                              className="h-8 px-3 text-xs font-medium rounded-sq-sm border transition-colors flex items-center justify-center whitespace-nowrap border-border bg-muted/50 text-muted-foreground cursor-default"
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
                              className="h-8 px-3 text-xs font-medium rounded-sq-sm border transition-colors flex items-center justify-center whitespace-nowrap border-emerald-500/60 bg-transparent text-emerald-600 hover:bg-emerald-50"
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

            {/* Infinite scroll sentinel */}
            {!isSearching && hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-6">
                {isLoadingMore && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
            )}

            {/* Status text */}
            {!isSearching && totalCount > 0 && (
              <p className="mt-sub pb-6 text-center text-xs text-muted-foreground">
                Showing {showingCount} of {totalCount} golfers
              </p>
            )}
          </>
        )}
      </div>
    </PageRoot>
  );
};

export default GolfersToFollowPage;
