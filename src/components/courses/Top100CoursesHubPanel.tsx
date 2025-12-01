import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100ListSummaries } from '@/hooks/useTop100ListSummaries';
import { useFriendsOnTop100Journey } from '@/hooks/useFriendsOnTop100Journey';
import { useGolfCoursesInfinite } from '@/hooks/useGolfCoursesInfinite';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { getTop100Club } from '@/lib/top100Club';
import { getTop100RingDotClass } from '@/lib/top100RingStyles';
import SquircleImage from '@/components/ui/SquircleImage';
import { Search, Award, X, Trophy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import CourseCard from './CourseCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { COURSES_PAGE_SIZE } from '@/config/pagination';
import { FLAGS } from '@/config/flags';
import {
  PRIMARY_REGIONS,
  SUBREGIONS,
  type PrimaryRegionKey,
  normalizeLabel,
} from '@/constants/courseRegions';

type Top100SortOption = 'official' | 'name_asc' | 'name_desc';

function listSlugToRegionKey(slug: string): PrimaryRegionKey {
  switch (slug) {
    case 'gb-i':
    case 'gb-i-top100':
      return PRIMARY_REGIONS.GB_I;
    case 'usa':
    case 'usa-top100':
      return PRIMARY_REGIONS.USA;
    case 'europe':
    case 'europe-top100':
      return PRIMARY_REGIONS.EUROPE;
    case 'rest':
    case 'rest-top100':
      return PRIMARY_REGIONS.REST;
    default:
      return PRIMARY_REGIONS.ALL;
  }
}

const Top100CoursesHubPanel = () => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const listTopRef = useRef<HTMLDivElement>(null);
  
  // Search and filter state
  const [selectedList, setSelectedList] = useState('global');
  const [selectedSubregion, setSelectedSubregion] = useState<'all' | string>('all');
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [sortOption, setSortOption] = useState<Top100SortOption>('official');
  const [showSortSheet, setShowSortSheet] = useState(false);

  // Fetch user's Top 100 progress
  const { data: progress } = useTop100ProgressForUser(user?.id);
  const { data: listSummaries = [] } = useTop100ListSummaries(user?.id);
  const { data: friendsData = [] } = useFriendsOnTop100Journey(user?.id);
  
  // Mock friends for testing layout with 15+ friends
  const mockFriends = FLAGS.TOP100_MOCK_FRIENDS_ENABLED ? [
    { user_id: 'mock1', profile: { display_name: 'Sarah Mitchell', username: 'sarahm', profile_photo_url: null }, top100CoursesPlayed: 8 },
    { user_id: 'mock2', profile: { display_name: 'James Anderson', username: 'jamesA', profile_photo_url: null }, top100CoursesPlayed: 12 },
    { user_id: 'mock3', profile: { display_name: 'Emma Wilson', username: 'emmaw', profile_photo_url: null }, top100CoursesPlayed: 5 },
    { user_id: 'mock4', profile: { display_name: 'David Chen', username: 'dchen', profile_photo_url: null }, top100CoursesPlayed: 15 },
    { user_id: 'mock5', profile: { display_name: 'Lisa Thompson', username: 'lisat', profile_photo_url: null }, top100CoursesPlayed: 7 },
    { user_id: 'mock6', profile: { display_name: 'Michael Brown', username: 'mbrown', profile_photo_url: null }, top100CoursesPlayed: 20 },
    { user_id: 'mock7', profile: { display_name: 'Sophie Davis', username: 'sophied', profile_photo_url: null }, top100CoursesPlayed: 3 },
    { user_id: 'mock8', profile: { display_name: 'Robert Taylor', username: 'rtaylor', profile_photo_url: null }, top100CoursesPlayed: 18 },
    { user_id: 'mock9', profile: { display_name: 'Jessica Lee', username: 'jessicalee', profile_photo_url: null }, top100CoursesPlayed: 9 },
    { user_id: 'mock10', profile: { display_name: 'Tom Harrison', username: 'tomh', profile_photo_url: null }, top100CoursesPlayed: 11 },
  ] : [];
  
  const friends = [...friendsData, ...mockFriends];

  // Extract stats from progress - prefer new field, fallback to old
  const totalRated = progress?.total_top100_rated ?? progress?.total_played_top100 ?? 0;
  const regionsCount = progress?.regions_count || 0;
  
  // Use new unified club system
  const club = getTop100Club(totalRated);
  const ringKey = club?.ring ?? 'none';
  const ringDotClass = getTop100RingDotClass(ringKey);

  // Calculate lists count from summaries (only lists where user has played at least one course)
  const listsCount = listSummaries.filter(list => list.played_count > 0).length;

  const handleOpenTop100Journey = () => {
    if (user) {
      navigate('/top100?tab=my-progress');
    } else {
      navigate('/auth?redirect=/top100?tab=my-progress');
    }
  };

  const handleOpenTop100Leaderboard = () => {
    navigate('/top100?tab=leaderboard');
  };

  const hasFriends = friends && friends.length > 0;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [selectedList, selectedSubregion, debouncedSearch, sortOption]);

  // Fetch available lists
  const { data: lists = [] } = useTop100Lists();

  // Validate selectedList against available lists
  useEffect(() => {
    if (!lists || !lists.length) return;

    setSelectedList((current) => {
      if (lists.some((list) => list.slug === current)) return current;
      const global = lists.find((l) => l.slug === 'global');
      return global?.slug ?? lists[0].slug;
    });
  }, [lists]);

  // Fetch courses with pagination
  const { 
    data: coursesData,
    isLoading,
    fetchNextPage,
    hasNextPage: hasMorePages,
    isFetchingNextPage
  } = useGolfCoursesInfinite({
    searchQuery: debouncedSearch,
    listSlug: selectedList,
  });

  // Flatten pages into single array
  const courses = React.useMemo(() => {
    return coursesData?.pages.flat() ?? [];
  }, [coursesData]);

  // Apply subregion filter and sorting
  const normalizedSelectedSub = selectedSubregion === 'all' ? null : selectedSubregion;

  let filteredCourses = (courses || []).filter((course) => {
    if (!normalizedSelectedSub) return true;
    if (!course.sub_country) return false;
    return normalizeLabel(course.sub_country) === normalizedSelectedSub;
  });

  // Apply sorting
  filteredCourses = [...filteredCourses].sort((a, b) => {
    switch (sortOption) {
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'official':
      default:
        const rankA = selectedList.includes('global') ? a.list_memberships.find(m => m.list_slug.includes('global'))?.rank :
                     selectedList.includes('usa') ? a.list_memberships.find(m => m.list_slug.includes('usa'))?.rank :
                     selectedList.includes('gb-i') ? a.list_memberships.find(m => m.list_slug.includes('gb-i'))?.rank :
                     selectedList.includes('europe') ? a.list_memberships.find(m => m.list_slug.includes('europe'))?.rank :
                     a.list_memberships[0]?.rank;
        const rankB = selectedList.includes('global') ? b.list_memberships.find(m => m.list_slug.includes('global'))?.rank :
                     selectedList.includes('usa') ? b.list_memberships.find(m => m.list_slug.includes('usa'))?.rank :
                     selectedList.includes('gb-i') ? b.list_memberships.find(m => m.list_slug.includes('gb-i'))?.rank :
                     selectedList.includes('europe') ? b.list_memberships.find(m => m.list_slug.includes('europe'))?.rank :
                     b.list_memberships[0]?.rank;
        return (rankA || 999) - (rankB || 999);
    }
  });

  const totalCount = filteredCourses.length;
  const paginatedCourses = filteredCourses.slice(page * COURSES_PAGE_SIZE, (page + 1) * COURSES_PAGE_SIZE);
  const startIndex = totalCount === 0 ? 0 : page * COURSES_PAGE_SIZE + 1;
  const endIndex = Math.min((page + 1) * COURSES_PAGE_SIZE, totalCount);
  const hasNextPage = endIndex < totalCount || hasMorePages;

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  // Build list options
  const listOptions = lists.length > 0 
    ? (() => {
        const transformed = lists.map(list => ({
          value: list.slug,
          label: list.short_label.includes('Top 100') ? list.short_label : `${list.short_label} Top 100`
        }));
        const desiredOrder = ['global', 'usa', 'gb-i', 'europe'];
        return transformed.sort((a, b) => {
          const indexA = desiredOrder.indexOf(a.value);
          const indexB = desiredOrder.indexOf(b.value);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return 0;
        });
      })()
    : [
        { value: 'global', label: 'Global Top 100' },
        { value: 'usa', label: 'USA Top 100' },
        { value: 'gb-i', label: 'GB&I Top 100' },
        { value: 'europe', label: 'Europe Top 100' },
      ];

  const currentListLabel = listOptions.find((opt) => opt.value === selectedList)?.label || 'Global Top 100';

  const sortLabelMap: Record<Top100SortOption, string> = {
    official: 'Official ranking',
    name_asc: 'A–Z',
    name_desc: 'Z–A',
  };

  const handleSortSelection = (option: Top100SortOption) => {
    setSortOption(option);
    setShowSortSheet(false);
  };

  const handleResetFilters = () => {
    setSelectedList('global');
    setSelectedSubregion('all');
    setSearchTerm('');
    setPage(0);
  };

  const handleCourseClick = () => {
    // Placeholder for scroll position tracking
  };

  const hasActiveFilters = selectedList !== 'global' || selectedSubregion !== 'all' || searchTerm !== '';

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Top 100 Club hero */}
      <section className="rounded-3xl border border-border/60 bg-card shadow-[0_4px_28px_rgba(0,0,0,0.14)] px-4 py-5 relative overflow-hidden before:absolute before:inset-0 before:bg-white/[0.02] before:pointer-events-none">
        {/* Title + subtitle */}
        <div>
          <h2 className="text-[18px] font-semibold text-foreground">Top 100 Club</h2>
          <p className="text-[12px] text-muted-foreground">
            Your journey across the world&apos;s greatest courses.
          </p>
        </div>

        {/* Big stat row */}
        <div className="mt-4">
          {user ? (
            <>
              {/* Combined pill with trophy, text, and club badge */}
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm px-3 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <Trophy className="h-4 w-4 text-foreground" />
                <span className="font-semibold text-foreground text-[14px]">
                  You&apos;ve rated {totalRated} Top 100 course{totalRated === 1 ? '' : 's'}
                </span>
                {club && (
                  <>
                    <span className="mx-1 text-slate-500">·</span>
                    <span className="inline-flex items-center gap-1">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full border border-slate-950/20',
                          ringDotClass
                        )}
                      />
                      <span className="font-medium text-foreground text-[14px]">{club.label}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-orange transition-[width] duration-500"
                  style={{ width: `${Math.min(100, (totalRated / 100) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-[14px] text-muted-foreground">
              Sign in to track your progress and see where you rank on the global leaderboard.
            </p>
          )}
        </div>

        {/* CTA */}
        <Button
          variant="primary"
          onClick={handleOpenTop100Journey}
          className="mt-4 w-full active:scale-[0.98] transition-transform duration-150"
        >
          {user ? 'Open your Top 100 Journey' : 'Sign in to join the Top 100 Club'}
          <span className="text-[16px]">↗</span>
        </Button>
      </section>

      {/* Friends on the Top 100 journey - horizontal avatar strip */}
      {user && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-foreground">
              Friends on the Top 100 journey
            </p>
            <button
              type="button"
              className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleOpenTop100Leaderboard}
            >
              View leaderboard →
            </button>
          </div>

          {!hasFriends ? (
            <p className="text-[12px] text-muted-foreground">
              None of your friends have started the Top 100 yet.
            </p>
          ) : (
            <div className="flex gap-8 overflow-x-auto">
              {friends.slice(0, 10).map((f) => {
                const displayName = f.profile.display_name || f.profile.username || '?';
                const initial = displayName.slice(0, 1).toUpperCase();
                
                return (
                  <button
                    key={f.user_id}
                    type="button"
                    onClick={() => navigate(`/profile/${f.profile.username}?tab=top100`)}
                    className="flex flex-col items-center gap-2 flex-shrink-0"
                  >
                    {f.profile.profile_photo_url ? (
                      <SquircleImage
                        src={f.profile.profile_photo_url}
                        alt={displayName}
                        size={48}
                        ringWidth={1.5}
                        ringColor="rgba(203, 213, 225, 0.4)"
                        className="flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 flex items-center justify-center bg-muted text-muted-foreground text-[14px] font-semibold rounded-[22%] ring-1 ring-border/30">
                        {initial}
                      </div>
                    )}
                    <span className="max-w-[96px] truncate text-[15px] font-semibold text-foreground">
                      {displayName}
                    </span>
                    {typeof f.top100CoursesPlayed === 'number' && (
                      <span className="text-[13px] text-muted-foreground font-medium">
                        {f.top100CoursesPlayed} course{f.top100CoursesPlayed === 1 ? '' : 's'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Divider */}
      <div className="mt-6 mb-6 h-px w-full bg-slate-200/70" />

      {/* 4. Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search within this Top 100 list"
          className="pl-10 pr-10 h-11 bg-card border border-border/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--slate-secondary)]/70 focus-visible:border-[color:var(--slate-secondary)] transition-shadow text-base placeholder:text-[15px]"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 5. Top 100 List Selector + Sub-region */}
      <div className="max-w-xl mx-auto flex items-center justify-center gap-3">
        <div className="flex-1">
          <Select
            value={selectedList}
            onValueChange={(val) => {
              setSelectedList(val);
              setPage(0);
              const regionKey = listSlugToRegionKey(val);
              if (!SUBREGIONS[regionKey as Exclude<PrimaryRegionKey, 'all'>]?.length) {
                setSelectedSubregion('all');
              }
            }}
          >
            <SelectTrigger className="h-11 w-full bg-card border border-border/60 rounded-xl justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border data-[state=open]:ring-0 data-[state=open]:border-border/60 transition-shadow">
              <SelectValue placeholder="Choose Top 100 list" />
            </SelectTrigger>
            <SelectContent>
              {listOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sub-region filter */}
        {(() => {
          const regionKey = listSlugToRegionKey(selectedList);
          const subregions = SUBREGIONS[regionKey as Exclude<PrimaryRegionKey, 'all'>] || [];
          if (!subregions.length) return null;

          return (
            <div className="flex-1">
              <Select
                value={selectedSubregion}
                onValueChange={setSelectedSubregion}
              >
                <SelectTrigger className="h-11 w-full bg-card border border-border/60 rounded-xl justify-between text-base shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-0 focus-visible:ring-1 focus-visible:ring-border/70 focus-visible:border-border data-[state=open]:ring-0 data-[state=open]:border-border/60 transition-shadow">
                  <SelectValue placeholder="All sub-regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sub-regions</SelectItem>
                  {subregions.map((s) => (
                    <SelectItem key={s} value={normalizeLabel(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })()}
      </div>

      {/* 6. Context line with sort button */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground flex-1">
            Exploring the <span className="font-medium">{currentListLabel}</span>
          </p>
          <Button
            variant="tertiary"
            size="tertiary"
            onClick={() => setShowSortSheet(true)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span className="text-muted-foreground">Sort:</span>
            <span className="text-foreground">{sortLabelMap[sortOption]}</span>
          </Button>
        </div>
      )}

      {/* 7. Results */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground mb-1">
            <Award className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold">No courses match your filters</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Try clearing your search or choosing a different Top 100 list to browse.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleResetFilters}
            >
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Scroll target for pagination */}
          <div ref={listTopRef} className="h-0" />
          
          <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0">
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6">
              {paginatedCourses.map((course) => (
                <div key={course.id} className="mb-4 sm:mb-0">
                  <CourseCard 
                    course={course}
                    showRankBadge={true}
                    onClick={handleCourseClick}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Pagination Footer */}
          <div className="flex flex-col items-center gap-3 mt-8">
            {/* Pagination Buttons */}
            {(page > 0 || hasNextPage) && (
              <div className={`flex items-center gap-3 w-full ${page === 0 ? 'justify-center' : 'justify-between'}`}>
                {page > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={isLoading}
                  >
                    Previous {COURSES_PAGE_SIZE} courses
                  </Button>
                )}
                {hasNextPage && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (hasMorePages && endIndex >= totalCount) {
                        fetchNextPage();
                      } else {
                        setPage((p) => p + 1);
                      }
                    }}
                    disabled={isLoading || isFetchingNextPage}
                  >
                    {isFetchingNextPage ? 'Loading...' : `Next ${COURSES_PAGE_SIZE} courses`}
                  </Button>
                )}
              </div>
            )}
            <p className="text-xs text-slate-500">
              Showing {startIndex}–{endIndex} of {totalCount} courses
            </p>
          </div>
        </div>
      )}

      {/* Sort Bottom Sheet */}
      <BottomSheet
        open={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        ariaLabelledBy="sort-options-title"
      >
        <div className="px-4 py-3">
          {(['official', 'name_asc', 'name_desc'] as Top100SortOption[]).map((option, index, arr) => (
            <React.Fragment key={option}>
              <button
                onClick={() => handleSortSelection(option)}
                className={`
                  w-full text-left px-4 py-3.5 transition-colors rounded-lg
                  ${sortOption === option
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                {sortLabelMap[option]}
              </button>
              {index < arr.length - 1 && (
                <div className="border-t border-slate-200/40 my-0.5" />
              )}
            </React.Fragment>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};

export default Top100CoursesHubPanel;
