import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100ListSummaries } from '@/hooks/useTop100ListSummaries';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Globe, MapPin, List, Map as MapIcon, Trophy } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import Top100LeaderboardPanel from '@/components/courses/Top100LeaderboardPanel';
import Top100MapView from '@/components/courses/Top100MapView';
import { Top100MapScope } from '@/hooks/useTop100MapCourses';
import { getRingLabel } from '@/lib/top100Prestige';
import { Top100RegionCard } from '@/components/top100/Top100RegionCard';

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
    viewFromUrl ?? 'list'
  );
  
  const [selectedListSlug, setSelectedListSlug] = useState<Top100MapScope>('global-top-100');

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

      <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-foreground mb-3">
              World's Top 100 Golf Courses
            </h1>
            <p className="text-xl text-muted-foreground">
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
              {/* Progress Chip */}
              {session && progress && (progress.total_top100_rated ?? progress.total_played_top100 ?? 0) > 0 && (() => {
                const totalRated = progress.total_top100_rated ?? progress.total_played_top100 ?? 0;
                return (
                  <div className="flex justify-center mb-6">
                    <button
                      onClick={() => setActiveTab('my-progress')}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm hover:border-primary-accent/60 hover:bg-muted/50 transition-all"
                    >
                      <Trophy className="h-4 w-4 text-primary-accent" />
                      <span className="font-medium">
                        You've rated {totalRated} Top 100 course{totalRated === 1 ? '' : 's'}
                      </span>
                      {progress.club_ring && progress.club_ring !== 'none' && (
                        <span className="text-muted-foreground">
                          · {progress.club_label}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })()}
              
              {/* View Mode Toggle */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1">
                  <button
                    onClick={() => setCoursesViewMode('list')}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                      coursesViewMode === 'list'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <List className="h-4 w-4" />
                    List
                  </button>
                  <button
                    onClick={() => setCoursesViewMode('map')}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                      coursesViewMode === 'map'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <MapIcon className="h-4 w-4" />
                    Map
                  </button>
                </div>
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
                <div className="space-y-4">
                  {/* List Selector for Map */}
                  <div className="flex justify-center">
                    <div className="inline-flex h-10 items-center gap-2 rounded-lg bg-muted p-1">
                      {lists?.map((list) => (
                        <button
                          key={list.id}
                          onClick={() => setSelectedListSlug(list.slug as Top100MapScope)}
                          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                            selectedListSlug === list.slug
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {list.slug === 'global-top-100' && <Globe className="h-4 w-4" />}
                          {list.slug === 'gb-i-top-100' && <CountryFlag country="Britain & Ireland" size="sm" />}
                          {list.slug === 'usa-top-100' && <CountryFlag country="USA" size="sm" />}
                          {list.slug === 'europe-top-100' && <CountryFlag country="Continental Europe" size="sm" />}
                          <span className="hidden sm:inline">{list.short_label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Top100MapView scope={selectedListSlug} />
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
      </main>
    </div>
  );
};

export default Top100Hub;
