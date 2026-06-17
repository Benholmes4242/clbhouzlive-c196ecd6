import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShellSlot from '@/components/header/ShellSlot';
import CourseExplorer from './CourseExplorer';
import MyCourses from './MyCourses';
import FriendsCoursesSignedOutEmpty from './FriendsCoursesSignedOutEmpty';
import UserCoursesContent from './UserCoursesContent';
import Top100CoursesHubPanel from './Top100CoursesHubPanel';
import Top100LeaderboardPanel from './Top100LeaderboardPanel';
import ExploreTabContent from '@/components/explore-tab-new/ExploreTabContent';
import RateNudge from './RateNudge';


import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import CoursesErrorBoundary from './CoursesErrorBoundary';
import { Search, X, Star, ChevronRight } from 'lucide-react';
import CoursesShellTabs from '@/features/courses/components/CoursesShellTabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { SectionEyebrow } from '@/components/ui/SectionEyebrow';
import { AMBER, HAIRLINE_INK_7, HAIRLINE_INK_10, HAIRLINE_INK_12, INK, INK_MUTE, INK_TINT_05, SLATE_50, SURFACE } from '@/features/courses/_shared/tokens';

/* ─── Rate a Course bottom sheet ─── */
function RateCourseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['rate-course-search', query],
    queryFn: async () => {
      if (query.trim().length < 2) return [];
      const { data } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, global_rank')
        .ilike('name', `%${query.trim()}%`)
        .order('global_rank', { ascending: true, nullsFirst: false })
        .limit(12);
      return data ?? [];
    },
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });

  if (!open) return null;

  return (
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
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.12)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: HAIRLINE_INK_12 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px 10px', borderBottom: `0.5px solid ${HAIRLINE_INK_7}` }}>
          <div>
            <SectionEyebrow label="Rate a Course" color="amber" className="mb-0.5" />
            <p style={{ fontSize: 12, color: INK_MUTE, margin: 0 }}>Search any course you've played</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: INK_TINT_05, border: `0.5px solid ${HAIRLINE_INK_10}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} style={{ color: INK_MUTE }} />
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: '0 16px 10px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 28, top: 11, color: 'hsl(var(--muted-foreground))' }} />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses…"
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              borderRadius: 10, border: `1px solid ${HAIRLINE_INK_10}`,
              background: SURFACE,
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
              <p style={{ fontSize: 13, margin: 0 }}>Type a course name to get started</p>
            </div>
          ) : isLoading ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              <p style={{ fontSize: 13, margin: 0 }}>Searching…</p>
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              <p style={{ fontSize: 13, margin: 0 }}>No courses found for "{query}"</p>
            </div>
          ) : (
            results.map((course, i) => (
              <button
                key={course.id}
                onClick={() => { onClose(); navigate(`/courses/${course.id}/rate`); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 16px',
                  borderBottom: i < results.length - 1 ? `0.5px solid ${HAIRLINE_INK_7}` : 'none',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
                className="active:bg-muted/50"
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0 }}>
                    {course.name}
                  </p>
                  <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                    {[course.sub_country, course.country].filter(Boolean).join(', ')}
                    {course.global_rank ? ` · #${course.global_rank} World` : ''}
                  </p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: AMBER, flexShrink: 0 }}>
                  Rate →
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

interface CoursesContentProps {
  username?: string;
  displayName?: string;
}

const CoursesContent: React.FC<CoursesContentProps> = ({ username, displayName }) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [rateSheetOpen, setRateSheetOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  
  // Default to 'explore' since we're removing my-courses tab
  const [activeTab, setActiveTab] = useState(() => {
    if (username) return 'my-courses'; // Keep for user profile pages
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam && ['explore', 'top100', 'discover'].includes(tabParam)) {
      return tabParam;
    }
    return 'explore'; // Default to explore for main courses page
  });

  // Check if we're on a user courses page
  const isUserCoursesPage = location.pathname.includes('/user/') && location.pathname.includes('/courses');
  const isOwnProfile = !username;

  // Check for tab parameter in URL - allow explore, top100, and leaderboards for main page
  // Also check for 'view' param which indicates we're on leaderboards sub-tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');

    if (tabParam && (tabParam === 'explore' || tabParam === 'top100' || tabParam === 'discover')) {
      setActiveTab(tabParam);
    } else if (username) {
      // Default to my-courses for user profile pages
      setActiveTab('my-courses');
    } else {
      // Default to explore for main courses page
      setActiveTab('explore');
    }
  }, [searchParams, username]);

  // Scroll to top on mount — prevents page opening halfway down from previous visit
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.getElementById('root')?.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
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
    setSearchParams(params, { replace: true }); // replace to avoid polluting history
  };

  // Reset to default sub-tab when bottom-nav icon is re-tapped on this route
  useEffect(() => {
    const onRetap = (e: Event) => {
      if ((e as CustomEvent).detail?.tabId !== 'courses') return;
      const params = new URLSearchParams(searchParams);
      params.delete('tab');
      setSearchParams(params, { replace: true });
      setActiveTab('explore');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
              Explore
            </TabsTrigger>
            <TabsTrigger 
              value="my-courses"
              className="data-[state=active]:text-foreground"
            >
              {getMyCoursesTabLabel()}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="mt-section">
            <CourseExplorer />
          </TabsContent>


          <TabsContent value="my-courses" className="mt-section">
            <UserCoursesContent username={username} />
          </TabsContent>
        </Tabs>
      ) : (
        /* Main courses page - show Explore, Global Top 100, and Friends' Courses */
        <>
          <ShellSlot>
            <CoursesShellTabs
              activeTab={activeTab as 'explore' | 'top100' | 'discover'}
              onTabChange={handleTabChange}
            />
          </ShellSlot>

          {activeTab === 'discover' ? (
            /* Compact rank-led hero — needs chrome offset so it clears the sticky tab row */
            <div style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}>
              <ExploreTabContent embedded />
            </div>
          ) : (
            <div className="px-4" style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}>
              {/* Rate a Course nudge — data-driven (played-but-unrated) */}
              {user && (
                <RateNudge
                  userId={user.id}
                  onEmptyFallback={() => setRateSheetOpen(true)}
                />
              )}

              {activeTab === 'explore' && <CourseExplorer />}
              {activeTab === 'top100' && <Top100CoursesHubPanel />}
            </div>
          )}

        </>
      )}

        {/* Global scroll-to-top button */}
        <ScrollToTopGlass />
        {/* Rate sheet portal */}
        <RateCourseSheet open={rateSheetOpen} onClose={() => setRateSheetOpen(false)} />
      </div>
    </CoursesErrorBoundary>
  );
};

export default CoursesContent;