import React, { useState } from 'react';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { GolferCard } from '@/components/golfers/GolferCard';
import { GolferCardSkeleton } from '@/components/golfers/GolferCardSkeleton';
import { useGolfersDiscovery, FilterType } from '@/hooks/useGolfersDiscovery';
import { useFollowUser } from '@/hooks/useFollowUser';

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
  } = useGolfersDiscovery();

  const { followUser, unfollowUser, loading: followLoading } = useFollowUser();
  const [actioningUserId, setActioningUserId] = useState<string | null>(null);

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

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'suggested', label: 'Suggested' },
    { value: 'club', label: 'From your club' },
    { value: 'popular', label: 'Popular' },
    { value: 'low', label: 'Low handicap' },
  ];

  return (
    <div className="min-h-screen bg-background page-with-header m-0 p-0">
      <ClubhouseHeaderNew />
      <FadeInContent>
        <main className="px-4 md:container md:mx-auto md:px-0 pt-[72px] pb-[30px]">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Find golfers to follow
              </h1>
              <p className="text-sm text-muted-foreground">
                Discover new golfers, see where they play, and build your friends' courses feed.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative">
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
            <div className="flex gap-2 flex-wrap">
              {filterOptions.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`
                    px-4 py-2 rounded-full text-xs font-medium transition-colors
                    ${
                      activeFilter === filter.value
                        ? 'bg-foreground text-background'
                        : 'bg-card border border-border/60 text-foreground hover:bg-slate-50'
                    }
                  `}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Golfers List */}
            <div className="space-y-3">
              {loading ? (
                // Loading skeletons
                <>
                  <GolferCardSkeleton />
                  <GolferCardSkeleton />
                  <GolferCardSkeleton />
                  <GolferCardSkeleton />
                  <GolferCardSkeleton />
                </>
              ) : golfers.length === 0 ? (
                // Empty state
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No golfers found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {searchQuery.trim()
                      ? 'Try a different name or club, or clear your filters.'
                      : 'No golfers match your current filter.'}
                  </p>
                </div>
              ) : (
                // Golfer cards
                golfers.map((golfer) => (
                  <GolferCard
                    key={golfer.id}
                    golfer={golfer}
                    isFollowing={followingIds.has(golfer.id)}
                    loading={actioningUserId === golfer.id}
                    onFollowToggle={() =>
                      handleFollowToggle(golfer.id, followingIds.has(golfer.id))
                    }
                  />
                ))
              )}
            </div>
          </div>
        </main>
      </FadeInContent>
    </div>
  );
};

export default GolfersToFollowPage;
