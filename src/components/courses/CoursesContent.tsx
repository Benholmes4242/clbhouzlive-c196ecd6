
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourseExplorer from './CourseExplorer';
import MyCourses from './MyCourses';
import FriendsCourses from './FriendsCourses';
import UserCoursesContent from './UserCoursesContent';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';

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

  // Check for tab parameter in URL - only allow explore and friends-courses for main page
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && (tabParam === 'explore' || tabParam === 'friends-courses')) {
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
    
    // Default subtitle for explore and friends-courses tabs
    return "Global Top 100 Courses. One Epic Checklist.";
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
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Golf Courses</h1>
        <p className="text-muted-foreground">
          {getSubtitle()}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Only show My Courses tab on user profile pages, not on main courses page */}
        {username ? (
          // User profile courses page - show all tabs including My Courses
          <TabsList className={`grid w-full ${user ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger 
              value="explore"
              className="data-[state=active]:text-foreground"
            >
              Explore
            </TabsTrigger>
            {user && (
              <TabsTrigger 
                value="friends-courses"
                className="data-[state=active]:text-foreground"
              >
                Top 100 Explorer
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="my-courses"
              className="data-[state=active]:text-foreground"
            >
              {getMyCoursesTabLabel()}
            </TabsTrigger>
          </TabsList>
        ) : (
          // Main courses page - only show Explore and Top 100 Explorer tabs
          <TabsList className={`grid w-full ${user ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger 
              value="explore"
              className="data-[state=active]:text-foreground"
            >
              Explore
            </TabsTrigger>
            {user && (
              <TabsTrigger 
                value="friends-courses"
                className="data-[state=active]:text-foreground"
              >
                Top 100 Explorer
              </TabsTrigger>
            )}
          </TabsList>
        )}

        <TabsContent value="explore" className="mt-6">
          <CourseExplorer />
        </TabsContent>

        {user && (
          <TabsContent value="friends-courses" className="mt-6">
            <FriendsCourses />
          </TabsContent>
        )}

        {/* Only render My Courses content on user profile pages */}
        {username && (
          <TabsContent value="my-courses" className="mt-6">
            <UserCoursesContent username={username} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default CoursesContent;
