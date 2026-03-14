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
  seasonColor?: string;
  onClick: () => void;
}

const POSITION_CONFIG = {
  1: { imageWidth: 'clamp(140px, 38vw, 180px)', badgeSize: 26, badgeFontSize: 13, nameSize: 16, nameWeight: 700, locationSize: 13, metricSize: 20, metricWeight: 800, iconSize: 18, verticalOffset: 0, maxInfoWidth: 180 },
  2: { imageWidth: 'clamp(110px, 28vw, 135px)', badgeSize: 22, badgeFontSize: 11, nameSize: 13, nameWeight: 600, locationSize: 11, metricSize: 16, metricWeight: 700, iconSize: 16, verticalOffset: 24, maxInfoWidth: 135 },
  3: { imageWidth: 'clamp(110px, 28vw, 135px)', badgeSize: 22, badgeFontSize: 11, nameSize: 13, nameWeight: 600, locationSize: 11, metricSize: 16, metricWeight: 700, iconSize: 16, verticalOffset: 40, maxInfoWidth: 135 },
} as const;

export const CoursePodiumSlot: React.FC<Props> = ({
  course,
  rank,
  position,
  sort,
  showGlow,
  seasonColor = 'hsl(var(--accent-amber))',
  onClick,
}) => {
  const isCenter = position === 'center';
  const config = POSITION_CONFIG[rank];

  const getBorderStyle = () => {
    return { border: 'none' };
  };

  const getMetricDisplay = () => {
    switch (sort) {
      case 'highest_rated':
        return (
          <span className="flex items-center justify-center">
            <span style={{ color: 'hsl(var(--accent-amber))', fontSize: config.metricSize, fontWeight: config.metricWeight }}>
              {course.avg_rating?.toFixed(1) || '-'}
            </span>
          </span>
        );
      case 'most_played':
        return (
          <span className="flex items-center justify-center gap-1">
            <Users style={{ color: 'hsl(var(--accent-amber))', width: config.iconSize, height: config.iconSize }} />
            <span style={{ color: 'hsl(var(--accent-amber))', fontSize: config.metricSize, fontWeight: config.metricWeight }}>
              {course.times_played}
            </span>
          </span>
        );
      case 'rising':
        if (!course.rank_change || course.rank_change === 0) {
          return (
            <span className="flex items-center justify-center">
              <span style={{ color: 'hsl(var(--accent-amber))', fontSize: config.metricSize, fontWeight: config.metricWeight }}>
                {course.avg_rating?.toFixed(1) || '-'}
              </span>
            </span>
          );
        }
        return (
          <span className="flex items-center justify-center gap-1">
            <TrendingUp style={{ color: 'hsl(var(--accent-amber))', width: config.iconSize, height: config.iconSize }} />
            <span style={{ color: 'hsl(var(--accent-amber))', fontSize: config.metricSize, fontWeight: config.metricWeight }}>
              +{course.rank_change}
            </span>
          </span>
        );
    }
  };

  const location = course.sub_country || course.country || '';
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
        width: config.imageWidth,
        marginTop: config.verticalOffset,
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
            size={36}
            className="drop-shadow-md"
            style={{ color: 'hsl(var(--accent-amber))', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
            fill="#f59e0b"
            strokeWidth={1.5}
          />
        </motion.div>
      )}

      {/* Spotlight glow for #1 */}
      {showGlow && (
        <div
          className="absolute -inset-6 -z-10 rounded-3xl"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(var(--accent-amber) / 0.08) 0%, transparent 70%)',
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
              ? '0 8px 24px hsl(var(--accent-amber) / 0.2)'
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

        {/* Rank number — plain typographic, amber for #1, muted for others */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center font-bold"
          style={{
            fontSize: config.badgeFontSize,
            color: rank === 1 ? 'hsl(var(--accent-amber))' : 'hsl(var(--muted-foreground))',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          #{rank}
        </div>
      </div>

      {/* Course info */}
      <div className="mt-4 text-center w-full" style={{ maxWidth: config.maxInfoWidth }}>
        <p
          className="text-foreground line-clamp-2 leading-tight"
          style={{ fontSize: config.nameSize, fontWeight: config.nameWeight }}
        >
          {course.course_name}
        </p>
        <p
          className="text-muted-foreground mt-0.5 truncate"
          style={{ fontSize: config.locationSize }}
        >
          {location}
        </p>
        <div className="mt-1">
          {getMetricDisplay()}
        </div>
      </div>
    </motion.button>
  );
};
