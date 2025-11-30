import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Globe, MapPin, List, Map as MapIcon, Trophy } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import Top100LeaderboardPanel from '@/components/courses/Top100LeaderboardPanel';
import Top100MapView from '@/components/courses/Top100MapView';
import { Top100MapScope } from '@/hooks/useTop100MapCourses';
import { getRingLabel } from '@/lib/top100Prestige';
import { cn } from '@/lib/utils';

const Top100Hub = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useSupabaseSession();
  const { data: lists, isLoading: listsLoading } = useTop100Lists();
  const { data: progress } = useTop100ProgressForUser(session?.user?.id);

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

  const getRegionIcon = (slug: string) => {
    switch (slug) {
      case 'global-top-100':
        return <Globe className="w-8 h-8" />;
      case 'gb-i-top-100':
        return <CountryFlag country="Britain & Ireland" size="lg" />;
      case 'usa-top-100':
        return <CountryFlag country="USA" size="lg" />;
      case 'europe-top-100':
        return <CountryFlag country="Continental Europe" size="lg" />;
      default:
        return <MapPin className="w-8 h-8" />;
    }
  };

  const getRegionBackground = (slug: string) => {
    switch (slug) {
      case 'global-top-100':
        return '/lovable-uploads/bd96819b-505e-4a35-b242-d106babe5179.png';
      case 'gb-i-top-100':
        return 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=800&fit=crop';
      case 'usa-top-100':
        return 'https://images.unsplash.com/photo-1629048821995-e30a7ba7f063?w=1200&h=800&fit=crop';
      case 'europe-top-100':
        return 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&h=800&fit=crop';
      default:
        return '';
    }
  };

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
          <header className="mb-4 flex flex-col gap-3 px-4 sm:px-0">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Top 100 hub
              </p>
              <h1 className="mt-1 text-lg font-semibold text-slate-50 sm:text-xl">
                Your global Top 100 journey
              </h1>
              <p className="mt-1 text-[13px] text-slate-400 max-w-2xl">
                Switch between the full course lists, your personal progress, and the
                global leaderboard – all in one place.
              </p>
            </div>
          </header>

          {/* Tabs: Courses | My Progress | Leaderboard */}
          <nav className="mb-3 px-4 sm:px-0">
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-800/80 bg-slate-950/80 p-1">
              {[
                { id: 'courses', label: 'Courses' },
                { id: 'my-progress', label: 'My progress' },
                { id: 'leaderboard', label: 'Leaderboard' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors',
                      isActive
                        ? 'bg-slate-100 text-slate-900 shadow-sm'
                        : 'text-slate-300 hover:text-slate-50 hover:bg-slate-900/70'
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">

            <TabsContent value="courses" className="mt-0">
              {/* Progress Chip */}
              {session && progress && progress.total_played_top100 > 0 && (
                <div className="flex justify-center mb-6">
                  <button
                    onClick={() => setActiveTab('my-progress')}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm hover:border-primary-accent/60 hover:bg-muted/50 transition-all"
                  >
                    <Trophy className="h-4 w-4 text-primary-accent" />
                    <span className="font-medium">
                      You've played {progress.total_played_top100} Top 100 course{progress.total_played_top100 === 1 ? '' : 's'}
                    </span>
                    {progress.prestige_ring && (
                      <span className="text-muted-foreground">
                        · {getRingLabel(progress.prestige_ring)}
                      </span>
                    )}
                  </button>
                </div>
              )}
              
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
                  {lists?.map((list) => {
                  const progressData = getProgress(list.id);
                  const backgroundImage = getRegionBackground(list.slug);

                  return (
                    <div
                      key={list.id}
                      onClick={() => navigate(`/top100/${list.slug}`)}
                      className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                      style={{
                        backgroundImage: backgroundImage
                          ? `url(${backgroundImage})`
                          : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {/* Dark Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                      {/* Content */}
                      <div className="relative h-full flex flex-col justify-between p-6">
                        {/* Icon */}
                        <div className="flex justify-end">
                          <div className="text-foreground/90">{getRegionIcon(list.slug)}</div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-3">
                          <h2 className="font-display text-3xl font-bold text-foreground">
                            {list.short_label}
                          </h2>
                          
                          {list.description && (
                            <p className="text-foreground/80 text-lg">{list.description}</p>
                          )}

                          {/* Progress Pill */}
                          {progressData && session && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                              <span className="text-foreground font-medium">
                                {progressData.played} / {progressData.total} played
                              </span>
                            </div>
                          )}

                          {/* CTA */}
                          <div className="pt-2">
                            <span className="text-foreground/90 text-lg font-medium group-hover:text-foreground transition-colors flex items-center gap-2">
                              View Courses
                              <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
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
