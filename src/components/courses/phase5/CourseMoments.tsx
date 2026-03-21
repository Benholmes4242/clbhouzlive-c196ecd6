/**
 * CourseMoments - User's own media/content at this course
 * Phase 5: Emotional anchor, turns courses into chapters
 */
import React, { useMemo, useCallback } from 'react';
import { Camera, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserCourseMoments } from '@/hooks/useUserCourseMoments';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useMediaViewer } from '@/hooks/useMediaViewer';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

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
  const { user } = useSupabaseSession();
  const { openViewer } = useMediaViewer();

  // Build fullscreen items from moments
  const fullscreenItems = useMemo(() => {
    if (!moments?.length) return [];
    return moments.map((moment, index) => ({
      id: moment.id,
      postId: moment.id,
      mediaIndex: index,
      mediaUrl: moment.mediaUrl,
      mediaType: moment.mediaType as 'video' | 'image',
      posterUrl: moment.posterUrl,
      creatorId: user?.id || '',
      creatorName: 'Golfer',
      creatorUsername: '',
      creatorAvatar: undefined,
      likeCount: 0,
      commentCount: 0,
      courseName,
    }));
  }, [moments, user?.id, courseName]);

  const handleMomentTap = useCallback((index: number) => {
    if (fullscreenItems.length > 0) {
      openViewer(fullscreenItems, index);
    }
  }, [fullscreenItems, openViewer]);

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
        {moments.slice(0, 6).map((moment, index) => (
          <div
            key={moment.id}
            onClick={() => handleMomentTap(index)}
            className={cn(
              "relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden",
              "shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]",
              "ring-1 ring-black/5"
            )}
          >
            {moment.mediaType === 'video' ? (
              <>
                <img
                  src={moment.posterUrl || moment.mediaUrl}
                  alt="Video moment"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full liquid-glass flex items-center justify-center">
                    <Play className="w-2.5 h-2.5 text-white fill-white translate-x-[1px]" />
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
          <div
            onClick={() => handleMomentTap(6)}
            className="flex-shrink-0 w-20 h-20 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center ring-1 ring-black/5 cursor-pointer"
          >
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
