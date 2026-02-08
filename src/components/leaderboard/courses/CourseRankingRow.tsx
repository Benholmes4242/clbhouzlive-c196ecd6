import React from 'react';
import { cn } from '@/lib/utils';
import { Star, TrendingUp, TrendingDown, Flame, Award } from 'lucide-react';
import { CoursePrestigeTags } from './CoursePrestigeTags';

interface Course {
  course_id: string;
  course_name: string;
  country: string | null;
  sub_country: string | null;
  thumbnail_url: string | null;
  avg_rating: number | null;
  times_played: number;
  unique_players: number;
  rank_change: number;
  is_trending: boolean;
  is_hall_of_fame: boolean;
  prestige_tags: string[];
  current_user_played: boolean;
  current_user_play_count: number;
}

interface Props {
  course: Course;
  rank: number;
  sort: 'highest_rated' | 'most_played' | 'rising';
  onClick: () => void;
}

export const CourseRankingRow: React.FC<Props> = ({ course, rank, sort, onClick }) => {
  const isTop3 = rank <= 3;
  const isTop10 = rank <= 10;

  // Modern Country Club palette for ranks
  const getRankStyle = () => {
    if (rank === 1) return 'bg-[#C1A84C] text-white'; // Chartreus Gold
    if (rank === 2) return 'bg-[#B8C6C9] text-white'; // Sky Blue Silver
    if (rank === 3) return 'bg-[#8B7355] text-white'; // Warm Bronze
    if (isTop10) return 'bg-[#C1A84C]/10 text-[#C1A84C]'; // Gold tint for top 10
    return 'bg-muted text-muted-foreground';
  };

  const getUserHistory = () => {
    if (!course.current_user_played) return 'Not played';
    // If played but count is 0/1, show "Played ✓"; otherwise show count
    if (course.current_user_play_count <= 1) return 'Played ✓';
    return `Played ${course.current_user_play_count}×`;
  };

  const location = course.sub_country || course.country || '';

  return (
    <button
      onClick={onClick}
      aria-label={`View ${course.course_name}`}
      className={cn(
        'w-full flex items-center gap-3 py-3 px-4 border-b border-border text-left',
        'hover:bg-muted/50 transition-colors active:scale-[0.98] transition-transform'
      )}
    >
      {/* Rank */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
          'text-xs font-bold',
          getRankStyle()
        )}
      >
        {rank}
      </div>

      {/* Course thumbnail */}
      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.course_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground text-[8px]">No img</span>
          </div>
        )}
      </div>

      {/* Course info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-foreground truncate">
          {course.course_name}
        </h4>
        <p className="text-xs text-muted-foreground truncate">
          {location}
        </p>

        {/* Prestige tags */}
        {course.prestige_tags && course.prestige_tags.length > 0 && (
          <CoursePrestigeTags tags={course.prestige_tags} />
        )}

        {/* Meta Row - sort-aware ordering */}
        <div className="flex items-center gap-2 mt-1 text-xs">
          {sort === 'most_played' ? (
            <>
              {/* Play count FIRST for Most Played */}
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-[#C1A84C] fill-[#C1A84C]" />
                <span className="text-muted-foreground">{course.avg_rating?.toFixed(1) || '-'}</span>
              </span>
              <span className="text-muted-foreground/30">•</span>
              <span className="font-medium text-foreground">
                Played by {course.unique_players || course.times_played}
              </span>
            </>
          ) : (
            <>
              {/* Rating FIRST for Highest Rated / Trending */}
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-[#C1A84C] fill-[#C1A84C]" />
                <span className="font-medium text-muted-foreground">{course.avg_rating?.toFixed(1) || '-'}</span>
              </span>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-muted-foreground">Played by {course.unique_players || course.times_played}</span>
            </>
          )}
          <span className="text-muted-foreground/30">•</span>
          <span className={course.current_user_played ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
            {getUserHistory()}
          </span>
        </div>
      </div>

      {/* Right indicators */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {/* Rank movement */}
        {course.rank_change !== 0 && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            course.rank_change > 0 ? 'text-emerald-600' : 'text-red-500'
          )}>
            {course.rank_change > 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{Math.abs(course.rank_change)}</span>
          </div>
        )}

        {/* Trending indicator */}
        {course.is_trending && (
          <Flame className="w-4 h-4 text-orange-500" />
        )}

        {/* Hall of Fame indicator */}
        {course.is_hall_of_fame && (
          <Award className="w-4 h-4 text-[#C1A84C]" />
        )}
      </div>
    </button>
  );
};
