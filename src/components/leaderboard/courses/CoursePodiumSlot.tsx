import React from 'react';
import { cn } from '@/lib/utils';
import { Star, Users, TrendingUp, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface Course {
  course_id: string;
  course_name: string;
  country: string | null;
  sub_country: string | null;
  thumbnail_url: string | null;
  avg_rating: number | null;
  times_played: number;
  rank_change: number;
}

interface Props {
  course: Course;
  rank: 1 | 2 | 3;
  position: 'left' | 'center' | 'right';
  sort: 'most_played' | 'highest_rated' | 'rising';
  showGlow?: boolean;
  onClick: () => void;
}

export const CoursePodiumSlot: React.FC<Props> = ({
  course,
  rank,
  position,
  sort,
  showGlow,
  onClick,
}) => {
  const isCenter = position === 'center';

  // Modern Country Club palette for ranks
  const getRankColor = () => {
    switch (rank) {
      case 1: return 'bg-[#C1A84C] text-white'; // Chartreus Gold
      case 2: return 'bg-[#B8C6C9] text-white'; // Sky Blue Silver
      case 3: return 'bg-[#8B7355] text-white'; // Warm Bronze
    }
  };

  // Get the hex color for the rank (for metric display)
  const getRankHexColor = () => {
    switch (rank) {
      case 1: return '#C1A84C'; // Chartreus Gold
      case 2: return '#B8C6C9'; // Sky Blue Silver
      case 3: return '#8B7355'; // Warm Bronze
    }
  };

  const getMetricDisplay = () => {
    const rankColor = getRankHexColor();
    
    switch (sort) {
      case 'highest_rated':
        return (
          <span className="flex items-center justify-center gap-0.5">
            <Star className={cn('fill-current', isCenter ? 'w-3.5 h-3.5' : 'w-3 h-3')} style={{ color: rankColor }} />
            <span className={cn('font-semibold', isCenter ? 'text-sm' : 'text-xs')} style={{ color: rankColor }}>
              {course.avg_rating?.toFixed(1) || '-'}
            </span>
          </span>
        );
      case 'most_played':
        return (
          <span className="flex items-center justify-center gap-1">
            <Users className={cn(isCenter ? 'w-3.5 h-3.5' : 'w-3 h-3')} style={{ color: rankColor }} />
            <span className={cn('font-semibold', isCenter ? 'text-sm' : 'text-xs')} style={{ color: rankColor }}>
              {course.times_played}
            </span>
          </span>
        );
      case 'rising':
        // If no rank change, show rating instead
        if (!course.rank_change || course.rank_change === 0) {
          return (
            <span className="flex items-center justify-center gap-0.5">
              <Star className={cn('fill-current', isCenter ? 'w-3.5 h-3.5' : 'w-3 h-3')} style={{ color: rankColor }} />
              <span className={cn('font-semibold', isCenter ? 'text-sm' : 'text-xs')} style={{ color: rankColor }}>
                {course.avg_rating?.toFixed(1) || '-'}
              </span>
            </span>
          );
        }
        return (
          <span className="flex items-center justify-center gap-1">
            <TrendingUp className={cn(isCenter ? 'w-3.5 h-3.5' : 'w-3 h-3')} style={{ color: rankColor }} />
            <span className={cn('font-semibold', isCenter ? 'text-sm' : 'text-xs')} style={{ color: rankColor }}>
              +{course.rank_change}
            </span>
          </span>
        );
    }
  };

  const location = course.sub_country || course.country || '';

  // Responsive sizing: use clamp for smooth scaling
  const containerStyle = {
    width: isCenter 
      ? 'clamp(110px, 30vw, 140px)' 
      : 'clamp(90px, 24vw, 112px)'
  };
  
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="relative flex flex-col items-center transition-all"
      style={containerStyle}
    >
      {/* Crown for 1st place */}
      {rank === 1 && (
        <motion.div
          className="mb-1"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.4,
            type: 'spring',
            stiffness: 200,
          }}
        >
          <Crown 
            size={28} 
            className="drop-shadow-sm"
            style={{ color: '#C1A84C' }}
            fill="#C1A84C"
            strokeWidth={1.5}
          />
        </motion.div>
      )}

      {/* Glow effect for #1 */}
      {showGlow && (
        <div
          className="absolute -inset-4 -z-10 rounded-2xl"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(193, 168, 76, 0.35) 0%, transparent 70%)',
            filter: 'blur(12px)',
          }}
        />
      )}

      {/* Course image container - overflow visible for badge */}
      <div className="relative w-full pb-3">
        <div
          className={cn(
            'relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-md',
            rank === 1 && 'ring-2 ring-[#C1A84C] ring-offset-2',
            rank === 2 && 'ring-1 ring-border',
            rank === 3 && 'ring-1 ring-border'
          )}
        >
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.course_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-xs">No image</span>
            </div>
          )}
        </div>

        {/* Rank badge - positioned outside overflow-hidden */}
        <div
          className={cn(
            'absolute -bottom-1.5 left-1/2 -translate-x-1/2',
            'w-5 h-5 rounded-full flex items-center justify-center',
            'text-xs font-bold shadow-sm',
            getRankColor()
          )}
        >
          {rank}
        </div>
      </div>

      {/* Course info */}
      <div className={cn('mt-3 text-center w-full', isCenter ? 'max-w-28' : 'max-w-20')}>
        <p className={cn(
          'font-semibold text-foreground line-clamp-2 leading-tight',
          isCenter ? 'text-sm' : 'text-xs'
        )}>
          {course.course_name}
        </p>
        <p className={cn(
          'text-muted-foreground mt-0.5 truncate',
          isCenter ? 'text-xs' : 'text-[10px]'
        )}>
          {location}
        </p>
        <div className="mt-1.5">
          {getMetricDisplay()}
        </div>
      </div>
    </motion.button>
  );
};
