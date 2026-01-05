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
 * Tiered course card with clear visual hierarchy:
 * - Top 100: Larger cards with gold accent, trophy icon, strong visual weight
 * - Non-Top-100: Reduced card height, smaller image, muted border - no gold accent
 * 
 * Top 100 must ALWAYS dominate visually - core Clbhouz principle.
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

  // Top 100 card - LARGER with gold accent and trophy styling (premium treatment)
  if (isTop100) {
    return (
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className="relative bg-card border rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all group"
        style={{ borderColor: 'rgba(210, 180, 97, 0.4)' }}
      >
        {/* Trophy gold accent line - prominent 2px */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2px]" 
          style={{ background: 'linear-gradient(to right, rgba(210, 180, 97, 0.6), #D2B461, rgba(210, 180, 97, 0.6))' }} 
        />
        
        <div className="flex">
          {/* Thumbnail - LARGER for Top 100 */}
          <div className="relative flex-shrink-0">
            {course.thumbnail_image ? (
              <img
                src={course.thumbnail_image}
                alt={course.name}
                className="w-24 h-24 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50" />
            )}
            {/* Top 100 icon overlay - trophy gold */}
            <div 
              className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: 'rgba(210, 180, 97, 0.95)' }}
            >
              <Trophy className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Content - generous padding for prominence */}
          <div className="flex-1 py-3 px-3.5 flex flex-col justify-center min-w-0">
            <div className="font-semibold text-sm text-foreground truncate">{course.name}</div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {course.sub_country || course.country}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {/* Top 100 label */}
              <span 
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(210, 180, 97, 0.15)', color: '#B8963C' }}
              >
                Top 100 Course
              </span>
              {course.last_played_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(course.last_played_at), 'd MMM yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Rating - aligned */}
          <div className="flex items-center pr-3">
            {isRated && course.rating_value ? (
              <RatingPill score={course.rating_value} className="text-[11px] px-3 py-1 h-7" />
            ) : isOwnProfile ? (
              <button 
                onClick={handleRateClick}
                className="text-[11px] font-medium hover:underline"
                style={{ color: '#D2B461' }}
              >
                Rate
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  }

  // Non-Top-100 cards - SMALLER with muted styling
  // Unrated: Even more compact
  if (!isRated) {
    return (
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className="bg-muted/20 border border-border/30 rounded-lg overflow-hidden cursor-pointer hover:border-border/50 transition-colors"
      >
        <div className="flex">
          {/* Thumbnail - smaller, muted */}
          {course.thumbnail_image ? (
            <img
              src={course.thumbnail_image}
              alt={course.name}
              className="w-14 h-14 object-cover flex-shrink-0 opacity-70"
            />
          ) : (
            <div className="w-14 h-14 bg-muted/50 flex-shrink-0" />
          )}

          {/* Content - compact */}
          <div className="flex-1 py-2 px-2.5 flex flex-col justify-center min-w-0">
            <div className="font-medium text-[13px] text-foreground/75 truncate">{course.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">
              {course.sub_country || course.country}
            </div>
          </div>

          {/* Rate CTA */}
          {isOwnProfile && (
            <div className="flex items-center pr-2.5">
              <button 
                onClick={handleRateClick}
                className="text-[10px] text-muted-foreground hover:text-foreground font-medium px-2 py-1 bg-background border border-border/50 rounded-md hover:border-border transition-colors"
              >
                Rate
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Standard rated non-Top-100 card - moderate sizing, no gold accent
  return (
    <motion.div
      onClick={handleClick}
      whileTap={{ scale: 0.98 }}
      className="bg-card border border-border/30 rounded-lg overflow-hidden cursor-pointer hover:border-border/50 transition-colors"
    >
      <div className="flex">
        {/* Thumbnail - standard size */}
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            className="w-16 h-16 object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-muted flex-shrink-0" />
        )}

        {/* Content */}
        <div className="flex-1 py-2 px-2.5 flex flex-col justify-center min-w-0">
          <div className="font-medium text-[13px] text-foreground truncate">{course.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">
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

        {/* Rating */}
        <div className="flex items-center pr-2.5">
          {course.rating_value && (
            <RatingPill score={course.rating_value} className="text-[10px] px-2 py-0.5 h-5" />
          )}
        </div>
      </div>
    </motion.div>
  );
};
