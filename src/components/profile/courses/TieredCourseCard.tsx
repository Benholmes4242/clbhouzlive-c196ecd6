/**
 * TieredCourseCard - Visual hierarchy cards for All Courses Played
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
  // Optional own-rating breakdown fields used by the canonical sort comparator
  design_score?: number | null;
  condition_score?: number | null;
  clubhouse_score?: number | null;
  facilities_score?: number | null;
  review_date?: string | null;
}

interface TieredCourseCardProps {
  course: CourseCardData;
  isOwnProfile: boolean;
  onRateClick?: (courseId: string) => void;
}

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

  // Top 100 card
  if (isTop100) {
    return (
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className="relative rounded-xl overflow-hidden cursor-pointer transition-all group"
        style={{ background: '#ffffff', border: '1px solid rgba(247,147,30,0.30)' }}
      >
        <div 
          className="absolute top-0 left-0 right-0 h-[2px]" 
          style={{ background: 'linear-gradient(90deg, rgba(247,147,30,0.30) 0%, #F7931E 50%, rgba(247,147,30,0.30) 100%)' }} 
        />
        
        <div className="flex">
          <div className="relative flex-shrink-0 self-stretch">
            {course.thumbnail_image ? (
              <img
                src={course.thumbnail_image}
                alt={course.name}
                loading="lazy"
                decoding="async"
                className="w-24 h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-l-xl"
              />
            ) : (
              <div className="w-24 h-full bg-gradient-to-br from-muted to-muted/50 rounded-l-xl" />
            )}
            <div 
              className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: '#F7931E' }}
            >
              <Trophy className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="flex-1 py-2.5 px-3 flex flex-col justify-center min-w-0">
            <div className="font-semibold text-sm text-foreground leading-tight line-clamp-2 break-words">
              {course.name}
            </div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {course.sub_country || course.country}
            </div>
            {course.last_played_at && (
              <div className="flex items-center gap-1 mt-1.5 whitespace-nowrap">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(course.last_played_at), 'd MMM yyyy')}
                </span>
              </div>
            )}
          </div>

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
                className="text-[11px] font-medium hover:underline whitespace-nowrap"
                style={{ color: '#F7931E' }}
              >
                Review
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  }

  // Non-Top-100 unrated
  if (!isRated) {
    return (
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
        className="rounded-xl overflow-hidden cursor-pointer transition-colors"
        style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
      >
        <div className="flex">
          <div className="relative flex-shrink-0 self-stretch">
            {course.thumbnail_image ? (
              <img
                src={course.thumbnail_image}
                alt={course.name}
                loading="lazy"
                decoding="async"
                className="w-16 h-full object-cover opacity-80 rounded-l-xl"
              />
            ) : (
              <div className="w-16 h-full rounded-l-xl" style={{ background: 'rgba(15,23,42,0.04)' }} />
            )}
          </div>

          <div className="flex-1 py-2 px-2.5 flex flex-col justify-center min-w-0">
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

          {isOwnProfile && (
            <div className="flex items-center pr-2.5 pl-2 flex-shrink-0">
              <button 
                onClick={handleRateClick}
                className="text-[10px] font-medium px-2 py-1 rounded-md transition-colors whitespace-nowrap"
                style={{ background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.07)', color: '#94A3B8' }}
              >
                Review
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Standard rated non-Top-100 card
  return (
    <motion.div
      onClick={handleClick}
      whileTap={{ scale: 0.98 }}
      className="rounded-xl overflow-hidden cursor-pointer transition-colors"
      style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
    >
      <div className="flex">
        <div className="relative flex-shrink-0 self-stretch">
          {course.thumbnail_image ? (
            <img
              src={course.thumbnail_image}
              alt={course.name}
              loading="lazy"
              decoding="async"
              className="w-[72px] h-full object-cover rounded-l-xl"
            />
          ) : (
            <div className="w-[72px] h-full rounded-l-xl" style={{ background: 'rgba(15,23,42,0.04)' }} />
          )}
        </div>

        <div className="flex-1 py-2 px-2.5 flex flex-col justify-center min-w-0">
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
