import React from 'react';
import { useNavigate } from 'react-router-dom';
import CourseRankBadges from '@/components/courses/CourseRankBadges';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { Users } from 'lucide-react';

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
    // Determine region based on country
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
  const hasImage = !!course.thumbnail_url;
  const rating = course.avg_rating ?? null;
  const contextualTag = getContextualTag(course);

  // Determine the third line context
  const getThirdLineText = () => {
    if (showFriendsContext) {
      if (course.friends_count && course.friends_count > 0) {
        return `Rated by ${course.friends_count} friend${course.friends_count === 1 ? '' : 's'}`;
      }
      return 'No friends have rated this course yet';
    }
    if (course.times_played > 0) {
      return `Rated by ${course.times_played} member${course.times_played === 1 ? '' : 's'}`;
    }
    return null;
  };

  const thirdLine = getThirdLineText();

  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${course.course_id}`)}
      className="w-full rounded-none sm:rounded-sq-md overflow-hidden bg-card border-y sm:border border-border/50 text-left transition-colors hover:bg-muted/20 active:scale-[0.995]"
    >
      {/* Image with overlay */}
      {hasImage && (
        <div className="relative w-full aspect-[1.6/1] overflow-hidden">
          <img
            src={course.thumbnail_url!}
            alt={course.course_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          
          {/* Gradient overlay */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          
          {/* Rank badges top-left */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <CourseRankBadges
              globalRank={course.global_rank}
              regionalRank={course.regional_rank}
              usaRank={course.usa_rank}
              country={course.country || ''}
              positioning="inline"
            />
          </div>

          {/* Contextual tag top-right */}
          {contextualTag && (
            <div className="absolute top-2.5 right-2.5 z-10">
              <span className="text-[10px] font-medium bg-black/60 text-white px-2 py-1 rounded-sq-xs backdrop-blur-sm">
                {contextualTag}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Meta block */}
      <div className="px-3.5 py-3 bg-background">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-0.5">
            {/* Course name */}
            <h3 className="text-sm font-semibold text-foreground truncate">
              {course.course_name}
            </h3>
            
            {/* Location */}
            <p className="text-xs text-muted-foreground truncate">
              {course.sub_country && `${course.sub_country}, `}
              {course.country}
            </p>

            {/* Third line - contextual */}
            {thirdLine && (
              <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1 pt-0.5">
                <Users className="h-3 w-3" />
                {thirdLine}
              </p>
            )}
          </div>

          {/* Right: Rating aligned with course name */}
          {rating !== null && (
            <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
              <ClubhouseLogo className="h-4 w-4" />
              <span className="text-sm font-semibold text-foreground">
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
