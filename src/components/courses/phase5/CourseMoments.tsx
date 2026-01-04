/**
 * CourseMoments - User's own media/content at this course
 * Phase 5: Emotional anchor, turns courses into chapters
 */
import React from 'react';
import { Camera } from 'lucide-react';
import { VideoPlayIndicator } from '@/components/ui/VideoPlayIndicator';
import { cn } from '@/lib/utils';
import { useUserCourseMoments } from '@/hooks/useUserCourseMoments';
import { Skeleton } from '@/components/ui/skeleton';

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

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-slate-500" />
        <h4 className="text-sm font-medium text-slate-700">Your Moments</h4>
        <span className="text-xs text-slate-400">({moments.length})</span>
      </div>

      {/* Media grid */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {moments.slice(0, 6).map((moment) => (
          <div
            key={moment.id}
            className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-100"
          >
            {moment.mediaType === 'video' ? (
              <>
                <video
                  src={moment.mediaUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <VideoPlayIndicator size="md" />
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
          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center">
            <span className="text-sm font-medium text-slate-500">
              +{moments.length - 6}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseMoments;
