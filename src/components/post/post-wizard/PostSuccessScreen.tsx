// PostSuccessScreen - Minimal frosted overlay with auto-dismiss
import { useEffect, useState, useCallback } from 'react';
import { Check, Flag, ChevronRight } from 'lucide-react';
import type { GolfCourse } from '@/components/post/create-moment/types';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { getScoreTier } from '@/utils/getScoreTier';

interface PostSuccessScreenProps {
  isScheduled?: boolean;
  scheduledAt?: Date | null;
  firstMediaUrl?: string | null;
  firstMediaType?: 'image' | 'video';
  mediaCount?: number;
  onViewPost?: () => void;
  onCreateAnother: () => void;
  onDone: () => void;
  taggedCourse?: GolfCourse | null;
  onLeaveReview?: (course: GolfCourse) => void;
  isBusinessActor?: boolean;
}

export function PostSuccessScreen({
  isScheduled = false,
  scheduledAt,
  onDone,
  taggedCourse,
  onLeaveReview,
  isBusinessActor = false,
}: PostSuccessScreenProps) {
  const { user } = useSupabaseSession();
  const [visible, setVisible] = useState(false);
  const [courseThumbnail, setCourseThumbnail] = useState<string | null>(null);
  const [communityRating, setCommunityRating] = useState<number | null>(null);

  const { data: existingRating, isError: ratingCheckError } = useUserCourseRating(
    taggedCourse?.id,
    user?.id
  );

  // Fetch course data
  useEffect(() => {
    if (!taggedCourse?.id) return;
    supabase
      .from('golf_courses')
      .select('thumbnail_image')
      .eq('id', taggedCourse.id)
      .single()
      .then(({ data }) => {
        if (data?.thumbnail_image) setCourseThumbnail(data.thumbnail_image);
      });
    supabase
      .from('course_rating_aggregates')
      .select('avg_overall_score')
      .eq('course_id', taggedCourse.id)
      .single()
      .then(({ data }) => {
        if (data?.avg_overall_score) setCommunityRating(data.avg_overall_score);
      });
  }, [taggedCourse?.id]);

  // Animate in + auto-dismiss (only if no review prompt)
  const hasBeenPrompted = taggedCourse
    ? localStorage.getItem(`clbhouz:reviewPromptDismissed:${taggedCourse.id}`) === 'true'
    : true;
  const hasExistingReview = !!existingRating;
  const showReviewPrompt = !!(
    taggedCourse && !hasBeenPrompted && !hasExistingReview &&
    !ratingCheckError && !isScheduled && !isBusinessActor && onLeaveReview
  );

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    // Only auto-dismiss if no review prompt
    if (!showReviewPrompt) {
      const timer = setTimeout(onDone, 2200);
      return () => clearTimeout(timer);
    }
  }, [onDone, showReviewPrompt]);

  const handleLeaveReviewTap = useCallback(() => {
    if (!taggedCourse) return;
    localStorage.setItem(`clbhouz:reviewPromptDismissed:${taggedCourse.id}`, 'true');
    onLeaveReview?.(taggedCourse);
  }, [taggedCourse, onLeaveReview]);

  const ratingTier = communityRating ? getScoreTier(communityRating) : null;

  const formatScheduledTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex flex-col items-center justify-center transition-opacity duration-350"
      style={{
        background: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        opacity: visible ? 1 : 0,
      }}
      onClick={showReviewPrompt ? undefined : onDone}
    >
      <div
        className="flex flex-col items-center gap-4 transition-all duration-550 px-6"
        style={{
          transform: visible ? 'scale(1)' : 'scale(0.85)',
          opacity: visible ? 1 : 0,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDelay: '0.12s',
        }}
      >
        {/* Success ring */}
        <div
          className="w-[68px] h-[68px] rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, #f59e0b, #d97706)',
            boxShadow: '0 4px 30px rgba(245,158,11,0.30)',
          }}
        >
          <Check className="w-[30px] h-[30px] text-white" strokeWidth={3.2} />
        </div>

        <span className="text-[20px] font-semibold tracking-tight" style={{ color: '#1A1A1A' }}>
          {isScheduled ? 'Scheduled' : 'Posted'}
        </span>
        <span className="text-[14px] font-normal -mt-2" style={{ color: '#7A7A7A' }}>
          {isScheduled && scheduledAt
            ? `Goes live ${formatScheduledTime(scheduledAt)}`
            : 'Your clubhouse will see this'}
        </span>

        {/* Review prompt card */}
        {showReviewPrompt && (
          <button
            onClick={(e) => { e.stopPropagation(); handleLeaveReviewTap(); }}
            className="w-full max-w-[320px] mt-4 rounded-2xl px-5 py-4 text-left active:scale-[0.98] transition-transform overflow-hidden"
            style={{
              backgroundColor: '#1A1A1A',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
            }}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden ring-2 ring-white/30">
                {courseThumbnail ? (
                  <img src={courseThumbnail} className="w-14 h-14 rounded-xl object-cover" alt="" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                    <Flag className="w-6 h-6 text-white/80" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white leading-snug">
                  Rate {taggedCourse!.name}
                </p>
                {communityRating && ratingTier ? (
                  <p className="text-sm font-semibold text-white/80 mt-0.5">
                    Rated {communityRating.toFixed(1)} · {ratingTier.label.toUpperCase()}
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-white/80 mt-0.5">
                    Be the first to rate this course
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-white/70 flex-shrink-0" />
            </div>
          </button>
        )}

        {/* Done button when review prompt is showing */}
        {showReviewPrompt && (
          <button
            onClick={(e) => { e.stopPropagation(); onDone(); }}
            className="mt-2 text-[15px] font-medium active:opacity-60 transition-opacity"
            style={{ color: '#7A7A7A' }}
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

export default PostSuccessScreen;
