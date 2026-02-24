import React from 'react';
import { cn } from '@/lib/utils';
import { Star, TrendingUp, TrendingDown } from 'lucide-react';

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
  const getRankColor = () => {
    if (rank === 1) return '#D4A853';
    if (rank === 2) return '#A8B4C0';
    if (rank === 3) return '#C4956A';
    return undefined;
  };

  const getUserHistory = () => {
    if (!course.current_user_played) return 'Not played';
    if (course.current_user_play_count <= 1) return 'Played ✓';
    return `Played ${course.current_user_play_count}×`;
  };

  const location = course.sub_country || course.country || '';
  const rankColor = getRankColor();

  return (
    <button
      onClick={onClick}
      aria-label={`View ${course.course_name}`}
      className={cn(
        'w-full flex items-center gap-3 py-3 px-4 text-left',
        'transition-colors active:scale-[0.98] transition-transform',
        'hover:bg-[rgba(0,0,0,0.02)]',
        course.current_user_played && 'bg-[rgba(82,183,136,0.03)]',
      )}
      style={{
        borderBottom: '1px solid hsl(var(--border) / 0.15)',
        borderLeft: course.current_user_played ? '3px solid rgba(82, 183, 136, 0.3)' : undefined,
      }}
    >
      {/* Rank */}
      <div
        className="w-8 flex-shrink-0 text-center font-bold text-lg"
        style={{ color: rankColor || 'hsl(var(--muted-foreground))' }}
      >
        {rank}
      </div>

      {/* Course thumbnail — 64x48 */}
      <div
        className="flex-shrink-0 rounded-[10px] overflow-hidden bg-muted"
        style={{ width: 64, height: 48, border: '1px solid rgba(0, 0, 0, 0.06)' }}
      >
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
        <p className="text-xs text-muted-foreground truncate mt-px">
          {location}
        </p>

        {/* Rating row */}
        <div className="flex items-center gap-1.5 mt-1 text-xs">
          <span className="flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-current" style={{ color: '#D4A853' }} />
            <span className="font-bold" style={{ color: '#D4A853' }}>
              {course.avg_rating?.toFixed(1) || '-'}
            </span>
          </span>
          <span style={{ color: 'rgba(0,0,0,0.15)' }}>·</span>
          <span className="text-muted-foreground">
            Played by {course.unique_players || course.times_played}
          </span>
        </div>
      </div>

      {/* Right side: played status + rank movement */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={cn(
          'text-xs font-semibold',
          course.current_user_played ? 'text-[#40916C]' : 'text-muted-foreground'
        )}>
          {getUserHistory()}
        </span>

        {course.rank_change !== 0 && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            course.rank_change > 0 ? 'text-emerald-600' : 'text-red-500'
          )}>
            {course.rank_change > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{Math.abs(course.rank_change)}</span>
          </div>
        )}
      </div>
    </button>
  );
};
