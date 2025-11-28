import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft } from 'lucide-react';
import { GolferCard } from '@/components/golfers/GolferCard';
import { GolferCardSkeleton } from '@/components/golfers/GolferCardSkeleton';
import { useGolfersDiscovery, FilterType } from '@/hooks/useGolfersDiscovery';
import { useFollowUser } from '@/hooks/useFollowUser';
import { useFriendActions } from '@/hooks/useFriendActions';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { FilterPillsRow, FilterOption } from '@/components/ui/FilterPillsRow';
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

  const filterOptions: FilterOption[] = [
    { id: 'suggested', label: 'Suggested' },
    { id: 'club', label: 'Home club' },
    { id: 'popular', label: 'Popular golfers' },
  ];

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/courses?tab=friends');
    }
  };

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);
  const direction = page > lastPage ? 'right' : 'left';

  return (
    <div className="min-h-screen bg-background page-with-header m-0 p-0">
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

          {/* Search Bar */}
          <div className="px-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search golfers by name or club"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-11 rounded-lg border-slate-200 focus:border-slate-600"
              />
            </div>
          </div>

          {/* Filter Pills Row - Reuse from Course Details */}
          <FilterPillsRow
            options={filterOptions}
            activeId={activeFilter}
            onChange={(id) => {
              setActiveFilter(id as FilterType);
              setPage(1);
            }}
            className="mt-4"
          />

          {/* Golfers List */}
          <div className="px-4 mt-6">
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
                  {searchInput.trim()
                    ? `No golfers match "${searchInput}". Try a different name or club.`
                    : 'No golfers to show here yet.'}
                  <br />
                  <span className="mt-1 inline-block">
                    Try another filter or search by name or club.
                  </span>
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
          </div>
        </main>
      </FadeInContent>
    </div>
  );
};

export default GolfersToFollowPage;
