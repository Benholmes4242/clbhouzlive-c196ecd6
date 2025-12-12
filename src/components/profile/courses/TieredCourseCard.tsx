import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Trophy } from 'lucide-react';
import { RatingPill } from '@/components/ui/RatingPill';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export interface CourseCardData {
  id: string;
  name: string;
  country: string;
  sub_country: string | null;
  thumbnail_image: string | null;
  is_top100: boolean;
  last_played_at: string | null;
  rating_value: number | null;
  has_rating: boolean;
}

interface TieredCourseCardProps {
  course: CourseCardData;
  isOwnProfile: boolean;
  onRateClick?: (courseId: string) => void;
}

/**
 * Tiered course card with three visual treatments:
 * - Top 100: Taller with gold accent
 * - Rated: Standard card
 * - Unrated: Compact with muted styling and rate prompt
 */
export const TieredCourseCard: React.FC<TieredCourseCardProps> = ({
  course,
  isOwnProfile,
  onRateClick,
}) => {
  const navigate = useNavigate();
  const isTop100 = course.is_top100;
  const isRated = course.has_rating && course.rating_value !== null;
  const isUnrated = !isRated;

  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };

  const handleRateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRateClick) {
      onRateClick(course.id);
    } else {
      navigate(`/courses/${course.id}/rate`);
    }
  };

  // Top 100 card - premium treatment
  if (isTop100) {
    return (
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className="relative bg-white border border-amber-200/50 rounded-sq-sm overflow-hidden cursor-pointer hover:shadow-md transition-all group"
      >
        {/* Gold accent line - consistent 2px */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 rounded-t-sq-sm" />
        
        <div className="flex">
          {/* Thumbnail - slightly larger */}
          <div className="relative flex-shrink-0">
            {course.thumbnail_image ? (
              <img
                src={course.thumbnail_image}
                alt={course.name}
                className="w-24 h-24 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200" />
            )}
            {/* Top 100 icon overlay */}
            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-500/90 flex items-center justify-center shadow-sm">
              <Trophy className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
            <div className="font-semibold text-sm text-slate-900 truncate">{course.name}</div>
            <div className="text-xs text-slate-500 truncate">
              {course.sub_country || course.country}
            </div>
            {course.last_played_at && (
              <div className="flex items-center gap-1 mt-1.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] text-slate-400">
                  {format(new Date(course.last_played_at), 'd MMM yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Rating - refined pill */}
          <div className="flex items-center px-3">
            {isRated && course.rating_value ? (
              <RatingPill score={course.rating_value} className="text-[10px] px-3 py-0.5 h-6" />
            ) : isOwnProfile ? (
              <button 
                onClick={handleRateClick}
                className="text-[10px] text-amber-600 font-medium hover:underline"
              >
                Rate
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  }

  // Unrated card - compact with muted styling
  if (isUnrated) {
    return (
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className="bg-slate-50/80 border border-slate-100 rounded-sq-sm overflow-hidden cursor-pointer hover:border-slate-200 transition-colors"
      >
        <div className="flex">
          {/* Thumbnail - muted */}
          {course.thumbnail_image ? (
            <img
              src={course.thumbnail_image}
              alt={course.name}
              className="w-16 h-16 object-cover flex-shrink-0 opacity-80"
            />
          ) : (
            <div className="w-16 h-16 bg-slate-100 flex-shrink-0" />
          )}

          {/* Content */}
          <div className="flex-1 p-2.5 flex flex-col justify-center min-w-0">
            <div className="font-medium text-sm text-slate-700 truncate">{course.name}</div>
            <div className="text-xs text-slate-400 truncate">
              {course.sub_country || course.country}
            </div>
          </div>

          {/* Rate CTA */}
          {isOwnProfile && (
            <div className="flex items-center px-3">
              <button 
                onClick={handleRateClick}
                className="text-[11px] text-slate-500 hover:text-slate-700 font-medium px-2 py-1 bg-white border border-slate-200 rounded-sq-xs hover:border-slate-300 transition-colors"
              >
                Rate this course
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Standard rated card
  return (
    <motion.div
      onClick={handleClick}
      whileTap={{ scale: 0.98 }}
      className="bg-white border border-slate-100 rounded-sq-sm overflow-hidden cursor-pointer hover:border-slate-200 transition-colors"
    >
      <div className="flex">
        {/* Thumbnail */}
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            className="w-20 h-20 object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 bg-slate-100 flex-shrink-0" />
        )}

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
          <div className="font-medium text-sm text-slate-900 truncate">{course.name}</div>
          <div className="text-xs text-slate-500 truncate">
            {course.sub_country || course.country}
          </div>
          {course.last_played_at && (
            <div className="flex items-center gap-1 mt-1.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] text-slate-400">
                {format(new Date(course.last_played_at), 'd MMM yyyy')}
              </span>
            </div>
          )}
        </div>

        {/* Rating - refined pill */}
        <div className="flex items-center px-3">
          {course.rating_value && (
            <RatingPill score={course.rating_value} className="text-[10px] px-3 py-0.5 h-6" />
          )}
        </div>
      </div>
    </motion.div>
  );
};
