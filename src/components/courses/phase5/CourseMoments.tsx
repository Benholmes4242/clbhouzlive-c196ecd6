/**
 * CourseMoments - User's own media/content at this course
 * Phase 5: Emotional anchor, turns courses into chapters
 */
import React from 'react';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserCourseMoments } from '@/hooks/useUserCourseMoments';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface CourseMomentsProps {
  courseId: string;
  courseName: string;
  className?: string;
}

export const CourseMoments: React.FC<CourseMomentsProps> = ({
  courseId,
  courseName,
  className,
}) => {
  const { data: moments, isLoading } = useUserCourseMoments(courseId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-20 w-20 rounded-lg" />
          <Skeleton className="h-20 w-20 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!moments || moments.length === 0) {
    return null; // Don't show empty state, just hide
  }

  const handleAddMoment = () => {
    navigate(`/courses/${courseId}/rate`);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-base font-semibold text-foreground">Your Moments</h4>
        <span className="text-sm text-muted-foreground">({moments.length})</span>
      </div>

      {/* Gallery-style carousel */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {moments.slice(0, 6).map((moment) => (
          <div
            key={moment.id}
            className={cn(
              "relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden",
              "shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]",
              "ring-1 ring-black/5"
            )}
          >
            {moment.mediaType === 'video' ? (
              <>
                <video
                  src={moment.mediaUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-4 h-4 text-foreground ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </>
            ) : (
              <img
                src={moment.mediaUrl}
                alt="Course moment"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>
        ))}

        {/* Show more indicator */}
        {moments.length > 6 && (
          <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center ring-1 ring-black/5">
            <span className="text-white text-lg font-semibold">
              +{moments.length - 6}
            </span>
          </div>
        )}

        {/* Add moment button at end */}
        <button
          onClick={handleAddMoment}
          className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:border-muted-foreground hover:bg-muted transition-colors active:scale-[0.98]"
        >
          <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CourseMoments;
