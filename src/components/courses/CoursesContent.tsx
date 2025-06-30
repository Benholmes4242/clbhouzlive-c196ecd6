
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
  
  // Default to 'my-courses' if username is provided (viewing another user's courses)
  const [activeTab, setActiveTab] = useState(() => {
    if (username) return 'my-courses';
    return 'explore';
  });

  // Check if we're on a user courses page
  const isUserCoursesPage = location.pathname.includes('/user/') && location.pathname.includes('/courses');
  const isOwnProfile = !username;

  // Check for tab parameter in URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && (tabParam === 'explore' || tabParam === 'friends-courses' || tabParam === 'my-courses')) {
      setActiveTab(tabParam);
    } else if (username) {
      // Default to my-courses for user profile pages
      setActiveTab('my-courses');
    }
  }, [searchParams, username]);

  const handleTabChange = (value: string) => {
    if (!user && (value === 'my-courses' || value === 'friends-courses')) {
      navigate('/auth');
      return;
    }
    setActiveTab(value);
  };

  // Dynamic subtitle logic
  const getSubtitle = () => {
    // Only show custom subtitles when on "My Courses" tab
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
      
      // If we're on the main courses page viewing "My Courses" tab
      return "Here's how you rank the world's best golf courses.";
    }
    
    // Default subtitle for explore and friends-courses tabs
    return "Top 100 Courses. One Epic Checklist.";
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
        <TabsList className={`grid w-full ${user ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger 
            value="explore"
            className="hover:text-[#b66b41] data-[state=active]:text-[#b66b41]"
          >
            Explore
          </TabsTrigger>
          {user && (
            <TabsTrigger 
              value="friends-courses"
              className="hover:text-[#b66b41] data-[state=active]:text-[#b66b41]"
            >
              Friend's Fairways
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="my-courses"
            className="hover:text-[#b66b41] data-[state=active]:text-[#b66b41]"
          >
            My Courses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="mt-6">
          <CourseExplorer />
        </TabsContent>

        {user && (
          <TabsContent value="friends-courses" className="mt-6">
            <FriendsCourses />
          </TabsContent>
        )}

        <TabsContent value="my-courses" className="mt-6">
          {username ? (
            // Viewing another user's courses
            <UserCoursesContent username={username} />
          ) : user ? (
            // Viewing own courses
            <MyCourses />
          ) : (
            // Not logged in
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Sign in to track your courses</h3>
                <p className="text-muted-foreground mb-4">
                  Create an account to track which courses you've played and manage your golf journey
                </p>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="text-white hover:opacity-90"
                  style={{ backgroundColor: '#322F30' }}
                >
                  Sign In
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoursesContent;
