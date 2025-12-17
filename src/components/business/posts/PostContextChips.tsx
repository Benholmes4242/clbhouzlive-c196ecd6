/**
 * PostContextChips - Course/Review/Achievement chips between caption and media
 * Only renders when data exists
 */
import React from 'react';
import { MapPin, Star, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostContextChipsProps {
  courseId?: string | null;
  courseName?: string | null;
  reviewId?: string | null;
  achievementType?: string | null;
  onCourseClick?: (courseId: string) => void;
  onReviewClick?: (reviewId: string) => void;
}

export function PostContextChips({
  courseId,
  courseName,
  reviewId,
  achievementType,
  onCourseClick,
  onReviewClick,
}: PostContextChipsProps) {
  const hasAnyChip = courseName || reviewId || achievementType;
  
  if (!hasAnyChip) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {/* Course chip */}
      {courseName && (
        <button
          onClick={() => courseId && onCourseClick?.(courseId)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5",
            "rounded-full text-xs font-medium",
            "bg-emerald-50 text-emerald-700",
            "hover:bg-emerald-100 transition-colors",
            !courseId && "cursor-default"
          )}
          disabled={!courseId}
        >
          <MapPin className="h-3.5 w-3.5" />
          {courseName}
        </button>
      )}

      {/* Review chip */}
      {reviewId && (
        <button
          onClick={() => onReviewClick?.(reviewId)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5",
            "rounded-full text-xs font-medium",
            "bg-amber-50 text-amber-700",
            "hover:bg-amber-100 transition-colors"
          )}
        >
          <Star className="h-3.5 w-3.5" />
          Review posted
        </button>
      )}

      {/* Achievement chip */}
      {achievementType && (
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5",
            "rounded-full text-xs font-medium",
            "bg-purple-50 text-purple-700"
          )}
        >
          <Trophy className="h-3.5 w-3.5" />
          {achievementType}
        </div>
      )}
    </div>
  );
}

export default PostContextChips;
