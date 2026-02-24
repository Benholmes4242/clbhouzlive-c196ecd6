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

  const getBorderStyle = () => {
    switch (rank) {
      case 1: return {
        border: '3px solid transparent',
        backgroundImage: 'linear-gradient(var(--background), var(--background)), linear-gradient(135deg, #D4A853, #F0D78C, #D4A853)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      };
      case 2: return { border: '2.5px solid #A8B4C0' };
      case 3: return { border: '2.5px solid #C4956A' };
    }
  };

  const getRankBadgeStyle = () => {
    switch (rank) {
      case 1: return { background: '#D4A853', width: 28, height: 28 };
      case 2: return { background: '#A8B4C0', width: 24, height: 24 };
      case 3: return { background: '#C4956A', width: 24, height: 24 };
    }
  };

  const getMetricDisplay = () => {
    switch (sort) {
      case 'highest_rated':
        return (
          <span className="flex items-center justify-center gap-0.5">
            <Star className={cn('fill-current', isCenter ? 'w-4 h-4' : 'w-3.5 h-3.5')} style={{ color: '#D4A853' }} />
            <span className={cn('font-bold', isCenter ? 'text-base' : 'text-sm')} style={{ color: '#D4A853' }}>
              {course.avg_rating?.toFixed(1) || '-'}
            </span>
          </span>
        );
      case 'most_played':
        return (
          <span className="flex items-center justify-center gap-1">
            <Users className={cn(isCenter ? 'w-4 h-4' : 'w-3.5 h-3.5')} style={{ color: '#40916C' }} />
            <span className={cn('font-bold', isCenter ? 'text-base' : 'text-sm')} style={{ color: '#40916C' }}>
              {course.times_played}
            </span>
          </span>
        );
      case 'rising':
        if (!course.rank_change || course.rank_change === 0) {
          return (
            <span className="flex items-center justify-center gap-0.5">
              <Star className={cn('fill-current', isCenter ? 'w-4 h-4' : 'w-3.5 h-3.5')} style={{ color: '#D4A853' }} />
              <span className={cn('font-bold', isCenter ? 'text-base' : 'text-sm')} style={{ color: '#D4A853' }}>
                {course.avg_rating?.toFixed(1) || '-'}
              </span>
            </span>
          );
        }
        return (
          <span className="flex items-center justify-center gap-1">
            <TrendingUp className={cn(isCenter ? 'w-4 h-4' : 'w-3.5 h-3.5')} style={{ color: '#40916C' }} />
            <span className={cn('font-bold', isCenter ? 'text-base' : 'text-sm')} style={{ color: '#40916C' }}>
              +{course.rank_change}
            </span>
          </span>
        );
    }
  };

  const location = course.sub_country || course.country || '';
  const badgeStyle = getRankBadgeStyle();

  // Vertical offset for stepped podium
  const verticalOffset = rank === 1 ? 0 : rank === 2 ? 16 : 28;

  // Staggered animation delay
  const animDelay = rank === 1 ? 0 : rank === 2 ? 0.1 : 0.2;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animDelay, duration: 0.4, ease: 'easeOut' }}
      className="relative flex flex-col items-center"
      style={{
        width: isCenter ? 'clamp(130px, 34vw, 160px)' : 'clamp(100px, 26vw, 120px)',
        marginTop: verticalOffset,
      }}
    >
      {/* Crown for 1st place */}
      {rank === 1 && (
        <motion.div
          className="mb-1"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.4, type: 'spring', stiffness: 200 }}
        >
          <Crown
            size={32}
            className="drop-shadow-md"
            style={{ color: '#D4A853', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
            fill="#D4A853"
            strokeWidth={1.5}
          />
        </motion.div>
      )}

      {/* Spotlight glow for #1 */}
      {showGlow && (
        <div
          className="absolute -inset-6 -z-10 rounded-3xl"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(212, 168, 83, 0.05) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Course image container */}
      <div className="relative w-full">
        <div
          className={cn(
            'relative w-full overflow-hidden',
            isCenter ? 'rounded-2xl' : 'rounded-[14px]',
          )}
          style={{
            aspectRatio: '4/3',
            ...getBorderStyle(),
            boxShadow: rank === 1
              ? '0 8px 24px rgba(212, 168, 83, 0.2)'
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
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

        {/* Rank badge - bottom center */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center text-white font-bold shadow-md"
          style={{
            width: badgeStyle.width,
            height: badgeStyle.height,
            background: badgeStyle.background,
            fontSize: rank === 1 ? 14 : 12,
            border: '2px solid white',
          }}
        >
          {rank}
        </div>
      </div>

      {/* Course info */}
      <div className={cn(
        'mt-4 text-center w-full',
        isCenter ? 'max-w-[160px]' : 'max-w-[120px]'
      )}>
        <p className={cn(
          'font-bold text-foreground line-clamp-2 leading-tight',
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
        <div className="mt-1">
          {getMetricDisplay()}
        </div>
      </div>
    </motion.button>
  );
};
