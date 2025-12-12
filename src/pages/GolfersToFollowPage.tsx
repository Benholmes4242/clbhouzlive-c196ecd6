import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CompactHeader from '@/components/header/CompactHeader';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGolfersDiscovery, FilterType } from '@/hooks/useGolfersDiscovery';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useFriendActions } from '@/hooks/useFriendActions';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PageRoot } from '@/components/layout/PageRoot';
import { GolferRowFlat } from '@/components/golfers/GolferRowFlat';
import { Button } from '@/components/ui/button';

const FILTER_TABS = [
  { id: 'suggested' as const, label: 'Suggested' },
  { id: 'club' as const, label: 'Home club' },
  { id: 'popular' as const, label: 'Popular' },
];

const PAGE_SIZE = 10;

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

  const startIndex = (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, totalCount);
  const showingCount = golfers.length;
  const hasMore = page < totalPages;

  return (
    <PageRoot className="bg-muted/40 pb-24">
      <CompactHeader />

      <div className="w-full compact-header-offset">
        {/* Title block */}
        <div className="px-6 pt-4 pb-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Golfers to follow
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Discover new golfers and build your community.
          </p>
        </div>

        {/* Filter tabs - lighter pill style */}
        <div className="px-6 mb-4">
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
                <div className="h-9 w-20 rounded-lg bg-muted animate-pulse" />
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
            {/* Flat list rows */}
            <div className="divide-y divide-border/25">
              {golfers.map((golfer) => (
                <GolferRowFlat
                  key={golfer.id}
                  golfer={golfer}
                  isFollowing={followingIds.has(golfer.id)}
                  loading={actioningUserId === golfer.id}
                  onFollowToggle={() =>
                    handleFollowToggle(golfer.id, golfer.displayName, followingIds.has(golfer.id))
                  }
                  onFriendRequest={() => handleFriendRequest(golfer.id, golfer.displayName)}
                />
              ))}
            </div>

            {/* Pagination - Load next 10 */}
            {!isSearching && hasMore && (
              <div className="mt-6 px-6">
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
              <p className="mt-4 text-center text-xs text-muted-foreground">
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
