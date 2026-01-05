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

  // Top 100 card - premium treatment with trophy gold styling
  if (isTop100) {
    return (
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className="relative bg-card border rounded-xl overflow-hidden cursor-pointer hover:shadow-sm transition-all group"
        style={{ borderColor: 'rgba(210, 180, 97, 0.3)' }}
      >
        {/* Trophy gold accent line - thinner 1.5px */}
        <div 
          className="absolute top-0 left-0 right-0 h-[1.5px]" 
          style={{ background: 'linear-gradient(to right, rgba(210, 180, 97, 0.6), #D2B461, rgba(210, 180, 97, 0.6))' }} 
        />
        
        <div className="flex">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0">
            {course.thumbnail_image ? (
              <img
                src={course.thumbnail_image}
                alt={course.name}
                className="w-20 h-20 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/50" />
            )}
            {/* Top 100 icon overlay - trophy gold */}
            <div 
              className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: 'rgba(210, 180, 97, 0.9)' }}
            >
              <Trophy className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          {/* Content - normalized padding */}
          <div className="flex-1 py-2.5 px-3 flex flex-col justify-center min-w-0">
            <div className="font-medium text-sm text-foreground truncate">{course.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {course.sub_country || course.country}
            </div>
            {course.last_played_at && (
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(course.last_played_at), 'd MMM yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Rating - aligned */}
          <div className="flex items-center pr-3">
            {isRated && course.rating_value ? (
              <RatingPill score={course.rating_value} className="text-[10px] px-2.5 py-0.5 h-6" />
            ) : isOwnProfile ? (
              <button 
                onClick={handleRateClick}
                className="text-[10px] font-medium hover:underline"
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

  // Unrated card - compact with muted styling (restored to proper size)
  if (isUnrated) {
    return (
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className="bg-muted/30 border border-border/40 rounded-xl overflow-hidden cursor-pointer hover:border-border/60 transition-colors"
      >
        <div className="flex">
          {/* Thumbnail - muted, standard size matching rated cards */}
          {course.thumbnail_image ? (
            <img
              src={course.thumbnail_image}
              alt={course.name}
              className="w-18 h-18 object-cover flex-shrink-0 opacity-75"
            />
          ) : (
            <div className="w-18 h-18 bg-muted flex-shrink-0" />
          )}

          {/* Content - normalized padding */}
          <div className="flex-1 py-2.5 px-3 flex flex-col justify-center min-w-0">
            <div className="font-medium text-sm text-foreground/80 truncate">{course.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {course.sub_country || course.country}
            </div>
            {course.last_played_at && (
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(course.last_played_at), 'd MMM yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Rate CTA */}
          {isOwnProfile && (
            <div className="flex items-center pr-3">
              <button 
                onClick={handleRateClick}
                className="text-[11px] text-muted-foreground hover:text-foreground font-medium px-2.5 py-1 bg-background border border-border rounded-lg hover:border-border/80 transition-colors"
              >
                Rate
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
      className="bg-card border border-border/40 rounded-xl overflow-hidden cursor-pointer hover:border-border/60 transition-colors"
    >
      <div className="flex">
        {/* Thumbnail */}
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            className="w-18 h-18 object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-18 h-18 bg-muted flex-shrink-0" />
        )}

        {/* Content - normalized padding */}
        <div className="flex-1 py-2.5 px-3 flex flex-col justify-center min-w-0">
          <div className="font-medium text-sm text-foreground truncate">{course.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {course.sub_country || course.country}
          </div>
          {course.last_played_at && (
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(course.last_played_at), 'd MMM yyyy')}
              </span>
            </div>
          )}
        </div>

        {/* Rating - aligned */}
        <div className="flex items-center pr-3">
          {course.rating_value && (
            <RatingPill score={course.rating_value} className="text-[10px] px-2.5 py-0.5 h-6" />
          )}
        </div>
      </div>
    </motion.div>
  );
};
