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
  const [communityRating, setCommunityRating] = useState<number | null>(null);

  // Check if user already reviewed this course
  const { data: existingRating, isError: ratingCheckError } = useUserCourseRating(
    taggedCourse?.id,
    user?.id
  );

  // Fetch course thumbnail and community rating
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
    // Fetch community average rating
    supabase
      .from('course_rating_aggregates')
      .select('avg_overall_score')
      .eq('course_id', taggedCourse.id)
      .single()
      .then(({ data }) => {
        if (data?.avg_overall_score) setCommunityRating(data.avg_overall_score);
      });
  }, [taggedCourse?.id]);

  // Fire confetti on mount — amber/gold tones
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.65, x: 0.5 },
        colors: ['#94a3b8', '#64748b', '#cbd5e1', '#ffffff', '#475569'],
        disableForReducedMotion: true,
      });
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 80,
          origin: { y: 0.55, x: 0.5 },
          colors: ['#94a3b8', '#64748b', '#e2e8f0'],
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
    localStorage.setItem(`clbhouz:reviewPromptDismissed:${taggedCourse.id}`, 'true');
    onLeaveReview?.(taggedCourse);
  }, [taggedCourse, onLeaveReview]);

  // Community rating tier
  const ratingTier = communityRating ? getScoreTier(communityRating) : null;

  return (
    <div
      className="light flex-1 flex flex-col items-center justify-center p-6 pt-safe pb-safe relative"
      style={{ backgroundColor: 'transparent' }}
    >
      {/* Decorative background glow — neutral */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(148, 163, 184, 0.08) 0%, transparent 60%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center w-full"
      >

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
              className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-border/30"
              style={{ boxShadow: '0 8px 32px -8px rgba(0,0,0,0.12)' }}
            />
            <div className="absolute inset-0 rounded-2xl" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
            }} />
          </div>
          {/* Success check overlay */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.4 }}
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full flex items-center justify-center shadow-md bg-primary"
          >
            <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
          </motion.div>
          {mediaCount > 1 && (
            <div 
              className="absolute -top-1.5 -right-1.5 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center text-primary-foreground shadow-sm bg-primary"
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
            className="absolute inset-0 w-20 h-20 rounded-full bg-primary/10"
          />
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center relative z-10 bg-primary/10"
          >
            <Check className="h-10 w-10 text-primary" strokeWidth={2.5} />
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
        className="flex flex-col w-full max-w-[280px] z-10"
      >
        {/* Primary - View Post */}
        {onViewPost && !isScheduled && (
          <button
            onClick={onViewPost}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-md"
          >
            View Post
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        {/* Rate Course Card */}
        {showReviewPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="mt-3"
          >
            <button
              onClick={handleLeaveReviewTap}
              className="w-full rounded-2xl px-5 py-4 text-left active:scale-[0.98] transition-transform overflow-hidden bg-foreground"
              style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)' }}
            >
              <div className="flex items-center gap-3.5">
                {/* Course thumbnail */}
                <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden ring-2 ring-white/30">
                  {courseThumbnail ? (
                    <img
                      src={courseThumbnail}
                      className="w-14 h-14 rounded-xl object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                      <Flag className="w-6 h-6 text-white/80" />
                    </div>
                  )}
                </div>

                {/* Text stack */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-background leading-snug">
                    Rate {taggedCourse!.name}
                  </p>
                  {communityRating && ratingTier ? (
                    <>
                      <p className="text-sm font-semibold text-background/80 mt-0.5">
                        Rated {communityRating.toFixed(1)} · {ratingTier.label.toUpperCase()} by the community
                      </p>
                      <p className="text-xs text-background/50 mt-0.5">Share your verdict</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-background/80 mt-0.5">
                        Be the first to rate this course
                      </p>
                      <p className="text-xs text-background/50 mt-0.5">Help fellow golfers discover it</p>
                    </>
                  )}
                </div>

                {/* Chevron */}
                <ChevronRight className="w-5 h-5 text-background/70 flex-shrink-0" />
              </div>
            </button>
          </motion.div>
        )}

        {/* Secondary - Create Another */}
        <button
          onClick={onCreateAnother}
          className="w-full h-12 rounded-xl bg-white text-gray-800 font-semibold text-[15px] flex items-center justify-center gap-2 border border-border shadow-sm active:scale-[0.97] transition-transform mt-3"
        >
          <Plus className="h-4 w-4" />
          Create Another
        </button>

        {/* Tertiary - Done */}
        <button
          onClick={onDone}
          className="w-full h-12 rounded-xl text-gray-500 font-medium text-[15px] active:bg-gray-100 transition-colors mt-3"
        >
          Done
        </button>
      </motion.div>
      </motion.div>
    </div>
  );
}

export default PostSuccessScreen;
