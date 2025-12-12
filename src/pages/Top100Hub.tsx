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
      <PageRoot className="min-h-screen bg-background safe-top">
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
      <PageRoot className="min-h-screen bg-background safe-top">
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
    <PageRoot className="min-h-screen bg-background safe-top">
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

          {/* Tabs: Courses | My Progress | Leaderboard */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/70 border border-border/60 px-2 py-[3px] mb-block">
              <TabsTrigger 
                value="courses" 
                className="text-sm px-3 py-[6px] rounded-sq-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
              >
                Courses
              </TabsTrigger>
              <TabsTrigger 
                value="my-progress" 
                className="text-sm px-3 py-[6px] rounded-sq-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
              >
                My Progress
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboard" 
                className="text-sm px-3 py-[6px] rounded-sq-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
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
              
              {/* View Mode Toggle - centered with balanced spacing */}
              <div className="flex justify-center py-4">
                <div className="inline-flex rounded-sq-sm bg-muted/60 border border-border/50 p-0.5">
                  <button
                    type="button"
                    onClick={handleListClick}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-sq-xs px-3.5 py-1.5 text-sm font-medium transition-colors',
                      viewMode === 'list'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'bg-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <List className="h-4 w-4" />
                    List
                  </button>

                  <button
                    type="button"
                    onClick={handleMapClick}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-sq-xs px-3.5 py-1.5 text-sm font-medium transition-colors',
                      viewMode === 'map'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'bg-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <MapIcon className="h-4 w-4" />
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
                  listSummaries?.map((list) => (
                    <Top100RegionCard
                      key={list.id}
                      list={list}
                      onClick={() => navigate(`/top100/${list.slug}`)}
                    />
                  ))
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