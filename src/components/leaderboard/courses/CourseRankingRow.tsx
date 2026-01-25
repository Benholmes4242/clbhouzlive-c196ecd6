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
  sort: string;
  onClick: () => void;
}

export const CourseRankingRow: React.FC<Props> = ({ course, rank, sort, onClick }) => {
  const isTop3 = rank <= 3;
  const isTop10 = rank <= 10;

  const getRankStyle = () => {
    if (rank === 1) return 'bg-amber-500 text-white';
    if (rank === 2) return 'bg-slate-400 text-white';
    if (rank === 3) return 'bg-amber-700 text-white';
    if (isTop10) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-600';
  };

  const getUserHistory = () => {
    if (!course.current_user_played) return 'Not played';
    if (course.current_user_play_count === 1) return 'Played';
    return `Played ${course.current_user_play_count}×`;
  };

  const location = course.sub_country || course.country || '';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 py-3 px-4 border-b border-slate-100 text-left',
        'hover:bg-slate-50/50 transition-colors',
        isTop10 && 'bg-slate-50/30'
      )}
    >
      {/* Rank */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          'text-sm font-bold',
          getRankStyle()
        )}
      >
        {rank}
      </div>

      {/* Course thumbnail */}
      <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.course_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-slate-300 text-[8px]">No img</span>
          </div>
        )}
      </div>

      {/* Course info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-900 truncate">
          {course.course_name}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {location}
        </p>

        {/* Prestige tags */}
        {course.prestige_tags && course.prestige_tags.length > 0 && (
          <CoursePrestigeTags tags={course.prestige_tags} />
        )}

        {/* Stats row */}
        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
          <span className="flex items-center gap-0.5">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            {course.avg_rating?.toFixed(1) || '-'}
          </span>
          <span>•</span>
          <span>Played by {course.unique_players || course.times_played}</span>
          <span>•</span>
          <span className={course.current_user_played ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
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
          <Award className="w-4 h-4 text-amber-500" />
        )}
      </div>
    </button>
  );
};
