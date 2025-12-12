import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UnifiedCourseCard } from '@/components/courses/UnifiedCourseCard';
import { fromLeaderboardCourse } from '@/lib/mappers/toCourseCardModel';

interface LeaderboardCourseCardProps {
  course: {
    course_id: string;
    course_name: string;
    country: string;
    sub_country?: string | null;
    thumbnail_url?: string | null;
    global_rank?: number | null;
    regional_rank?: number | null;
    usa_rank?: number | null;
    avg_rating?: number | null;
    times_played: number;
    friends_count?: number;
  };
  listPosition: number;
  showFriendsContext?: boolean;
}

// Get contextual tag based on ranks
function getContextualTag(course: LeaderboardCourseCardProps['course']): string | null {
  if (course.global_rank && course.global_rank <= 10) {
    return 'Top 10 Global';
  }
  if (course.usa_rank && course.usa_rank <= 10) {
    return 'Top 10 USA';
  }
  if (course.regional_rank && course.regional_rank <= 10) {
    const europeanCountries = ['England', 'Scotland', 'Wales', 'Ireland', 'Northern Ireland', 'France', 'Spain', 'Germany', 'Italy', 'Portugal', 'Netherlands', 'Belgium', 'Sweden', 'Denmark', 'Norway', 'Finland'];
    const gbCountries = ['England', 'Scotland', 'Wales', 'Ireland', 'Northern Ireland'];
    
    if (gbCountries.includes(course.country)) {
      return 'Top 10 GB&I';
    }
    if (europeanCountries.includes(course.country)) {
      return 'Top 10 Europe';
    }
    return 'Top 10 Regional';
  }
  return null;
}

export function LeaderboardCourseCard({ course, listPosition, showFriendsContext = false }: LeaderboardCourseCardProps) {
  const navigate = useNavigate();
  const contextualTag = getContextualTag(course);
  
  // Map to CourseCardModel
  const cardModel = fromLeaderboardCourse(course);
  
  // Override rating count with friends-specific text if needed
  if (showFriendsContext) {
    cardModel.ratingCount = course.friends_count || 0;
  }

  return (
    <UnifiedCourseCard
      course={cardModel}
      showRankBadges={true}
      showRating={true}
      showFriendsContext={showFriendsContext}
      contextTag={contextualTag || undefined}
      onClick={() => navigate(`/courses/${course.course_id}`)}
    />
  );
}
