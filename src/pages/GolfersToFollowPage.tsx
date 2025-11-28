import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { GolferCard } from '@/components/golfers/GolferCard';
import { GolferCardSkeleton } from '@/components/golfers/GolferCardSkeleton';
import { useGolfersDiscovery, useSearchGolfers, FilterType } from '@/hooks/useGolfersDiscovery';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { cn } from '@/lib/utils';

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'suggested', label: 'Suggested' },
  { value: 'club', label: 'At your golf club' },
  { value: 'popular', label: 'Popular golfers' },
  { value: 'low_hcap', label: 'Lowest handicap golfers' },
];

export default function GolfersToFollowPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('suggested');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const isSearching = debouncedQuery.trim().length > 0;

  // Filtered/paginated results
  const { data: filteredData, isLoading: filteredLoading } = useGolfersDiscovery(activeFilter, page);
  
  // Search results
  const { data: searchResults, isLoading: searchLoading } = useSearchGolfers(debouncedQuery);

  const golfers = isSearching ? (searchResults || []) : (filteredData?.golfers || []);
  const totalCount = filteredData?.totalCount || 0;
  const isLoading = isSearching ? searchLoading : filteredLoading;

  const totalPages = Math.ceil(totalCount / 15);
  const startIndex = (page - 1) * 15 + 1;
  const endIndex = Math.min(page * 15, totalCount);

  useEffect(() => {
    setLastPage(page);
  }, [page]);

  const direction = page > lastPage ? 'right' : 'left';

  const handlePrevPage = () => {
    setPage(p => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setPage(p => Math.min(totalPages, p + 1));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <ClubhouseHeaderNew />

      <section className="max-w-3xl mx-auto px-4 pt-8 pb-6">
        <h1 className="text-2xl font-semibold text-foreground">Find golfers to follow</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Discover new golfers, see where they play, and build your friends' courses feed.
        </p>
      </section>

      <div className="max-w-3xl mx-auto px-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search golfers by name or club"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 rounded-lg border-slate-200 focus:border-slate-600"
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setActiveFilter(option.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                activeFilter === option.value
                  ? "bg-foreground text-background"
                  : "bg-background border border-border text-foreground/80 hover:bg-slate-50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <GolferCardSkeleton key={i} />
            ))}
          </div>
        ) : golfers.length === 0 ? (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {isSearching ? 'No golfers found' : 'No golfers found for this filter'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {isSearching
                ? `No golfers match "${searchQuery}". Try a different name or club.`
                : 'Try switching filters or searching by name/club.'}
            </p>
          </div>
        ) : (
          <>
            <ul
              key={`${activeFilter}-${page}`}
              className={cn(
                "space-y-3",
                direction === 'right' ? 'animate-slide-in-from-right' : 'animate-slide-in-from-left'
              )}
            >
              {golfers.map((golfer) => (
                <GolferCard key={golfer.id} golfer={golfer} />
              ))}
            </ul>

            {!isSearching && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <button
                  disabled={page === 1}
                  onClick={handlePrevPage}
                  className="h-11 px-6 rounded-lg border border-border bg-background shadow-sm disabled:opacity-40 disabled:cursor-default hover:bg-slate-50 transition-colors"
                >
                  Previous 15 golfers
                </button>

                <span className="flex-1 text-center">
                  Showing {startIndex}–{endIndex} of {totalCount} golfers
                </span>

                <button
                  disabled={page === totalPages}
                  onClick={handleNextPage}
                  className="h-11 px-6 rounded-lg border border-border bg-background shadow-sm disabled:opacity-40 disabled:cursor-default hover:bg-slate-50 transition-colors"
                >
                  Next 15 golfers
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
