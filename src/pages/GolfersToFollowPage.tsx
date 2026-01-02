import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, Check, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGolfersDiscovery, FilterType } from '@/hooks/useGolfersDiscovery';
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

const FILTER_TABS = [
  { id: 'suggested' as const, label: 'Suggested' },
  { id: 'club' as const, label: 'Home club' },
  { id: 'popular' as const, label: 'Popular' },
];

const PAGE_SIZE = 10;

// Shared base pill class for action buttons
// Smaller action buttons (10-20% reduction: h-6 instead of h-7, px-2 instead of px-3, text-[11px])
const basePillClass = "inline-flex items-center justify-center rounded-sq-xs border px-2 h-6 text-[11px] font-semibold transition-colors";

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
    activeFilter,
    setActiveFilter,
    followingIds,
    updateFollowingStatus,
    page,
    setPage,
    totalPages,
    totalCount,
    pageSize,
    isSearching,
  } = useGolfersDiscovery();

  const { user } = useSupabaseSession();
  const { followUser, unfollowUser, loading: followLoading } = useFollowUser();
  const { sendFriendRequest, loading: friendLoading } = useFriendActions({ 
    currentUserId: user?.id || '' 
  });
  const [actioningUserId, setActioningUserId] = useState<string | null>(null);

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
    
    const success = isFollowing
      ? await unfollowUser(userId)
      : await followUser(userId);

    if (success) {
      updateFollowingStatus(userId, !isFollowing);
      if (isFollowing) {
        toast({ description: `You've unfollowed ${userName}` });
      }
    } else {
      toast({
        description: isFollowing 
          ? 'Could not unfollow. Please try again.'
          : 'Could not follow. Please try again.',
        variant: 'destructive',
      });
    }
    
    setActioningUserId(null);
  };

  const handleFriendRequest = async (userId: string, userName: string) => {
    setActioningUserId(userId);
    const success = await sendFriendRequest(userId, undefined);
    
    if (success) {
      toast({ description: `Friend request sent to ${userName}` });
    } else {
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

  const handleGoToPopular = () => {
    setActiveFilter('popular');
    setPage(1);
  };

  const handleLoadNext = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const showingCount = golfers.length;
  const hasMore = page < totalPages;

  return (
    <PageRoot className="bg-muted/40 pb-[var(--page-bottom-padding)] compact-header-offset">
      <div className="w-full">
        {/* Back CTA - top left, matching Notifications page */}
        <div className="px-4 pt-3">
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

        {/* Filter tabs - centered */}
        <div className="flex justify-center px-6 mb-4">
          <div className="inline-flex rounded-sq-pill bg-muted/50 p-1 gap-0.5">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveFilter(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-sq-pill whitespace-nowrap transition-all duration-200",
                  activeFilter === tab.id
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar - lighter treatment */}
        <div className="px-6 mb-4">
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
            ) : activeFilter === 'suggested' ? (
              // Suggested tab = empty
              <>
                <p className="text-sm font-medium text-foreground">No suggestions yet</p>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  Try Popular or search for a club.
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleGoToPopular}>
                    Go to Popular
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => document.querySelector<HTMLInputElement>('input[type="search"]')?.focus()}
                  >
                    Search
                  </Button>
                </div>
              </>
            ) : (
              // Generic empty
              <>
                <p className="text-sm font-medium text-foreground">No golfers found</p>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  Try another tab or search by name or club.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Flat list rows with colored buttons */}
            <div className="divide-y divide-border/25">
              {golfers.map((golfer) => {
                const isFollowing = followingIds.has(golfer.id);
                const isActioning = actioningUserId === golfer.id;
                const clubLine = golfer.homeClub || 'No home club set';

                return (
                  <button
                    key={golfer.id}
                    onClick={() => navigate(`/users/${golfer.id}`)}
                    className="w-full text-left px-6 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <SquircleAvatar
                        src={golfer.profileImage}
                        alt={golfer.displayName}
                        size={48}
                        fallback={golfer.displayName?.charAt(0) || '?'}
                        ringColor={getRingColorForTotalPlayed(golfer.totalTop100Played || 0)}
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{golfer.displayName}</p>
                        <p className="text-sm text-muted-foreground">{clubLine}</p>
                        
                        {/* Row with action buttons */}
                        <div className="flex items-center justify-end mt-1.5">
                          {/* Actions - smaller colored buttons */}
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* Follow/Following button */}
                            {isFollowing ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFollowToggle(golfer.id, golfer.displayName, true);
                                }}
                                disabled={isActioning}
                                className={cn(basePillClass, "border-border bg-muted text-foreground/80 gap-0.5")}
                              >
                                <Check className="h-2.5 w-2.5" />
                                Following
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFollowToggle(golfer.id, golfer.displayName, false);
                                }}
                                disabled={isActioning}
                                className={cn(
                                  basePillClass,
                                  "border-orange-500 bg-orange-500/10 text-orange-600 hover:bg-orange-500/15",
                                  "disabled:opacity-60"
                                )}
                              >
                                {isActioning ? 'Following...' : 'Follow'}
                              </button>
                            )}

                            {/* Add friend button - green styled */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFriendRequest(golfer.id, golfer.displayName);
                              }}
                              disabled={isActioning}
                              className={cn(
                                basePillClass,
                                "border-emerald-500 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15",
                                "disabled:opacity-60"
                              )}
                            >
                              Add friend
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination - Load next 10 */}
            {!isSearching && hasMore && (
              <div className="mt-block px-6">
                <Button
                  variant="secondary"
                  onClick={handleLoadNext}
                  className="w-full max-w-[420px] mx-auto block rounded-xl"
                >
                  Load next 10 golfers
                </Button>
              </div>
            )}

            {/* Status text */}
            {!isSearching && totalCount > 0 && (
              <p className="mt-sub text-center text-xs text-muted-foreground">
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
