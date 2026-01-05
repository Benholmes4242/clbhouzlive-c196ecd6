import React from 'react';
import { Trophy, Calendar } from 'lucide-react';
import { RatingPill } from '@/components/ui/RatingPill';
import { format } from 'date-fns';
import { TopTenCourse } from '@/hooks/useUserTopTenCourses';
import { motion } from 'framer-motion';

interface FeaturedFavouriteCardProps {
  course: TopTenCourse;
  userRating?: number;
  lastPlayedAt?: string | null;
  isEditable: boolean;
  onClick: () => void;
}

/**
 * Premium featured card for the #1 favourite course.
 * Full-bleed image with overlay showing rank badge, course name, and rating.
 */
export const FeaturedFavouriteCard: React.FC<FeaturedFavouriteCardProps> = ({
  course,
  userRating,
  lastPlayedAt,
  isEditable,
  onClick,
}) => {
  const isTop100 = !!(course.global_rank || course.regional_rank || course.usa_rank);

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ opacity: 0.92 }}
      className="relative bg-slate-900 rounded-sq-md overflow-hidden cursor-pointer group"
    >
      {/* Hero image with gradient overlay - slightly reduced height */}
      <div className="aspect-[16/8.5] relative overflow-hidden">
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-700 to-slate-800" />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Rank badge - top left, slightly inward */}
        <div className="absolute top-4 left-4 z-10">
          <div className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-slate-900">#1</span>
          </div>
        </div>

        {/* Top 100 badge - top right - uses trophy gold */}
        {isTop100 && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 backdrop-blur-sm rounded-sq-pill" style={{ backgroundColor: 'rgba(210, 180, 97, 0.9)' }}>
            <Trophy className="w-3 h-3 text-white" />
            <span className="text-[10px] font-semibold text-white">Top 100</span>
          </div>
        )}

        {/* Content overlay - bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="font-semibold text-lg text-white truncate drop-shadow-md">
                {course.name}
              </h4>
              <p className="text-sm text-white/80 truncate">
                {course.sub_country || course.country}
              </p>
              {lastPlayedAt && (
                <div className="flex items-center gap-1 text-white/60 text-xs">
                  <Calendar className="w-3 h-3" />
                  <span>Last played {format(new Date(lastPlayedAt), 'd MMM yyyy')}</span>
                </div>
              )}
            </div>

            {/* Rating pill */}
            {userRating && userRating > 0 && (
              <RatingPill score={userRating} className="text-xs px-3 py-1.5 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
