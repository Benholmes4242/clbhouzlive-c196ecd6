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
import { Trophy } from 'lucide-react';

interface CoursesContentProps {
  username?: string;
  displayName?: string;
}

const CoursesContent: React.FC<CoursesContentProps> = ({ username, displayName }) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
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
          {/* Tabs wrapper - matches Discover SegmentedControl exactly */}
          <section className="py-3 -mx-4 px-4 bg-background">
            <div className="flex p-1 rounded-xl overflow-hidden bg-muted">
              <button
                role="tab"
                aria-selected={activeTab === 'explore'}
                onClick={() => handleTabChange('explore')}
                className={`flex-1 py-2.5 px-5 text-sm font-medium rounded-lg transition-all duration-150 active:scale-[0.97] ${
                  activeTab === 'explore'
                    ? 'm-1 bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                Explore
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'top100'}
                onClick={() => handleTabChange('top100')}
                className={`flex-1 py-2.5 px-5 text-sm font-medium rounded-lg transition-all duration-150 active:scale-[0.97] flex items-center justify-center ${
                  activeTab === 'top100'
                    ? 'm-1 bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                <Trophy className="h-4 w-4 mr-1.5" />
                Top 100
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'leaderboards'}
                onClick={() => handleTabChange('leaderboards')}
                className={`flex-1 py-2.5 px-5 text-sm font-medium rounded-lg transition-all duration-150 active:scale-[0.97] ${
                  activeTab === 'leaderboards'
                    ? 'm-1 bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                Leaderboards
              </button>
            </div>
          </section>

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
      </div>
    </CoursesErrorBoundary>
  );
};

export default CoursesContent;