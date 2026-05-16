import React, { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100ListSummaries } from '@/hooks/useTop100ListSummaries';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Map as MapIcon } from 'lucide-react';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import Top100MapModal from '@/components/top100/Top100MapModal';
import { Top100MapScope } from '@/hooks/useTop100MapCourses';
import { Top100RegionCard } from '@/components/top100/Top100RegionCard';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { PageRoot } from '@/components/layout/PageRoot';
import ShellSlot from '@/components/header/ShellSlot';
import SegmentedControl from '@/components/discover/SegmentedControl';

const Top100Hub = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useSupabaseSession();
  const { data: lists, isLoading: listsLoading } = useTop100Lists();
  const { data: progress } = useTop100ProgressForUser(session?.user?.id);
  const { data: listSummaries, isLoading: summariesLoading } = useTop100ListSummaries(session?.user?.id);

  const tabFromUrl = searchParams.get('tab');
  const viewFromUrl = searchParams.get('view');

  const validTabs = ['courses', 'my-progress'] as const;
  type ValidTab = typeof validTabs[number];
  const safeTab: ValidTab = validTabs.includes(tabFromUrl as any)
    ? (tabFromUrl as ValidTab)
    : 'courses';

  const [activeTab, setActiveTab] = useState<ValidTab>(safeTab);

  const handleTabChange = (id: string) => {
    const next = id as ValidTab;
    setActiveTab(next);
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  const [isMapModalOpen, setIsMapModalOpen] = useState(viewFromUrl === 'map');
  const [selectedListSlug, setSelectedListSlug] = useState<Top100MapScope>('global');

  const handleMapClick = () => setIsMapModalOpen(true);
  const handleMapModalClose = (open: boolean) => {
    if (!open) setIsMapModalOpen(false);
  };

  const perListSubline = useMemo(() => {
    if (!listSummaries || listSummaries.length === 0) return null;
    const order: Array<{ slug: string; label: string }> = [
      { slug: 'gb-i', label: 'GB&I' },
      { slug: 'global', label: 'GLOBAL' },
      { slug: 'usa', label: 'USA' },
      { slug: 'europe', label: 'EUROPE' },
    ];
    const parts = order.map(({ slug, label }) => {
      const summary = listSummaries.find(s => s.slug === slug);
      const count = summary?.played_count ?? 0;
      return { count, label };
    });
    return (
      <>
        {parts.map((p, i) => (
          <React.Fragment key={p.label}>
            {i > 0 && <span style={{ color: '#94A3B8' }}> · </span>}
            <span style={{ color: p.count > 0 ? '#F7931E' : '#94A3B8', fontWeight: 700 }}>{p.count}</span>
            {' '}
            {p.label}
          </React.Fragment>
        ))}
      </>
    );
  }, [listSummaries]);

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
      <ShellSlot>
        <SegmentedControl
          tabs={[
            { id: 'courses', label: 'Courses' },
            { id: 'my-progress', label: 'My Progress' },
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          variant="dark"
          align="center"
        />
      </ShellSlot>

      <main
        className="px-4 md:container md:mx-auto md:px-0 pb-3"
        style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="space-y-5 pt-4">
            {/* Editorial header — left-aligned, with optional Map pill on Courses tab */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
                    World's Best
                  </span>
                </div>
                <h1
                  className="text-foreground"
                  style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}
                >
                  Top 100 Golf Courses
                </h1>
                {session && perListSubline && activeTab === 'courses' && (
                  <p style={{
                    fontSize: 11, color: '#64748B', margin: '10px 0 0',
                    fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase',
                  }}>
                    {perListSubline}
                  </p>
                )}
              </div>

              {activeTab === 'courses' && (
                <button
                  type="button"
                  onClick={handleMapClick}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-[0.97]"
                  style={{
                    background: '#ffffff',
                    color: '#0F172A',
                    border: '1px solid rgba(15,23,42,0.10)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    marginTop: 2,
                  }}
                  aria-label="Open courses map"
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  Map
                </button>
              )}
            </div>

            {activeTab === 'courses' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summariesLoading ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    Loading Top 100 lists...
                  </div>
                ) : (
                  (() => {
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
            )}

            {activeTab === 'my-progress' && (
              <Top100MyProgressPanel />
            )}

            {/* Map Modal — outside conditional render so it survives tab switches */}
            <Top100MapModal
              open={isMapModalOpen}
              onOpenChange={handleMapModalClose}
              scope={selectedListSlug}
              onScopeChange={setSelectedListSlug}
            />
          </div>
        </div>
      </main>

      <ScrollToTopGlass />
    </PageRoot>
  );
};

export default Top100Hub;
