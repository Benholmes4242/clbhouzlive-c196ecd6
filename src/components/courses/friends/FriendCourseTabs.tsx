
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar } from 'lucide-react';
import CourseCard from '../CourseCard';

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
  continent?: string;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
  description?: string;
  thumbnail_image?: string;
  latitude?: number | null;
  longitude?: number | null;
  website_url?: string | null;
}

interface UserCourse {
  id: string;
  played_date?: string;
  golf_courses: Course;
}

interface FriendCourseTabsProps {
  friendName: string;
  selectedFriendId: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  friendTop100Courses: UserCourse[];
  recentCourses: UserCourse[];
  isLoadingTop100: boolean;
}

const FriendCourseTabs: React.FC<FriendCourseTabsProps> = ({
  friendName,
  selectedFriendId,
  activeTab,
  onTabChange,
  friendTop100Courses,
  recentCourses,
  isLoadingTop100
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="top100">Top 100</TabsTrigger>
        <TabsTrigger value="recent">Recent</TabsTrigger>
      </TabsList>

      <TabsContent value="top100" className="mt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {friendName}'s Top 100 Courses
          </h3>
          {isLoadingTop100 ? (
            <div className="text-center py-8">Loading Top 100 courses...</div>
          ) : friendTop100Courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 sm:gap-6">
              {friendTop100Courses.map((userCourse) => (
                <CourseCard 
                  key={userCourse.id} 
                  course={userCourse.golf_courses}
                  viewingUserId={selectedFriendId}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                <h3 className="text-lg font-semibold mb-2">No Top 100 courses rated yet</h3>
                <p className="text-muted-foreground">
                  {friendName} hasn't rated any Top 100 courses yet
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="recent" className="mt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {friendName}'s Recent Activity (Last 30 Days)
          </h3>
          {recentCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 sm:gap-6">
              {recentCourses.map((userCourse) => (
                <CourseCard 
                  key={`${userCourse.id}-recent`} 
                  course={userCourse.golf_courses}
                  viewingUserId={selectedFriendId}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                <p className="text-muted-foreground">
                  {friendName} hasn't played any courses in the last 30 days
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default FriendCourseTabs;
