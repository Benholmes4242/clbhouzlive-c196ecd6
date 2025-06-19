
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import CourseImage from './CourseImage';
import CourseRankBadges from './CourseRankBadges';
import CoursePlayedButton from './CoursePlayedButton';
import CourseInfo from './CourseInfo';

interface Course {
  id: string;
  name: string;
  country: string;
  region: string;
  continent: string;
  global_rank: number | null;
  regional_rank: number | null;
  usa_rank: number | null;
  description: string;
  thumbnail_image: string;
  latitude: number | null;
  longitude: number | null;
}

interface CourseCardProps {
  course: Course;
  viewingUserId?: string;
  viewContext?: 'global' | 'regional';
}

const CourseCard = ({ course, viewingUserId, viewContext = 'global' }: CourseCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const { data: currentUserResponse } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      return await supabase.auth.getUser();
    },
  });

  const currentUser = currentUserResponse?.data?.user;

  const { data: userCourse } = useQuery({
    queryKey: ['user-course', course.id, viewingUserId || currentUser?.id],
    queryFn: async () => {
      const targetUserId = viewingUserId || currentUser?.id;
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('user_courses')
        .select('*')
        .eq('course_id', course.id)
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!(viewingUserId || currentUser?.id),
  });

  const canModifyCourseStatus = currentUser?.id && (!viewingUserId || viewingUserId === currentUser.id);

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <CourseImage 
          thumbnailImage={course.thumbnail_image}
          name={course.name}
          isHovered={isHovered}
        />
        
        <CourseRankBadges 
          globalRank={course.global_rank}
          regionalRank={course.regional_rank}
          usaRank={course.usa_rank}
          country={course.country}
          viewContext={viewContext}
        />

        <CoursePlayedButton
          courseId={course.id}
          courseName={course.name}
          userCourse={userCourse}
          canModifyCourseStatus={canModifyCourseStatus}
          currentUserId={currentUser?.id}
          viewingUserId={viewingUserId}
        />
      </div>

      <CardContent className="p-4">
        <CourseInfo
          name={course.name}
          region={course.region}
          country={course.country}
          description={course.description}
          userCourse={userCourse}
        />
      </CardContent>
    </Card>
  );
};

export default CourseCard;
