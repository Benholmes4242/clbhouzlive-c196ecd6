
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Trophy, Calendar } from 'lucide-react';
import CourseCard from './CourseCard';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface Course {
  id: string;
  golf_courses: any;
  source: string;
  rating?: number | null;
}

interface MyCoursesTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  allPlayedCourses: Course[];
  top100Courses: Course[];
  recentCourses: Course[];
  userId: string | undefined;
  isLoading: boolean;
  isLoadingTop100: boolean;
  profileOwnerFirstName?: string;
}

const MyCoursesTabs = ({
  activeTab,
  setActiveTab,
  allPlayedCourses,
  top100Courses,
  recentCourses,
  userId,
  isLoading,
  isLoadingTop100,
  profileOwnerFirstName
}: MyCoursesTabsProps) => {
  const { user: currentUser } = useSupabaseSession();
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 h-auto">
        <TabsTrigger 
          value="all"
          className="flex flex-col items-center gap-1 py-3 relative data-[state=active]:bg-transparent hover:bg-muted/50 data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          <span className="text-sm font-medium">All Courses</span>
          {activeTab === 'all' && (
            <div 
              className="w-1.5 h-1.5 rounded-full bg-[#b66b41] mt-1 animate-fade-in"
              style={{ marginTop: '4px' }}
            />
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="top100"
          className="flex flex-col items-center gap-1 py-3 relative data-[state=active]:bg-transparent hover:bg-muted/50 data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          <span className="text-sm font-medium">Top 100</span>
          {activeTab === 'top100' && (
            <div 
              className="w-1.5 h-1.5 rounded-full bg-[#b66b41] mt-1 animate-fade-in"
              style={{ marginTop: '4px' }}
            />
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="recent"
          className="flex flex-col items-center gap-1 py-3 relative data-[state=active]:bg-transparent hover:bg-muted/50 data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          <span className="text-sm font-medium">Recent</span>
          {activeTab === 'recent' && (
            <div 
              className="w-1.5 h-1.5 rounded-full bg-[#b66b41] mt-1 animate-fade-in"
              style={{ marginTop: '4px' }}
            />
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">All Courses Played</h3>
          {isLoading ? (
            <div className="text-center py-8">Loading your courses...</div>
          ) : allPlayedCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allPlayedCourses.map((userCourse) => (
                 <CourseCard 
                   key={`${userCourse.id}-${userCourse.source}`} 
                   course={userCourse.golf_courses}
                   viewingUserId={userId}
                   userRating={userCourse.rating || null}
                   showUserRating={true}
                   currentUserId={currentUser?.id}
                   profileOwnerFirstName={profileOwnerFirstName}
                 />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">No courses played yet</h3>
                <p className="text-muted-foreground">
                  Start exploring golf courses and mark them as played to see them here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="top100" className="mt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Top 100 Courses Played</h3>
          {isLoadingTop100 ? (
            <div className="text-center py-8">Loading your Top 100 courses...</div>
          ) : top100Courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {top100Courses.map((userCourse) => (
                 <CourseCard 
                   key={userCourse.id} 
                   course={userCourse.golf_courses}
                   viewingUserId={userId}
                   userRating={userCourse.rating || null}
                   showUserRating={true}
                   currentUserId={currentUser?.id}
                   profileOwnerFirstName={profileOwnerFirstName}
                 />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                <h3 className="text-lg font-semibold mb-2">No Top 100 courses played yet</h3>
                <p className="text-muted-foreground">
                  Explore the world's greatest golf courses and add them to your played list
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="recent" className="mt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recently Played (Last 30 Days)</h3>
          {recentCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {recentCourses.map((userCourse) => (
                  <CourseCard 
                    key={`${userCourse.id}-recent-${userCourse.source}`} 
                    course={userCourse.golf_courses}
                    viewingUserId={userId}
                    userRating={userCourse.rating || null}
                    showUserRating={true}
                    hideRankingBadges={true}
                    currentUserId={currentUser?.id}
                    profileOwnerFirstName={profileOwnerFirstName}
                  />
               ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                <p className="text-muted-foreground">
                  Play some courses in the last 30 days and they'll appear here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default MyCoursesTabs;
