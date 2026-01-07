import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100ListSummaries } from '@/hooks/useTop100ListSummaries';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { List, Map as MapIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import Top100LeaderboardPanel from '@/components/courses/Top100LeaderboardPanel';
import Top100MapModal from '@/components/top100/Top100MapModal';
import { Top100MapScope } from '@/hooks/useTop100MapCourses';
import { Top100RegionCard } from '@/components/top100/Top100RegionCard';
import Top100BackButton from '@/components/top100/Top100BackButton';
import { Top100ProgressSummary } from '@/components/top100/Top100ProgressSummary';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { cn } from '@/lib/utils';
import { PageRoot } from '@/components/layout/PageRoot';
import { getProgressInsightsForLists } from '@/lib/utils/progressInsightCopy';

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
  
  const [activeTab, setActiveTab] = useState<ValidTab>(safeTab);
  
  // View mode state for toggle highlight
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Map modal state
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  
  const [selectedListSlug, setSelectedListSlug] = useState<Top100MapScope>('global');

  // Toggle handlers
  const handleListClick = () => {
    setViewMode('list');
    setIsMapModalOpen(false);
  };

  const handleMapClick = () => {
    setViewMode('map');
    setIsMapModalOpen(true);
  };

  const handleMapModalClose = (open: boolean) => {
    if (!open) {
      setIsMapModalOpen(false);
      setViewMode('list'); // snap toggle back to List when closing
    }
  };

  // Guard against invalid data
  if (!lists && !listsLoading) {
    return (
      <PageRoot className="min-h-screen bg-[var(--bg-page)] safe-top compact-header-offset">
        <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-foreground mb-2">Unable to load Top 100 lists</h2>
            <p className="text-muted-foreground">Please try refreshing the page.</p>
          </div>
        </main>
      </PageRoot>
    );
  }

  if (listsLoading) {
    return (
      <PageRoot className="min-h-screen bg-[var(--bg-page)] safe-top compact-header-offset">
        <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded-sq-md" />
            <div className="h-64 bg-muted rounded-sq-md" />
          </div>
        </main>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen bg-[var(--bg-page)] safe-top compact-header-offset">
      <main className="px-4 md:container md:mx-auto md:px-0 pb-3">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <div className="pt-block pb-block">
            <Top100BackButton to="/courses?tab=top100" />
          </div>
          
          <div className="space-y-block">
          {/* Hero Section - polished spacing and hierarchy */}
          <div className="mx-auto flex max-w-5xl flex-col gap-sub px-4 pb-1">
            <h1 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              World's Top 100 Golf Courses
            </h1>
            <p className="text-center text-sm text-muted-foreground/70">
              Explore the most prestigious golf courses across the globe
            </p>
          </div>

          {/* Tabs: Courses | My Progress | Leaderboard - matches Golf Courses page exactly */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-transparent border-0 px-0 py-0 mb-block gap-0">
              <TabsTrigger 
                value="courses" 
                className="relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out data-[state=active]:after:w-full data-[state=inactive]:after:w-0 data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-[0.85]"
              >
                Courses
              </TabsTrigger>
              <TabsTrigger 
                value="my-progress" 
                className="relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out data-[state=active]:after:w-full data-[state=inactive]:after:w-0 data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-[0.85]"
              >
                My Progress
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboard" 
                className="relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out data-[state=active]:after:w-full data-[state=inactive]:after:w-0 data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-[0.85]"
              >
                Leaderboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-0">
              {/* Progress Summary */}
              {session && progress && (() => {
                const totalRated = progress.total_top100_rated ?? progress.total_played_top100 ?? 0;
                const listsCount = listSummaries?.filter(list => list.played_count > 0).length || 0;
                
                if (totalRated === 0) return null;
                
                return (
                  <Top100ProgressSummary
                    ratedCount={totalRated}
                    listCount={listsCount}
                  />
                );
              })()}
              
              {/* View Mode Toggle - polished segmented control */}
              <div className="flex justify-center py-3">
                <div className="inline-flex rounded-full bg-muted/50 p-[3px]">
                  <button
                    type="button"
                    onClick={handleListClick}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200',
                      viewMode === 'list'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'bg-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <List className="h-3.5 w-3.5" />
                    List
                  </button>

                  <button
                    type="button"
                    onClick={handleMapClick}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200',
                      viewMode === 'map'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'bg-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <MapIcon className="h-3.5 w-3.5" />
                    Map
                  </button>
                </div>
              </div>

              {/* Always render List view - Map is shown in modal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {summariesLoading ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    Loading Top 100 lists...
                  </div>
                ) : (
                  (() => {
                    // Track used phrases to avoid duplicates in viewport
                    const usedPhrases = new Set<string>();
                    return listSummaries?.map((list) => {
                      const card = (
                        <Top100RegionCard
                          key={list.id}
                          list={list}
                          onClick={() => navigate(`/top100/${list.slug}`)}
                          userId={session?.user?.id}
                          usedPhrases={usedPhrases}
                        />
                      );
                      return card;
                    });
                  })()
                )}
              </div>

              {/* Map Modal */}
              <Top100MapModal
                open={isMapModalOpen}
                onOpenChange={handleMapModalClose}
                scope={selectedListSlug}
                onScopeChange={setSelectedListSlug}
              />
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

      {/* Scroll to top button */}
      <ScrollToTopGlass />
    </PageRoot>
  );
};

export default Top100Hub;