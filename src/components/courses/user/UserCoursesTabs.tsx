
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
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="top100">Top 100</TabsTrigger>
        <TabsTrigger value="recent">Recent</TabsTrigger>
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
                  showPlayedButton={isOwnProfile}
                  viewContext="global"
                  userRating={userCourse.rating}
                  isReadOnly={!isOwnProfile}
                  showUserRating={true}
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
                  showPlayedButton={isOwnProfile}
                  viewContext="global"
                  userRating={userCourse.rating}
                  isReadOnly={!isOwnProfile}
                  showUserRating={true}
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
