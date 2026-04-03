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
  friends_count?: number;
  friends_avg_rating?: number | null;
}

interface Props {
  course: Course;
  rank: number;
  sort: 'highest_rated' | 'most_played' | 'rising';
  seasonColor?: string;
  onClick: () => void;
}

export const CourseRankingRow: React.FC<Props> = ({ course, rank, sort, seasonColor = 'hsl(var(--accent-amber))', onClick }) => {
  const getRankColor = () => {
    if (rank === 1) return 'hsl(var(--accent-amber))';
    return 'hsl(var(--muted-foreground))';
  };

  const getUserHistory = () => {
    if (!course.current_user_played) return 'Not played';
    if (course.current_user_play_count <= 1) return 'Played ✓';
    return `Played ${course.current_user_play_count}×`;
  };

  const location = course.sub_country || course.country || '';
  const rankColor = getRankColor();

  // Season-aware played treatment using CSS vars for proper alpha
  const playedBg = course.current_user_played ? 'rgba(247,147,30,0.06)' : undefined;
  const playedBorder = course.current_user_played ? '#F7931E' : undefined;

  return (
    <button
      onClick={onClick}
      aria-label={`View ${course.course_name}`}
      className={cn(
        'w-full flex items-center gap-3 py-4 px-5 text-left',
        'transition-colors active:scale-[0.98] transition-transform',
      )}
      style={{
        borderBottom: '1px solid hsl(var(--border) / 0.25)',
        borderLeft: playedBorder ? `3px solid ${playedBorder}` : undefined,
        backgroundColor: playedBg,
      }}
    >
      {/* Rank */}
      <div
        className="w-8 flex-shrink-0 text-center font-extrabold"
        style={{ color: rankColor || 'hsl(var(--muted-foreground))', fontSize: 20 }}
      >
        {rank}
      </div>

      {/* Course thumbnail — 72x54 */}
      <div
        className="flex-shrink-0 rounded-xl overflow-hidden bg-muted"
        style={{ width: 'clamp(54px,15vw,64px)', height: 'clamp(40px,11vw,48px)' }}
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
        <h4 className="font-semibold text-foreground truncate" style={{ fontSize: 15 }}>
          {course.course_name}
        </h4>
        <p className="text-muted-foreground truncate mt-px" style={{ fontSize: 13 }}>
          {location}
        </p>

        {/* Rating row */}
        <div className="flex items-center gap-1.5 mt-1" style={{ fontSize: 13 }}>
          <span className="flex items-center">
            <span className="font-bold" style={{ color: 'hsl(var(--accent-amber))', fontSize: 16 }}>
              {course.avg_rating?.toFixed(1) || '-'}
            </span>
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-muted-foreground">
            Played by {course.unique_players || course.times_played}
          </span>
        </div>

        {/* Friends signal chip */}
        {(course.friends_count ?? 0) > 0 && (
          <div
            className="inline-flex items-center gap-1 mt-1"
            style={{
              background: 'hsl(var(--accent-amber) / 0.07)',
              border: '1px solid hsl(var(--accent-amber) / 0.2)',
              borderRadius: 6,
              padding: '2px 8px',
            }}
          >
            <span style={{ fontSize: 11 }}>👥</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'hsl(var(--accent-amber))',
              }}
            >
              {course.friends_count}
              {course.friends_count === 1 ? ' friend' : ' friends'} played
              {course.friends_avg_rating != null
                ? ` · ${course.friends_avg_rating.toFixed(1)} avg`
                : ''}
            </span>
          </div>
        )}
      </div>

      {/* Right side: played status + rank movement */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className="font-semibold"
          style={{
            fontSize: 13,
            color: course.current_user_played ? 'hsl(var(--accent-amber))' : 'hsl(var(--muted-foreground))',
          }}
        >
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
