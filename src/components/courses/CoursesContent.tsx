import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourseExplorer from './CourseExplorer';
import MyCourses from './MyCourses';
import FriendsCoursesSignedOutEmpty from './FriendsCoursesSignedOutEmpty';
import UserCoursesContent from './UserCoursesContent';
import Top100CoursesHubPanel from './Top100CoursesHubPanel';
import Top100LeaderboardPanel from './Top100LeaderboardPanel';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import CoursesErrorBoundary from './CoursesErrorBoundary';
import { Trophy, Search, X, Star, ChevronRight } from 'lucide-react';
import SegmentedControl from '@/components/discover/SegmentedControl';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
          background: 'hsl(var(--background))',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.12)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'hsl(var(--muted-foreground) / 0.25)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 10px' }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'hsl(var(--foreground))', margin: 0 }}>Rate a Course</h3>
            <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: 0 }}>Search any course you've played</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'hsl(var(--muted) / 0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
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
              borderRadius: 10, border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--muted) / 0.4)',
              fontSize: 14, outline: 'none',
              color: 'hsl(var(--foreground))',
              boxSizing: 'border-box',
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
                  borderBottom: i < results.length - 1 ? '0.5px solid hsl(var(--border) / 0.5)' : 'none',
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
                <span style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', flexShrink: 0 }}>
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
    if (tabParam && ['explore', 'top100', 'leaderboards'].includes(tabParam)) {
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
    const viewParam = searchParams.get('view');
    
    // If view param exists, we're on a leaderboard sub-tab - stay on leaderboards
    if (viewParam && ['championship', 'courses', 'exploration', 'handicap', 'players'].includes(viewParam)) {
      setActiveTab('leaderboards');
    } else if (tabParam && (tabParam === 'explore' || tabParam === 'top100' || tabParam === 'leaderboards')) {
      setActiveTab(tabParam);
    } else if (username) {
      // Default to my-courses for user profile pages
      setActiveTab('my-courses');
    } else {
      // Default to explore for main courses page
      setActiveTab('explore');
    }
  }, [searchParams, username]);

  const handleTabChange = (value: string) => {
    if (!user && value === 'leaderboards') {
      navigate('/auth');
      return;
    }
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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <SegmentedControl
            tabs={[
              { id: 'explore', label: 'Explore' },
              { id: 'top100', label: 'Top 100', icon: <Trophy className="h-4 w-4" /> },
              { id: 'leaderboards', label: 'Leaderboards' },
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Rate a Course CTA — below tab bar, always visible on main courses page */}
          {user && (
            <button
              onClick={() => setRateSheetOpen(true)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 16px', marginTop: 8, marginBottom: 4,
                background: 'linear-gradient(135deg, #F59E0B, #F97316)',
                border: 'none', cursor: 'pointer', borderRadius: 12,
              }}
              className="active:opacity-90 transition-opacity"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={15} fill="white" color="white" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>Rate a Course</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Search any course you've played</p>
                </div>
              </div>
              <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
            </button>
          )}

          <TabsContent value="explore" className="mt-2">
            <CourseExplorer />
          </TabsContent>

          <TabsContent value="top100" className="mt-2">
            <Top100CoursesHubPanel />
          </TabsContent>

          <TabsContent value="leaderboards" className="mt-2">
            {user ? (
              <Top100LeaderboardPanel />
            ) : (
              <FriendsCoursesSignedOutEmpty />
            )}
          </TabsContent>
        </Tabs>
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