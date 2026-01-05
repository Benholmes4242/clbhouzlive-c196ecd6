import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GripVertical, Calendar } from 'lucide-react';
import { RatingPill } from '@/components/ui/RatingPill';
import { format } from 'date-fns';
import { TopTenCourse } from '@/hooks/useUserTopTenCourses';

interface FavouriteHeroCardProps {
  course: TopTenCourse;
  userRating?: number;
  lastPlayedAt?: string | null;
  isEditable: boolean;
  dragHandleProps?: {
    attributes: Record<string, any>;
    listeners: Record<string, any>;
  };
  isDragging?: boolean;
}

/**
 * Hero card for the #1 favourite course - larger, more cinematic display.
 */
export const FavouriteHeroCard: React.FC<FavouriteHeroCardProps> = ({
  course,
  userRating,
  lastPlayedAt,
  isEditable,
  dragHandleProps,
  isDragging,
}) => {
  const navigate = useNavigate();
  const isTop100 = !!(course.global_rank || course.regional_rank || course.usa_rank);
  
  const handleClick = () => {
    navigate(`/courses/${course.course_id}`);
  };

  return (
    <div
      className={`relative bg-white border border-slate-100 rounded-sq-md overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {/* Drag handle for edit mode */}
      {isEditable && dragHandleProps && (
        <div
          {...dragHandleProps.attributes}
          {...dragHandleProps.listeners}
          className="absolute top-3 left-3 z-10 cursor-grab active:cursor-grabbing bg-white/80 backdrop-blur-sm rounded-sq-xs p-1.5 shadow-sm"
        >
          <GripVertical className="h-4 w-4 text-slate-400" />
        </div>
      )}

      {/* Position badge */}
      <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
        <span className="text-sm font-bold text-slate-900">#1</span>
      </div>

      {/* Hero image */}
      <div className="aspect-[16/9] overflow-hidden" onClick={handleClick}>
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200" />
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex justify-between gap-3 items-start" onClick={handleClick}>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="font-semibold text-base text-slate-900 truncate">
            {course.name}
          </div>
          <div className="text-sm text-slate-500 truncate">
            {course.sub_country || course.country}
          </div>
          <div className="flex flex-wrap gap-2 text-xs mt-1.5">
            {isTop100 && (
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sq-pill font-medium">
                Top 100 Course
              </span>
            )}
            {lastPlayedAt && (
              <span className="flex items-center gap-1 text-slate-500">
                <Calendar className="w-3 h-3" />
                Last played {format(new Date(lastPlayedAt), 'd MMM yyyy')}
              </span>
            )}
          </div>
        </div>

        {/* Rating pill */}
        {userRating && userRating > 0 && (
          <RatingPill score={userRating} className="text-xs px-2.5 py-1 flex-shrink-0" />
        )}
      </div>
    </div>
  );
};
