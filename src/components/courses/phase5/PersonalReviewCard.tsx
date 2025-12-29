/**
 * PersonalReviewCard - User's own review display (calm, reflective)
 * Phase 5: Memory-focused, not performative
 */
import React, { useState } from 'react';
import { Star, Edit3, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserCourseRating } from '@/hooks/useUserCourseRating';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// ReviewText component with line clamping and "Read more"
const ReviewText: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const needsClamp = text.length > 180;
  
  return (
    <div className="pt-3 border-t border-slate-100">
      <p className={cn(
        "text-sm text-slate-600 leading-relaxed italic",
        !expanded && needsClamp && "line-clamp-3"
      )}>
        "{text}"
      </p>
      {needsClamp && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
};

interface PersonalReviewCardProps {
  courseId: string;
  rating: UserCourseRating;
  className?: string;
}

export const PersonalReviewCard: React.FC<PersonalReviewCardProps> = ({
  courseId,
  rating,
  className,
}) => {
  const navigate = useNavigate();

  const handleEditClick = () => {
    navigate(`/courses/${courseId}/rate`);
  };

  // Format the date with "Played on" prefix
  const dateValue = rating.updated_at || rating.created_at;
  const dateLabel = `Played on ${format(new Date(dateValue), 'MMM d, yyyy')}`;

  // Calculate average of sub-scores if available
  const subScores = [
    rating.design_score,
    rating.condition_score,
    rating.clubhouse_score,
    rating.facilities_score,
  ].filter((s): s is number => s !== null);

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900">Your Rating</h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3 w-3" />
            <span>{dateLabel}</span>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEditClick}
          className="text-slate-500 hover:text-slate-700 -mr-2"
        >
          <Edit3 className="h-4 w-4 mr-1.5" />
          Edit
        </Button>
      </div>

      {/* Overall rating */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-5 w-5",
                star <= Math.round(rating.rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-200"
              )}
            />
          ))}
        </div>
        <span className="text-lg font-semibold text-slate-900">
          {rating.rating.toFixed(1)}
        </span>
      </div>

      {/* Sub-scores if available */}
      {subScores.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          {rating.design_score !== null && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Design</p>
              <p className="text-sm font-medium text-slate-700">{rating.design_score}/5</p>
            </div>
          )}
          {rating.condition_score !== null && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Condition</p>
              <p className="text-sm font-medium text-slate-700">{rating.condition_score}/5</p>
            </div>
          )}
          {rating.clubhouse_score !== null && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Clubhouse</p>
              <p className="text-sm font-medium text-slate-700">{rating.clubhouse_score}/5</p>
            </div>
          )}
          {rating.facilities_score !== null && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Facilities</p>
              <p className="text-sm font-medium text-slate-700">{rating.facilities_score}/5</p>
            </div>
          )}
        </div>
      )}

      {/* Review text with line clamping */}
      {rating.review && (
        <ReviewText text={rating.review} />
      )}
    </div>
  );
};

export default PersonalReviewCard;