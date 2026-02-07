// PostSuccessScreen - Celebratory success confirmation after posting
// Premium feel with confetti, animated checkmark, and post preview
import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface PostSuccessScreenProps {
  /** Whether the post was scheduled */
  isScheduled?: boolean;
  /** Scheduled time if applicable */
  scheduledAt?: Date | null;
  /** Preview URL of the first media item */
  firstMediaUrl?: string | null;
  /** Type of the first media item */
  firstMediaType?: 'image' | 'video';
  /** Total number of media items */
  mediaCount?: number;
  /** Callback to view the post */
  onViewPost?: () => void;
  /** Callback to create another post */
  onCreateAnother: () => void;
  /** Callback to close the wizard */
  onDone: () => void;
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
}: PostSuccessScreenProps) {
  // Fire confetti on mount with golf-themed colors
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#ffffff', '#fbbf24'],
        disableForReducedMotion: true,
      });
    }, 300);
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
    // Append timezone abbreviation
    const tz = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
      .formatToParts(date)
      .find(p => p.type === 'timeZoneName')?.value || '';
    return tz ? `${timeStr} ${tz}` : timeStr;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      className="light fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 pt-safe pb-safe"
    >
      {/* Post thumbnail preview */}
      {firstMediaUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0 }}
          className="relative mb-5"
        >
          <img
            src={firstMediaUrl}
            alt="Your post"
            className="w-16 h-16 rounded-xl object-cover shadow-md"
          />
          {mediaCount > 1 && (
            <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
              +{mediaCount - 1}
            </div>
          )}
        </motion.div>
      )}

      {/* Success icon with double-pulse rings */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.15,
        }}
        className="relative mb-8"
      >
        {/* First pulse ring */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="absolute inset-0 w-20 h-20 rounded-full bg-emerald-300/40"
        />
        {/* Second pulse ring (staggered) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="absolute inset-0 w-20 h-20 rounded-full bg-emerald-200/30"
        />
        {/* Main icon circle */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center relative z-10">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
      </motion.div>

      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-2"
      >
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {isScheduled ? 'Scheduled!' : 'Posted!'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isScheduled && scheduledAt
            ? `Your post will go live on ${formatScheduledTime(scheduledAt)}`
            : 'Your moment is now live on Clbhouz'}
        </p>
      </motion.div>

      {/* Engagement prompt */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-[12px] text-muted-foreground/60 text-center mb-10"
      >
        We'll notify you when people interact with your moment
      </motion.p>

      {/* Action buttons - 3-tier hierarchy */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col gap-3 w-full max-w-[280px]"
      >
        {/* Primary action - View Post */}
        {onViewPost && !isScheduled && (
          <Button
            onClick={onViewPost}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium border-0"
          >
            View Post
          </Button>
        )}

        {/* Secondary action - Create Another */}
        <Button
          variant="outline"
          onClick={onCreateAnother}
          className="w-full h-12 rounded-xl gap-2 font-medium"
        >
          <Plus className="h-4 w-4" />
          Create Another
        </Button>

        {/* Tertiary action - Done */}
        <Button
          variant="ghost"
          onClick={onDone}
          className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground font-medium"
        >
          Done
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default PostSuccessScreen;
