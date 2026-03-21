import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100ListSummaries } from '@/hooks/useTop100ListSummaries';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { List, Map as MapIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import Top100MapModal from '@/components/top100/Top100MapModal';
import { Top100MapScope } from '@/hooks/useTop100MapCourses';
import { Top100RegionCard } from '@/components/top100/Top100RegionCard';
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
  const viewFromUrl = searchParams.get('view');
  
  // Validate tab and use safe default - removed 'leaderboard' tab
  const validTabs = ['courses', 'my-progress'] as const;
  type ValidTab = typeof validTabs[number];
  const safeTab: ValidTab = validTabs.includes(tabFromUrl as any) 
    ? (tabFromUrl as ValidTab) 
    : 'courses';
  
  const [activeTab, setActiveTab] = useState<ValidTab>(safeTab);
  
  // Scroll to top on tab switch
  const handleTabChange = (tab: ValidTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };
  
  // View mode state for toggle highlight
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Map modal state — auto-open if ?view=map
  const [isMapModalOpen, setIsMapModalOpen] = useState(viewFromUrl === 'map');
  
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
      setViewMode('list');
    }
  };

  // Guard against invalid data
  if (!lists && !listsLoading) {
    return (
      <PageRoot className="min-h-screen bg-background">
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
      <PageRoot className="min-h-screen bg-background">
        <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
          <div className="space-y-4">
            <Skeleton className="aspect-[16/10] rounded-2xl" />
            <Skeleton className="aspect-[16/10] rounded-2xl" />
          </div>
        </main>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen bg-background">
      <main className="px-4 md:container md:mx-auto md:px-0 pb-3">
        <div className="max-w-6xl mx-auto">
          
          <div className="space-y-5 pt-6">
          {/* Hero Section */}
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 pb-1">
            <h1 className="text-center text-[22px] font-bold text-foreground" style={{ letterSpacing: '-0.3px' }}>
              World's Top 100 Golf Courses
            </h1>
            <p className="text-center text-sm text-muted-foreground">
              Explore the most prestigious golf courses across the globe
            </p>
          </div>

          {/* Tabs: Courses | My Progress */}
          <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as ValidTab)} className="w-full">
            <TabsList className="flex gap-1 rounded-xl bg-muted/60 p-1 mb-5">
              <TabsTrigger 
                value="courses" 
                className="flex-1 py-2 px-4 text-sm rounded-lg transition-all duration-150 active:scale-[0.97] data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:border-0 data-[state=inactive]:text-muted-foreground data-[state=inactive]:font-medium data-[state=inactive]:bg-transparent data-[state=inactive]:border-0 data-[state=inactive]:shadow-none after:hidden"
              >
                Courses
              </TabsTrigger>
              <TabsTrigger 
                value="my-progress" 
                className="flex-1 py-2 px-4 text-sm rounded-lg transition-all duration-150 active:scale-[0.97] data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:border-0 data-[state=inactive]:text-muted-foreground data-[state=inactive]:font-medium data-[state=inactive]:bg-transparent data-[state=inactive]:border-0 data-[state=inactive]:shadow-none"
              >
                My Progress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-0">
              {/* Progress Summary */}
              {session && progress && (() => {
                const totalRated = progress.total_top100_rated ?? progress.total_played_top100 ?? 0;
                const listsWithProgress = listSummaries?.filter(list => list.played_count > 0) || [];
                const listsCount = listsWithProgress.length;
                const totalCourses = listsWithProgress.reduce((sum, list) => sum + (list.total_courses || 0), 0);
                
                if (totalRated === 0) return null;
                
                return (
                  <Top100ProgressSummary
                    ratedCount={totalRated}
                    listCount={listsCount}
                    totalCourses={totalCourses}
                  />
                );
              })()}
              
              {/* View Mode Toggle - Pill toggle style */}
              <div className="flex justify-center py-4">
                <div className="flex p-1 rounded-xl overflow-hidden bg-muted">
                  <button
                    type="button"
                    onClick={handleListClick}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]',
                      viewMode === 'list'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    )}
                  >
                    <List className="h-3.5 w-3.5" />
                    List
                  </button>

                  <button
                    type="button"
                    onClick={handleMapClick}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97]',
                      viewMode === 'map'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    )}
                  >
                    <MapIcon className="h-3.5 w-3.5" />
                    Map
                  </button>
                </div>
              </div>

              {/* Always render List view - Map is shown in modal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summariesLoading ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    Loading Top 100 lists...
                  </div>
                ) : (
                  (() => {
                    // Sort cards: highest progress first, 0% last
                    const sorted = [...(listSummaries || [])].sort((a, b) => {
                      const progA = a.total_courses > 0 ? a.played_count / a.total_courses : 0;
                      const progB = b.total_courses > 0 ? b.played_count / b.total_courses : 0;
                      return progB - progA;
                    });
                    const usedPhrases = new Set<string>();
                    return sorted.map((list) => (
                      <Top100RegionCard
                        key={list.id}
                        list={list}
                        onClick={() => navigate(`/top100/${list.slug}`)}
                        userId={session?.user?.id}
                        usedPhrases={usedPhrases}
                      />
                    ));
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
