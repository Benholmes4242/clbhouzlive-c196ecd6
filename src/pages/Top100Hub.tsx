import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100ListSummaries } from '@/hooks/useTop100ListSummaries';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { MapPin, Trophy } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import Top100LeaderboardPanel from '@/components/courses/Top100LeaderboardPanel';
import Top100MapView from '@/components/courses/Top100MapView';
import { Top100MapScope } from '@/hooks/useTop100MapCourses';
import { Top100RegionCard } from '@/components/top100/Top100RegionCard';
import Top100BackButton from '@/components/top100/Top100BackButton';
import { getTop100RingDotClass } from '@/lib/top100RingStyles';
import { cn } from '@/lib/utils';

const Top100Hub = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useSupabaseSession();
  const { data: lists, isLoading: listsLoading } = useTop100Lists();
  const { data: progress } = useTop100ProgressForUser(session?.user?.id);
  const { data: listSummaries, isLoading: summariesLoading } = useTop100ListSummaries(session?.user?.id);

  const tabFromUrl = searchParams.get('tab');
  
  // Validate tab and use safe default
  const validTabs = ['courses', 'my-progress', 'leaderboard'] as const;
  type ValidTab = typeof validTabs[number];
  const safeTab: ValidTab = validTabs.includes(tabFromUrl as any) 
    ? (tabFromUrl as ValidTab) 
    : 'courses';
  
  const viewFromUrl = searchParams.get('view') as 'list' | 'map' | null;

  const [activeTab, setActiveTab] = useState<ValidTab>(safeTab);
  
  const [coursesViewMode, setCoursesViewMode] = useState<'list' | 'map'>(
    viewFromUrl ?? 'map'
  );
  
  // Shared filter state for both List and Map views
  type RegionFilter = 'GLOBAL' | 'GBI' | 'USA' | 'EUROPE';
  type RatingFilter = 'ALL' | 'RATED' | 'NOT_RATED';
  
  interface Top100Filters {
    region: RegionFilter;
    rating: RatingFilter;
  }
  
  const [filters, setFilters] = useState<Top100Filters>({
    region: 'GLOBAL',
    rating: 'ALL',
  });
  
  // Map RegionFilter to Top100MapScope
  const regionToScope = (region: RegionFilter): Top100MapScope => {
    switch (region) {
      case 'GBI': return 'gb-i';
      case 'USA': return 'usa';
      case 'EUROPE': return 'europe';
      case 'GLOBAL':
      default: return 'global';
    }
  };
  
  const selectedListSlug = regionToScope(filters.region);

  // Guard against invalid data
  if (!lists && !listsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ClubhouseHeaderNew />
        <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-foreground mb-2">Unable to load Top 100 lists</h2>
            <p className="text-muted-foreground">Please try refreshing the page.</p>
          </div>
        </main>
      </div>
    );
  }

  const getProgress = (listId: string) => {
    if (!progress || !progress.lists) return null;
    return progress.lists.find((p) => p.listId === listId);
  };

  if (listsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ClubhouseHeaderNew />
        <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded-xl" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClubhouseHeaderNew />

      <main className="px-4 md:container md:mx-auto md:px-0 pb-3">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <div className="px-4 pt-4 pb-5">
            <Top100BackButton to="/courses?tab=top100" />
          </div>
          
          <div className="space-y-6">
          {/* Hero Section */}
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 pb-2">
            <h1 className="text-center text-3xl font-semibold tracking-tight text-slate-900">
              World's Top 100 Golf Courses
            </h1>
            <p className="text-center text-sm text-slate-500">
              Explore the most prestigious golf courses across the globe
            </p>
          </div>

          {/* Tabs: Courses | My Progress | Leaderboard */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/70 border border-border/60 px-2 py-[3px] mb-5">
              <TabsTrigger 
                value="courses" 
                className="text-sm px-3 py-[6px] rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
              >
                Courses
              </TabsTrigger>
              <TabsTrigger 
                value="my-progress" 
                className="text-sm px-3 py-[6px] rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
              >
                My Progress
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboard" 
                className="text-sm px-3 py-[6px] rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
              >
                Leaderboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-0">
              {/* Smart Summary Bar */}
              {session && progress && (progress.total_top100_rated ?? progress.total_played_top100 ?? 0) > 0 && (() => {
                const totalRated = progress.total_top100_rated ?? progress.total_played_top100 ?? 0;
                const ringDotClass = getTop100RingDotClass(progress.club_ring ?? 'none');
                return (
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between rounded-2xl bg-white shadow-sm border border-slate-200 px-4 py-3">
                      {/* Left: rating + club */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                          🏆
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500">You've rated</span>
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <span>{totalRated} Top 100 course{totalRated === 1 ? '' : 's'}</span>
                            {progress.club_ring && progress.club_ring !== 'none' && progress.club_label && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-slate-400" />
                                <span className="text-xs font-medium text-slate-700">{progress.club_label}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: List / Map toggle */}
                      <div className="ml-3 inline-flex rounded-full bg-slate-100 p-1 text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => setCoursesViewMode('list')}
                          className={[
                            'px-3 py-1 rounded-full transition',
                            coursesViewMode === 'list'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600',
                          ].join(' ')}
                        >
                          List
                        </button>
                        <button
                          type="button"
                          onClick={() => setCoursesViewMode('map')}
                          className={[
                            'px-3 py-1 rounded-full transition',
                            coursesViewMode === 'map'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600',
                          ].join(' ')}
                        >
                          Map
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Inline Region Selector */}
              <div className="px-4 pt-3">
                <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                  {[
                    { key: 'GLOBAL' as RegionFilter, label: 'Global', icon: '🌍' },
                    { key: 'GBI' as RegionFilter, label: 'GB&I', icon: '🇬🇧' },
                    { key: 'USA' as RegionFilter, label: 'USA', icon: '🇺🇸' },
                    { key: 'EUROPE' as RegionFilter, label: 'Europe', icon: '🇪🇺' },
                  ].map((option) => {
                    const selected = filters.region === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setFilters(prev => ({ ...prev, region: option.key }))}
                        className="relative pb-2"
                      >
                        <span
                          className={[
                            'flex items-center gap-1 transition',
                            selected ? 'text-slate-900' : 'text-slate-500',
                          ].join(' ')}
                        >
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </span>
                        {selected && (
                          <span className="absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-slate-900" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating Segmented Control + Reset */}
              <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                {/* Segmented control */}
                <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-medium">
                  {[
                    { key: 'ALL' as RatingFilter, label: 'All' },
                    { key: 'RATED' as RatingFilter, label: 'Rated' },
                    { key: 'NOT_RATED' as RatingFilter, label: 'Not Yet Rated' },
                  ].map((option) => {
                    const selected = filters.rating === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setFilters(prev => ({ ...prev, rating: option.key }))}
                        className={[
                          'px-3 py-1 rounded-full transition',
                          selected
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600',
                        ].join(' ')}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                {/* Reset */}
                <button
                  type="button"
                  onClick={() => setFilters({ region: 'GLOBAL', rating: 'ALL' })}
                  className="ml-3 text-xs font-medium text-slate-500 underline underline-offset-2"
                >
                  Reset
                </button>
              </div>

              {coursesViewMode === 'list' ? (
                /* Region Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {summariesLoading ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      Loading Top 100 lists...
                    </div>
                  ) : (
                    listSummaries?.map((list) => (
                      <Top100RegionCard
                        key={list.id}
                        list={list}
                        onClick={() => navigate(`/top100/${list.slug}`)}
                      />
                    ))
                  )}
                </div>
              ) : (
                /* Map View */
                <div className="space-y-0">
                  <Top100MapView 
                    scope={selectedListSlug}
                    ratingFilter={filters.rating}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-progress" className="mt-0">
              <Top100MyProgressPanel />
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-0">
              <Top100LeaderboardPanel />
            </TabsContent>
          </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Top100Hub;
