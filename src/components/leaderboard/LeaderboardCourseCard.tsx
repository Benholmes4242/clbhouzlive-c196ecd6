import React from 'react';
import { useNavigate } from 'react-router-dom';
import CourseRankBadges from '@/components/courses/CourseRankBadges';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export function LeaderboardCourseCard({ course, listPosition }: LeaderboardCourseCardProps) {
  const navigate = useNavigate();
  const hasImage = !!course.thumbnail_url;
  const rating = course.avg_rating ?? null;

  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${course.course_id}`)}
      className="w-full rounded-none sm:rounded-sq-md overflow-hidden bg-card border-y sm:border border-border/50 text-left transition-colors hover:bg-muted/20"
    >
      {/* Image with overlay - shorter aspect ratio for leaderboard */}
      {hasImage && (
        <div className="relative w-full aspect-[2/1] overflow-hidden">
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
          <CourseRankBadges
            globalRank={course.global_rank}
            regionalRank={course.regional_rank}
            usaRank={course.usa_rank}
            country={course.country || ''}
            positioning="top-left"
          />
        </div>
      )}

      {/* Meta block */}
      <div className="px-3.5 py-2.5 bg-background space-y-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {course.course_name}
            </h3>
            
            <p className="text-xs text-muted-foreground">
              {course.sub_country && `${course.sub_country}, `}
              {course.country}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {course.times_played} played
              </span>
              {course.friends_count != null && course.friends_count > 0 && (
                <span className="text-[11px] text-primary/80">
                  {course.friends_count} friend{course.friends_count === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>

          {/* Right: Rating */}
          {rating !== null && (
            <div className="flex items-center gap-1 flex-shrink-0">
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
