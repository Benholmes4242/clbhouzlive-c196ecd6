import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft } from 'lucide-react';
import { GolferCard } from '@/components/golfers/GolferCard';
import { GolferCardSkeleton } from '@/components/golfers/GolferCardSkeleton';
import { useGolfersDiscovery, FilterType } from '@/hooks/useGolfersDiscovery';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useFriendActions } from '@/hooks/useFriendActions';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { SegmentedTabs, SegmentedTabOption } from '@/components/ui/SegmentedTabs';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const GolfersToFollowPage = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchQuery = useDebounce(searchInput, 300);
  
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

  // Apply debounced search query
  useEffect(() => {
    setSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery, setSearchQuery]);

  useEffect(() => {
    setLastPage(page);
  }, [page]);

  const handleFollowToggle = async (userId: string, userName: string, isFollowing: boolean) => {
    setActioningUserId(userId);
    
    const success = isFollowing
      ? await unfollowUser(userId)
      : await followUser(userId);

    if (success) {
      updateFollowingStatus(userId, !isFollowing);
      if (isFollowing) {
        toast({
          description: `You've unfollowed ${userName}`,
        });
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
      toast({
        description: `Friend request sent to ${userName}`,
      });
    } else {
      toast({
        description: 'Could not send request. Please try again.',
        variant: 'destructive',
      });
    }
    
    setActioningUserId(null);
  };

  const filterOptions: SegmentedTabOption[] = [
    { value: 'suggested', label: 'Suggested' },
    { value: 'club', label: 'Home club' },
    { value: 'popular', label: 'Popular golfers' },
  ];

  const handleBack = () => {
    navigate('/courses?tab=friends');
  };

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);
  const direction = page > lastPage ? 'right' : 'left';

  return (
    <div className="min-h-screen bg-slate-50 page-with-header m-0 p-0">
      <ClubhouseHeaderNew />
      <FadeInContent>
        <main className="max-w-3xl mx-auto pb-[30px]">
          {/* Header - Centered */}
          <header className="px-4 pt-4 pb-5">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition"
            >
              <ChevronLeft className="mr-1 h-3 w-3" />
              Back to Friends&apos; Courses
            </button>

            <h1 className="mt-3 text-xl font-semibold text-foreground text-center">
              Find golfers to follow
            </h1>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs mx-auto">
              Discover new golfers, see where they play, and build your community.
            </p>
          </header>

          {/* Search Bar + Tabs - Non-sticky */}
          <div className="w-full pb-3 bg-slate-50">
            <div className="border-b border-slate-100">
              {/* Search Bar */}
              <div className="px-4 pt-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search golfers by name or club"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9 h-11 border-slate-200 focus:border-slate-600"
                    style={{ borderRadius: 'var(--radius)' }}
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="px-4 pb-2">
                <SegmentedTabs
                  options={filterOptions}
                  value={activeFilter}
                  onChange={(value) => {
                    setActiveFilter(value as FilterType);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Golfers List */}
          <div className="space-y-3 px-4 pt-3 pb-8 bg-slate-50">
            {loading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-white border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] px-4 py-4"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-slate-200 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 rounded-full bg-slate-200 animate-pulse" />
                        <div className="h-3 w-1/3 rounded-full bg-slate-100 animate-pulse" />
                      </div>
                    </div>
                    <div className="ml-3 h-7 w-20 rounded-full bg-slate-200 animate-pulse" />
                  </div>
                ))}
              </>
            ) : golfers.length === 0 ? (
              <div className="px-4 pt-6 pb-10 text-center text-slate-500">
                <p className="text-sm font-medium">No golfers found here yet.</p>
                <p className="mt-1 text-xs">
                  Try another tab, search by name or club, or invite a friend to join Clbhouz.
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
                        handleFollowToggle(golfer.id, golfer.displayName, followingIds.has(golfer.id))
                      }
                      onFriendRequest={() => handleFriendRequest(golfer.id, golfer.displayName)}
                    />
                  ))}
                </ul>

                {/* Pagination - only show when not searching */}
                {!isSearching && totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                    <Button
                      variant="secondary"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      Previous 15 golfers
                    </Button>

                    <span className="flex-1 text-center">
                      Showing {startIndex}–{endIndex} of {totalCount} golfers
                    </span>

                    <Button
                      variant="secondary"
                      disabled={page === totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                      Next 15 golfers
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </FadeInContent>
    </div>
  );
};

export default GolfersToFollowPage;
