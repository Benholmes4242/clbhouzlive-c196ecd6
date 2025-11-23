import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourseExplorer from './CourseExplorer';
import GlobalTop100 from './GlobalTop100';
import MyCourses from './MyCourses';
import FriendsCoursesPanel from './FriendsCoursesPanel';
import FriendsCoursesSignedOutEmpty from './FriendsCoursesSignedOutEmpty';
import UserCoursesContent from './UserCoursesContent';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import CoursesErrorBoundary from './CoursesErrorBoundary';

interface CoursesContentProps {
  username?: string;
  displayName?: string;
}

const CoursesContent: React.FC<CoursesContentProps> = ({ username, displayName }) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Default to 'explore' since we're removing my-courses tab
  const [activeTab, setActiveTab] = useState(() => {
    if (username) return 'my-courses'; // Keep for user profile pages
    return 'explore'; // Default to explore for main courses page
  });

  // Check if we're on a user courses page
  const isUserCoursesPage = location.pathname.includes('/user/') && location.pathname.includes('/courses');
  const isOwnProfile = !username;

  // Check for tab parameter in URL - allow explore, top100, and friends-courses for main page
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && (tabParam === 'explore' || tabParam === 'top100' || tabParam === 'friends-courses')) {
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
    if (!user && value === 'friends-courses') {
      navigate('/auth');
      return;
    }
    setActiveTab(value);
  };

  // Generate reset key based on activeTab only
  // This will trigger filter resets when switching tabs, but not on every navigation
  const resetKey = activeTab;

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
      <div className="space-y-6">
        <div className="text-center space-y-1 -mt-[42px] mb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {username ? `${username}'s Courses` : 'Golf Courses'}
          </h1>
          <p className="text-muted-foreground text-base">
            {getSubtitle()}
          </p>
        </div>

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

          <TabsContent value="explore" className="mt-6">
            <CourseExplorer key={resetKey} />
          </TabsContent>


          <TabsContent value="my-courses" className="mt-6">
            <UserCoursesContent username={username} />
          </TabsContent>
        </Tabs>
      ) : (
        /* Main courses page - show Explore, Global Top 100, and Friends' Courses */
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/70 border border-border/60 px-2 py-[3px] mb-5">
            <TabsTrigger 
              value="explore"
              className="text-sm px-3 py-[6px] rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all duration-motion-fast ease-standard"
            >
              Explore
            </TabsTrigger>
            <TabsTrigger 
              value="top100"
              className="text-sm px-3 py-[6px] rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all duration-motion-fast ease-standard"
            >
              Top 100
            </TabsTrigger>
            <TabsTrigger 
              value="friends-courses"
              className="text-sm px-3 py-[6px] rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all duration-motion-fast ease-standard"
            >
              Friends' Courses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="mt-6">
            <CourseExplorer key={resetKey} />
          </TabsContent>

          <TabsContent value="top100" className="mt-6">
            <GlobalTop100 key={resetKey} />
          </TabsContent>

          <TabsContent value="friends-courses" className="mt-6">
            {user ? (
              <FriendsCoursesPanel />
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