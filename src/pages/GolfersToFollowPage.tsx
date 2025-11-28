import React, { useState, useEffect } from 'react';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { GolferCard } from '@/components/golfers/GolferCard';
import { GolferCardSkeleton } from '@/components/golfers/GolferCardSkeleton';
import { useGolfersDiscovery, FilterType } from '@/hooks/useGolfersDiscovery';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useFriendActions } from '@/hooks/useFriendActions';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { cn } from '@/lib/utils';

const GolfersToFollowPage = () => {
  const {
    golfers,
    loading,
    searchQuery,
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
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    setLastPage(page);
  }, [page]);

  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    setActioningUserId(userId);
    
    const success = isFollowing
      ? await unfollowUser(userId)
      : await followUser(userId);

    if (success) {
      updateFollowingStatus(userId, !isFollowing);
    }
    
    setActioningUserId(null);
  };

  const handleFriendRequest = async (userId: string) => {
    setActioningUserId(userId);
    await sendFriendRequest(userId, undefined);
    setActioningUserId(null);
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'suggested', label: 'Suggested' },
    { value: 'club', label: 'At your golf club' },
    { value: 'popular', label: 'Popular golfers' },
    { value: 'low', label: 'Lowest handicap golfers' },
  ];

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);
  const direction = page > lastPage ? 'right' : 'left';

  return (
    <div className="min-h-screen bg-background page-with-header m-0 p-0">
      <ClubhouseHeaderNew />
      <FadeInContent>
        <main className="max-w-3xl mx-auto px-4 pt-8 pb-[30px]">
          {/* Header */}
          <div className="space-y-2 mb-[30px]">
            <h1 className="text-2xl font-semibold text-foreground">
              Find golfers to follow
            </h1>
            <p className="text-sm text-muted-foreground">
              Discover new golfers, see where they play, and build your friends' courses feed.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search golfers by name or club"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-lg border-slate-200 focus:border-slate-600"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 flex-wrap mb-6">
            {filterOptions.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setActiveFilter(filter.value);
                  setPage(1);
                }}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-medium transition-colors",
                  activeFilter === filter.value
                    ? "bg-foreground text-background"
                    : "bg-background border border-border text-foreground/80 hover:bg-slate-50"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Golfers List */}
          {loading ? (
            <div className="space-y-3">
              <GolferCardSkeleton />
              <GolferCardSkeleton />
              <GolferCardSkeleton />
              <GolferCardSkeleton />
              <GolferCardSkeleton />
            </div>
          ) : golfers.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No golfers found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {searchQuery.trim()
                  ? `No golfers match "${searchQuery}". Try a different name or club.`
                  : 'No golfers match your current filter. Try switching filters or searching by name/club.'}
              </p>
            </div>
          ) : (
            <>
              <ul
                key={page}
                className={cn(
                  "space-y-3",
                  !isSearching && (direction === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left')
                )}
              >
                {golfers.map((golfer) => (
                  <GolferCard
                    key={golfer.id}
                    golfer={golfer}
                    isFollowing={followingIds.has(golfer.id)}
                    loading={actioningUserId === golfer.id}
                    onFollowToggle={() =>
                      handleFollowToggle(golfer.id, followingIds.has(golfer.id))
                    }
                    onFriendRequest={() => handleFriendRequest(golfer.id)}
                  />
                ))}
              </ul>

              {/* Pagination - only show when not searching */}
              {!isSearching && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="h-11 px-6 rounded-lg border border-border bg-background shadow-sm disabled:opacity-40 disabled:cursor-default hover:bg-slate-50 transition"
                  >
                    Previous 15 golfers
                  </button>

                  <span className="flex-1 text-center">
                    Showing {startIndex}–{endIndex} of {totalCount} golfers
                  </span>

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="h-11 px-6 rounded-lg border border-border bg-background shadow-sm disabled:opacity-40 disabled:cursor-default hover:bg-slate-50 transition"
                  >
                    Next 15 golfers
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </FadeInContent>
    </div>
  );
};

export default GolfersToFollowPage;
