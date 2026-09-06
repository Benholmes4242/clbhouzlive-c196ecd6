import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CoursesPageHero from './CoursesPageHero';
import MyCourses from './MyCourses';
import FriendsCoursesSignedOutEmpty from './FriendsCoursesSignedOutEmpty';
import UserCoursesContent from './UserCoursesContent';
import Top100CoursesHubPanel from './Top100CoursesHubPanel';

import RateNudge from './RateNudge';
import StatBrowse from './StatBrowse';
import CourseDirectorySheet from './CourseDirectorySheet';


import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import GlassHeaderPlate from '@/components/chrome/GlassHeaderPlate';
import { scrollPageToTop } from '@/lib/getScrollParent';

import CoursesErrorBoundary from './CoursesErrorBoundary';
import { Search, X, Star, ChevronRight } from 'lucide-react';
/* RAISED field set: the browse panel paints SURFACE #1B1E27, a ground LIGHTER than the
   canvas, where 6% stops reading as a well. Explicit import by design — the
   canon never computes this from context. See lib/tokens/field.ts. */
import { FIELD_PAINT_RAISED_CLASS, FIELD_PLACEHOLDER_CLASS } from '@/lib/tokens/field';
import { FIGS } from '@/lib/tokens/type';
import CoursesShellTabs from '@/features/courses/components/CoursesShellTabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AMBER, HAIRLINE_INK_7, HAIRLINE_INK_10, HAIRLINE_INK_12, INK, INK_MUTE, INK_TINT_05, SLATE_50 } from '@/features/courses/_shared/tokens';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';

/* ─── Rate a Course bottom sheet ─── */
function RateCourseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [], isLoading, isFetching, isError } = useQuery({
    queryKey: ['rate-course-search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.trim().length < 2) return [];
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, global_rank')
        .ilike('name', `%${debouncedQuery.trim()}%`)
        .order('global_rank', { ascending: true, nullsFirst: false })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
    enabled: debouncedQuery.trim().length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1200,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1201,
          background: SLATE_50,
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          maxHeight: '85dvh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.12)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: HAIRLINE_INK_12 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px' }}>
          <div>
            <SectionHeader tier="standard" kicker="Rate a Course" tone="amber" className="mb-0.5" />
            <p style={{ fontSize: 12, color: INK_MUTE, margin: 0 }}>{t('rateSheet.subtitle')}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: INK_TINT_05, border: `0.5px solid ${HAIRLINE_INK_10}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} style={{ color: INK_MUTE }} />
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: '2px 16px 12px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 28, top: 11, color: 'hsl(var(--muted-foreground))' }} />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('rateSheet.searchPlaceholder', { defaultValue: 'Search courses…' })}
            /* FIELD CANON (lib/tokens/field.ts). HEIGHT EXCEPTION (~37px,
               padding-derived): rate-sheet header above the results list. */
            className={`${FIELD_PAINT_RAISED_CLASS} ${FIELD_PLACEHOLDER_CLASS}`}
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              fontSize: 14, outline: 'none',
              color: INK,
              boxSizing: 'border-box' as const,
            }}
          />
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
          {query.trim().length < 2 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', gap: 8, color: 'hsl(var(--muted-foreground))' }}>
              <Search size={28} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: 13, margin: 0 }}>{t('rateSheet.emptyLong')}</p>
            </div>
          ) : (isLoading || (isFetching && results.length === 0)) ? (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton className="h-[14px] w-[60%] rounded" />
                  <Skeleton className="h-[11px] w-[40%] rounded" />
                </div>
              ))}
            </>
          
          ) : isError ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              <p style={{ fontSize: 13, margin: 0 }}>{t('rateSheet.searchError', { defaultValue: "Search isn't working right now — try again in a moment." })}</p>
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              <p style={{ fontSize: 13, margin: 0 }}>{t('rateSheet.noResults', { query })}</p>
            </div>
          ) : (
            results.map((course, i) => (
              <button
                key={course.id}
                onClick={() => { onClose(); navigate(`/courses/${course.id}/rate`); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: i < results.length - 1 ? `0.5px solid ${HAIRLINE_INK_7}` : 'none',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
                className="active:bg-muted/50"
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>
                    {course.name}
                  </p>
                  <p style={{ ...FIGS, fontSize: 11, color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                    {[course.sub_country, course.country].filter(Boolean).join(', ')}
                    {course.global_rank ? ` · #${course.global_rank} World` : ''}
                  </p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: AMBER, flexShrink: 0 }}>
                  {t('rateSheet.rateAction')}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

interface CoursesContentProps {
  username?: string;
  displayName?: string;
}

const CoursesContent: React.FC<CoursesContentProps> = ({ username, displayName }) => {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [rateSheetOpen, setRateSheetOpen] = useState(false);
  // Full directory now lives in a bottom sheet, opened from three doors.
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [directoryCountry, setDirectoryCountry] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [tabsStuck, setTabsStuck] = useState(false);

  useEffect(() => {
    // Cold-load / restored-scroll guard: seed tabsStuck from scroll position
    // before the observer takes over, so a permanently-absent plate can't
    // happen if the sentinel ref hasn't mounted yet on back-navigation.
    setTabsStuck(window.scrollY > 200);
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setTabsStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  
  
  // Default to 'explore' (StatBrowse). Discover moved to the /explore nav tab.
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (username) {
      // User-profile variant only defines 'explore' and 'my-courses'.
      return tabParam === 'explore' ? 'explore' : 'my-courses';
    }
    if (tabParam && ['explore', 'top100'].includes(tabParam)) {
      return tabParam;
    }
    return 'explore';
  });


  // Check if we're on a user courses page
  const isUserCoursesPage = location.pathname.includes('/user/') && location.pathname.includes('/courses');
  const isOwnProfile = !username;

  // Check for tab parameter in URL - allow explore and top100 for main page.
  // ?tab=discover is a legacy deep link: the content moved to /explore, so the
  // link follows it rather than falling back to a courses tab.
  useEffect(() => {
    const tabParam = searchParams.get('tab');

    if (username) {
      // User-profile variant only defines 'explore' and 'my-courses'.
      setActiveTab(tabParam === 'explore' ? 'explore' : 'my-courses');
      return;
    }
    if (tabParam === 'discover') {
      navigate('/explore', { replace: true });
      return;
    }
    if (tabParam === 'explore' || tabParam === 'top100') {
      setActiveTab(tabParam);
    } else {
      setActiveTab('explore');
    }
  }, [searchParams, username, navigate]);

  // Scroll to top on mount — prevents page opening halfway down from previous visit
  useEffect(() => {
    scrollPageToTop('instant');
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Persist tab to URL so it survives remount on back navigation
    const params = new URLSearchParams(searchParams);
    if (value === 'explore') {
      params.delete('tab'); // 'explore' is the default, keep URL clean
    } else {
      params.set('tab', value);
    }
    setSearchParams(params, { replace: true });
  };


  // Reset to default sub-tab when bottom-nav icon is re-tapped on this route
  useEffect(() => {
    const onRetap = (e: Event) => {
      if ((e as CustomEvent).detail?.tabId !== 'courses') return;
      const params = new URLSearchParams(searchParams);
      params.delete('tab');
      setSearchParams(params, { replace: true });
      setActiveTab('explore');
      scrollPageToTop('smooth');
    };
    window.addEventListener('clbhouz-active-tab-retap', onRetap);
    return () => window.removeEventListener('clbhouz-active-tab-retap', onRetap);
  }, [searchParams, setSearchParams]);


  // Dynamic subtitle logic
  const getSubtitle = () => {
    // Only show custom subtitles when on "My Courses" tab (user profile pages only)
    if (activeTab === 'my-courses') {
      // If we're on a user courses page (like /user/username/courses)
      if (isUserCoursesPage) {
        if (isOwnProfile) {
          return "Here's how you rank the world's best golf courses.";
        } else {
          const firstName = displayName?.split(' ')[0] || displayName || 'this user';
          return `Explore how ${firstName} ranks the world's best golf courses.`;
        }
      }
      
      // If we're on the main courses page viewing "My Courses" tab (shouldn't happen now)
      return "Here's how you rank the world's best golf courses.";
    }
    
    // Default subtitle for explore tab
    return "Explore the World's Courses";
  };

  // Dynamic tab label for "My Courses" tab
  const getMyCoursesTabLabel = () => {
    if (isOwnProfile) {
      return "My Courses";
    } else {
      const firstName = displayName?.split(' ')[0] || displayName || 'User';
      // Handle proper apostrophe formatting (even for names ending in 's')
      return `${firstName}'s Courses`;
    }
  };

  return (
    <CoursesErrorBoundary>
      <div className="space-y-section">
        {/* Only show title/subtitle for user profile pages */}
        {username && (
          <div className="text-center pt-block mb-block">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">
              {`${username}'s Courses`}
            </h1>
            <p className="text-muted-foreground text-sm">
              {getSubtitle()}
            </p>
          </div>
        )}

      {/* User profile courses page - show all tabs including My Courses */}
      {username ? (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="explore"
              className="data-[state=active]:text-foreground"
            >
              {t('tabs.explore')}
            </TabsTrigger>
            <TabsTrigger 
              value="my-courses"
              className="data-[state=active]:text-foreground"
            >
              {getMyCoursesTabLabel()}
            </TabsTrigger>
          </TabsList>




          <TabsContent value="my-courses" className="mt-section">
            <UserCoursesContent username={username} />
          </TabsContent>
        </Tabs>
      ) : (
        /* Main courses page - shared cinematic hero + sticky tab row above content */
        (() => {
          const shellTabsNode = (
            <div
              style={{
                 background: 'var(--glass-bg)',
                 backdropFilter: 'blur(var(--glass-blur))',
                 WebkitBackdropFilter: 'blur(var(--glass-blur))',
              }}
            >
              <CoursesShellTabs
                activeTab={activeTab as 'explore' | 'top100'}
                onTabChange={handleTabChange}
              />
            </div>
          );
          return (
            <div>
              <GlassHeaderPlate visible={tabsStuck} />
              <CoursesPageHero />

              <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />

              {activeTab === 'top100' ? (

                <Top100CoursesHubPanel
                  shellTabs={shellTabsNode}
                  rateNudge={
                    user ? (
                      <RateNudge
                        userId={user.id}
                        onEmptyFallback={() => setRateSheetOpen(true)}
                      />
                    ) : null
                  }
                />
              ) : (
                <>
                  {shellTabsNode}
                  <div className="px-4 pt-0">
                    <StatBrowse
                      onOpenDirectory={(c) => {
                        setDirectoryCountry(c);
                        setDirectoryOpen(true);
                      }}
                    />
                    {/* Clears the floating bottom nav; 0px where it hides. */}
                    <div
                      aria-hidden="true"
                      style={{ height: 'calc(var(--bottom-nav-height, 96px) + 16px)' }}
                    />
                  </div>

                </>
              )}

            </div>
          );
        })()
      )}

        {/* Global scroll-to-top button */}
        <ScrollToTopGlass />
        {/* Rate sheet portal */}
        <RateCourseSheet open={rateSheetOpen} onClose={() => setRateSheetOpen(false)} />
        {/* Full course directory sheet */}
        <CourseDirectorySheet
          open={directoryOpen}
          onClose={() => setDirectoryOpen(false)}
          initialCountry={directoryCountry}
        />
      </div>
    </CoursesErrorBoundary>
  );
};

export default CoursesContent;