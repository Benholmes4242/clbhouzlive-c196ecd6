/**
 * TieredCourseCard - Visual hierarchy cards for All Courses Played
 * 
 * Updated with Amber (#f59e0b) for Top 100 courses.
 */
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
  rating_id: string | null;
}

interface TieredCourseCardProps {
  course: CourseCardData;
  isOwnProfile: boolean;
  onRateClick?: (courseId: string) => void;
}

/**
 * Tiered course card with clear visual hierarchy:
 * - Top 100: Larger cards with Amber accent (#f59e0b), trophy icon, strong visual weight
 * - Non-Top-100: Slightly smaller, muted styling - still readable
 */
export const TieredCourseCard: React.FC<TieredCourseCardProps> = ({
  course,
  isOwnProfile,
  onRateClick,
}) => {
  const navigate = useNavigate();
  const isTop100 = course.is_top100;
  const isRated = course.has_rating && course.rating_value !== null;

  const handleClick = () => {
    if (course.rating_id) {
      navigate(`/courses/${course.id}?tab=reviews&review=${course.rating_id}`);
    } else {
      navigate(`/courses/${course.id}`);
    }
  };

  const handleRateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRateClick) {
      onRateClick(course.id);
    } else {
      navigate(`/courses/${course.id}/rate`);
    }
  };

  // Top 100 card - LARGER with amber accent and trophy styling (premium treatment)
  if (isTop100) {
    return (
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className="relative bg-card rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all group border border-amber-400/30"
      >
        {/* Trophy Chartreus accent line - prominent 2px */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2px]" 
          style={{ background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.3) 0%, #f59e0b 50%, rgba(245, 158, 11, 0.3) 100%)' }} 
        />
        
        <div className="flex">
          {/* Thumbnail - LARGER for Top 100 */}
          <div className="relative flex-shrink-0">
            {course.thumbnail_image ? (
              <img
                src={course.thumbnail_image}
                alt={course.name}
                loading="lazy"
                decoding="async"
                className="w-24 h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-l-xl"
              />
            ) : (
              <div className="w-24 self-stretch bg-gradient-to-br from-muted to-muted/50 rounded-l-xl" />
            )}
            {/* Top 100 icon overlay - Chartreus */}
            <div 
              className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: '#f59e0b' }}
            >
              <Trophy className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Content - flexible column */}
          <div className="flex-1 py-2.5 px-3 flex flex-col justify-center min-w-0">
            {/* Course name - single line, wrap to 2 only if needed */}
            <div className="font-semibold text-sm text-foreground leading-tight line-clamp-2 break-words">
              {course.name}
            </div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {course.sub_country || course.country}
            </div>
            {/* Date row - single line */}
            {course.last_played_at && (
              <div className="flex items-center gap-1 mt-1.5 whitespace-nowrap">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(course.last_played_at), 'd MMM yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Rating column - fixed width, bottom-right aligned with date */}
          <div className="flex flex-col items-center justify-end pb-2.5 pr-3 pl-2 flex-shrink-0 min-w-[72px]">
            {isRated && course.rating_value ? (
              <>
                <span className="text-sm font-semibold text-foreground mb-0.5">
                  {course.rating_value.toFixed(1)}
                </span>
                <RatingPill score={course.rating_value} className="text-[10px] px-2 py-0.5" />
              </>
            ) : isOwnProfile ? (
              <button 
                onClick={handleRateClick}
                className="text-[11px] font-medium text-amber-500 hover:underline whitespace-nowrap"
              >
                Review
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  }

  // Non-Top-100 cards - ~85-90% height of Top 100
  // Unrated: Slightly more compact
  if (!isRated) {
    return (
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:border-border transition-colors"
      >
        <div className="flex">
          {/* Thumbnail - smaller, muted */}
          {course.thumbnail_image ? (
            <img
              src={course.thumbnail_image}
              alt={course.name}
              loading="lazy"
              decoding="async"
              className="w-16 self-stretch object-cover flex-shrink-0 opacity-80 rounded-l-xl"
            />
          ) : (
            <div className="w-16 self-stretch bg-muted/50 flex-shrink-0 rounded-l-xl" />
          )}

          {/* Content - flexible column */}
          <div className="flex-1 py-2 px-2.5 flex flex-col justify-center min-w-0">
            {/* Course name - allow 2 lines */}
            <div className="font-semibold text-[13px] text-foreground/80 leading-tight line-clamp-2">
              {course.name}
            </div>
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              {course.sub_country || course.country}
            </div>
            {course.last_played_at && (
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="w-2.5 h-2.5 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground">
                  {format(new Date(course.last_played_at), 'd MMM yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Review CTA - fixed column */}
          {isOwnProfile && (
            <div className="flex items-center pr-2.5 pl-2 flex-shrink-0">
              <button 
                onClick={handleRateClick}
                className="text-[10px] text-muted-foreground hover:text-foreground font-medium px-2 py-1 bg-background border border-border/50 rounded-md hover:border-border transition-colors whitespace-nowrap"
              >
                Review
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Standard rated non-Top-100 card - ~85% of Top 100 height
  return (
    <motion.div
      onClick={handleClick}
      whileTap={{ scale: 0.98 }}
      className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:border-border transition-colors"
    >
      <div className="flex">
        {/* Thumbnail - standard size (~85% of Top 100) */}
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            loading="lazy"
            decoding="async"
            className="w-[72px] self-stretch object-cover flex-shrink-0 rounded-l-xl"
          />
        ) : (
          <div className="w-[72px] self-stretch bg-muted flex-shrink-0 rounded-l-xl" />
        )}

        {/* Content - flexible column */}
        <div className="flex-1 py-2 px-2.5 flex flex-col justify-center min-w-0">
          {/* Course name - single line, wrap to 2 only if needed */}
          <div className="font-semibold text-[13px] text-foreground leading-tight line-clamp-2 break-words">
            {course.name}
          </div>
          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
            {course.sub_country || course.country}
          </div>
          {course.last_played_at && (
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">
                {format(new Date(course.last_played_at), 'd MMM yyyy')}
              </span>
            </div>
          )}
        </div>

        {/* Rating column - fixed width, bottom-right aligned with date */}
        <div className="flex flex-col items-center justify-end pb-2 pr-2.5 pl-2 flex-shrink-0 min-w-[68px]">
          {course.rating_value && (
            <>
              <span className="text-sm font-semibold text-foreground mb-0.5">
                {course.rating_value.toFixed(1)}
              </span>
              <RatingPill score={course.rating_value} className="text-[9px] px-1.5 py-0.5" />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};