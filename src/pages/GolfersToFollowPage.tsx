import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { GolferRow } from '@/components/golfers/GolferRow';
import { Button } from '@/components/ui/button';

const FILTER_TABS = [
  { id: 'suggested' as const, label: 'Suggested' },
  { id: 'club' as const, label: 'Home club' },
  { id: 'popular' as const, label: 'Popular' },
];

const GolfersToFollowPage = () => {
  const navigate = useNavigate();
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

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);

  return (
    <PageRoot className="bg-muted/40 pb-24">
      <CompactHeader />

      {/* Main content wrapper - fixed left position to match Activity page */}
      <div className="w-full max-w-[640px] px-4 sm:px-5 pt-6 compact-header-offset" style={{ marginLeft: 'clamp(16px, calc(50vw - 320px), calc(50vw - 320px))' }}>
        {/* Header section */}
        <section className="mb-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Golfers to follow
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Discover new golfers and build your community.
          </p>
        </section>

        {/* Filter tabs - Apple-style segmented control matching Activity page */}
        <div className="mb-4">
          <div className="inline-flex rounded-sq-pill bg-muted/70 border border-border/40 p-1 gap-0.5">
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

        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search golfers by name or club"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-10 rounded-sq-sm"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-sq-md px-4 py-3 min-h-[86px] bg-background/50 flex items-center gap-3"
              >
                <div className="h-11 w-11 rounded-sq-md bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded-full bg-muted animate-pulse" />
                  <div className="h-3 w-1/3 rounded-full bg-muted/60 animate-pulse" />
                </div>
                <div className="h-6 w-20 rounded-sq-xs bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : golfers.length === 0 ? (
          <div className="flex flex-col items-start text-left gap-2 py-10">
            <p className="text-sm font-medium text-foreground">No golfers found</p>
            <p className="text-xs text-muted-foreground max-w-[280px]">
              Try another tab, search by name or club, or invite a friend to join.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              {golfers.map((golfer) => (
                <GolferRow
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

            {/* Pagination */}
            {!isSearching && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="rounded-sq-xs"
                >
                  Previous
                </Button>

                <span className="flex-1 text-center text-xs">
                  {startIndex}–{endIndex} of {totalCount}
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="rounded-sq-xs"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageRoot>
  );
};

export default GolfersToFollowPage;