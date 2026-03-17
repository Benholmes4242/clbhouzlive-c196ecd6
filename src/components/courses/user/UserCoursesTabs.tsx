
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourseCard from '../CourseCard';
import { EmptyTop100State, EmptyRecentState } from './UserCoursesEmptyStates';

interface UserCoursesTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  top100Courses: any[];
  recentCourses: any[];
  isLoadingTop100: boolean;
  targetUserId: string | undefined;
  isOwnProfile: boolean;
  displayName: string;
}

const UserCoursesTabs: React.FC<UserCoursesTabsProps> = ({
  activeTab,
  setActiveTab,
  top100Courses,
  recentCourses,
  isLoadingTop100,
  targetUserId,
  isOwnProfile,
  displayName
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 h-auto">
        <TabsTrigger 
          value="top100"
          className="flex flex-col items-center gap-1 py-3 relative data-[state=active]:bg-transparent hover:bg-muted/50 data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          <span className="text-sm font-medium">Top 100</span>
          {activeTab === 'top100' && (
            <div 
             className="w-1.5 h-1.5 rounded-full bg-foreground mt-1 animate-fade-in"
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

      <TabsContent value="top100" className="mt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Top 100 Courses Played</h3>
          {isLoadingTop100 ? (
            <div className="text-center py-8">Loading Top 100 courses...</div>
          ) : top100Courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {top100Courses.map((userCourse) => (
                <CourseCard 
                  key={userCourse.id} 
                  course={userCourse.golf_courses}
                  viewingUserId={targetUserId}
                  viewContext="global"
                  userRating={userCourse.rating}
                  isReadOnly={!isOwnProfile}
                  showUserRating={true}
                  isFromUserCoursesPage={true}
                />
              ))}
            </div>
          ) : (
            <EmptyTop100State isOwnProfile={isOwnProfile} displayName={displayName} />
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
                  key={`${userCourse.id}-recent`} 
                  course={userCourse.golf_courses}
                  viewingUserId={targetUserId}
                  viewContext="global"
                  userRating={userCourse.rating}
                  isReadOnly={!isOwnProfile}
                  showUserRating={true}
                  isFromUserCoursesPage={true}
                />
              ))}
            </div>
          ) : (
            <EmptyRecentState isOwnProfile={isOwnProfile} displayName={displayName} />
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default UserCoursesTabs;
