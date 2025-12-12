import React from 'react';
import { CourseListCard } from '@/components/courses/CourseListCard';

interface CourseData {
  id: string;
  name: string;
  rank: number;
  imageUrl: string | null;
  country: string;
  subCountry?: string | null;
  flagEmoji?: string;
  regionShort?: string;
  played: boolean;
  rankingBadges?: Array<{ id: string; label: string }>;
  communityRating?: number | null;
  globalRank?: number | null;
  regionalRank?: number | null;
  usaRank?: number | null;
}

interface Top100ListCourseCardProps {
  course: CourseData;
  listSlug?: string;
  onClick: () => void;
}

export const Top100ListCourseCard: React.FC<Top100ListCourseCardProps> = ({
  course,
  listSlug,
  onClick,
}) => {
  // Transform the course data to match CourseListCard's expected shape
  const transformedCourse = {
    id: course.id,
    name: course.name,
    country: course.country,
    sub_country: course.subCountry,
    thumbnail_image: course.imageUrl,
    global_rank: course.globalRank,
    regional_rank: course.regionalRank,
    usa_rank: course.usaRank,
    average_rating: course.communityRating,
  };

  return (
    <CourseListCard
      course={transformedCourse}
      listSlug={listSlug as 'global' | 'gb-i' | 'usa' | 'europe'}
      onClick={onClick}
      isPlayed={course.played}
    />
  );
};
