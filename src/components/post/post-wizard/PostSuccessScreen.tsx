// PostSuccessScreen - Celebratory success confirmation after posting
// Premium feel with confetti, animated checkmark, and post preview
import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, ArrowRight, Clock, ChevronRight, Flag } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { GolfCourse } from '@/components/post/create-moment/types';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';

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
  firstMediaUrl,
  firstMediaType = 'image',
  mediaCount = 0,
  onViewPost,
  onCreateAnother,
  onDone,
  taggedCourse,
  onLeaveReview,
  isBusinessActor = false,
}: PostSuccessScreenProps) {
  const { user } = useSupabaseSession();
  const [dismissed, setDismissed] = useState(false);
  const [courseThumbnail, setCourseThumbnail] = useState<string | null>(null);

  // Check if user already reviewed this course
  const { data: existingRating, isError: ratingCheckError } = useUserCourseRating(
    taggedCourse?.id,
    user?.id
  );

  // Fetch course thumbnail
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
  }, [taggedCourse?.id]);

  // Fire confetti on mount — amber/gold tones
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.65, x: 0.5 },
        colors: ['#fbbf24', '#f59e0b', '#fde68a', '#ffffff', '#d97706'],
        disableForReducedMotion: true,
      });
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 80,
          origin: { y: 0.55, x: 0.5 },
          colors: ['#fbbf24', '#f59e0b', '#fef3c7'],
          disableForReducedMotion: true,
        });
      }, 200);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const formatScheduledTime = useCallback((date: Date) => {
    const timeStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const tz = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
      .formatToParts(date)
      .find(p => p.type === 'timeZoneName')?.value || '';
    return tz ? `${timeStr} ${tz}` : timeStr;
  }, []);

  // Determine whether to show review prompt
  const hasBeenPrompted = taggedCourse
    ? localStorage.getItem(`clbhouz:reviewPromptDismissed:${taggedCourse.id}`) === 'true'
    : true;
  const hasExistingReview = !!existingRating;

  const showReviewPrompt = !!(
    taggedCourse &&
    !dismissed &&
    !hasBeenPrompted &&
    !hasExistingReview &&
    !ratingCheckError &&
    !isScheduled &&
    !isBusinessActor &&
    onLeaveReview
  );

  const handleLeaveReviewTap = useCallback(() => {
    if (!taggedCourse) return;
    // Set localStorage so we don't show again
    localStorage.setItem(`clbhouz:reviewPromptDismissed:${taggedCourse.id}`, 'true');
    onLeaveReview?.(taggedCourse);
  }, [taggedCourse, onLeaveReview]);

  const handleDismissReviewPrompt = useCallback(() => {
    if (taggedCourse) {
      localStorage.setItem(`clbhouz:reviewPromptDismissed:${taggedCourse.id}`, 'true');
    }
    setDismissed(true);
  }, [taggedCourse]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="light fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 pt-safe pb-safe"
      style={{ background: 'linear-gradient(to bottom, rgba(254,243,199,0.3), white, white)' }}
    >
      {/* Decorative background glow — amber */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(251, 191, 36, 0.08) 0%, transparent 60%)',
        }}
      />

      {/* Media thumbnail with success badge */}
      {firstMediaUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
          className="relative mb-6 z-10"
        >
          <div className="relative">
            <img
              src={firstMediaUrl}
              alt="Your post"
              className="w-20 h-20 rounded-2xl object-cover shadow-lg"
              style={{ boxShadow: '0 8px 32px -8px rgba(0,0,0,0.15)' }}
            />
            <div className="absolute inset-0 rounded-2xl" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
            }} />
          </div>
          {/* Success check overlay — amber */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.4 }}
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
          >
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          </motion.div>
          {mediaCount > 1 && (
            <div 
              className="absolute -top-1.5 -right-1.5 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
            >
              +{mediaCount - 1}
            </div>
          )}
        </motion.div>
      )}

      {/* Animated success icon (when no media) */}
      {!firstMediaUrl && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
          className="relative mb-6 z-10"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="absolute inset-0 w-20 h-20 rounded-full"
            style={{ background: 'rgba(251, 191, 36, 0.2)' }}
          />
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center relative z-10"
            style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))' }}
          >
            <Check className="h-10 w-10 text-amber-600" strokeWidth={2.5} />
          </div>
        </motion.div>
      )}

      {/* Success text */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-center mb-2 z-10"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-1.5">
          {isScheduled ? 'Scheduled!' : "You're live! 🎉"}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-[260px]">
          {isScheduled && scheduledAt
            ? `Your post will go live on ${formatScheduledTime(scheduledAt)}`
            : 'Your moment is out there — time to see the love roll in'}
        </p>
      </motion.div>

      {/* Subtle notification hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-1.5 mt-1 mb-10 z-10"
      >
        <Clock className="h-3 w-3 text-gray-400" />
        <span className="text-[11px] text-gray-400">We'll ping you when people interact</span>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="flex flex-col gap-3 w-full max-w-[280px] z-10"
      >
        {/* Primary - View Post — amber gradient */}
        {onViewPost && !isScheduled && (
          <button
            onClick={onViewPost}
            className="w-full h-12 rounded-xl text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              boxShadow: '0 4px 16px -4px rgba(245, 158, 11, 0.4)',
            }}
          >
            View Post
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        {/* Secondary - Create Another */}
        <button
          onClick={onCreateAnother}
          className="w-full h-12 rounded-xl bg-white text-gray-800 font-semibold text-[15px] flex items-center justify-center gap-2 border border-gray-200 shadow-sm active:scale-[0.97] transition-transform"
        >
          <Plus className="h-4 w-4" />
          Create Another
        </button>

        {/* Tertiary - Done */}
        <button
          onClick={onDone}
          className="w-full h-12 rounded-xl text-gray-500 font-medium text-[15px] active:bg-gray-100 transition-colors"
        >
          Done
        </button>
      </motion.div>

      {/* Review Prompt Card — appears after delay */}
      <AnimatePresence>
        {showReviewPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 200, damping: 20 }}
            className="w-full max-w-[280px] mt-6 z-10"
          >
            {/* Subtle divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-amber-200/40" />
              <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">
                One more thing
              </span>
              <div className="flex-1 h-px bg-amber-200/40" />
            </div>

            {/* Review prompt card */}
            <button
              onClick={handleLeaveReviewTap}
              className="w-full p-4 rounded-2xl bg-amber-50/80 border border-amber-200/50 text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start gap-3">
                {/* Course thumbnail or flag icon */}
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {courseThumbnail ? (
                    <img 
                      src={courseThumbnail} 
                      className="w-10 h-10 rounded-xl object-cover" 
                      alt=""
                    />
                  ) : (
                    <Flag className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    Rate {taggedCourse.name}?
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Help other golfers discover this course
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              </div>
            </button>

            {/* Dismiss link */}
            <button
              onClick={handleDismissReviewPrompt}
              className="w-full text-center mt-2 text-xs text-gray-400 py-1"
            >
              Not now
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default PostSuccessScreen;
