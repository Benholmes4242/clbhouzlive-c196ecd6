/**
 * PostSuccessScreen – Celebratory confirmation after posting
 * 
 * The payoff moment of the entire creation flow. Designed to feel
 * rewarding and premium — animated checkmark, controlled confetti,
 * brand-colored palette, and clear 3-tier action hierarchy.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, Eye, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Confetti from 'react-confetti';
import { haptic } from '@/utils/haptics';

interface PostSuccessScreenProps {
  /** Whether the post was scheduled */
  isScheduled?: boolean;
  /** Scheduled time if applicable */
  scheduledAt?: Date | null;
  /** Callback to view the post */
  onViewPost?: () => void;
  /** Callback to create another post */
  onCreateAnother: () => void;
  /** Callback to close the wizard */
  onDone: () => void;
}

// Brand-aligned confetti palette (emerald/chartreus from design system)
const CONFETTI_COLORS = ['#334E3D', '#4CAF6E', '#C1A84C', '#E5D0A1', '#B8C6C9', '#FFFFFF'];

export function PostSuccessScreen({
  isScheduled = false,
  scheduledAt,
  onViewPost,
  onCreateAnother,
  onDone,
}: PostSuccessScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    haptic('medium');
    const timer = setTimeout(() => setShowConfetti(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  const formatScheduledTime = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="light fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 pt-safe pb-safe"
    >
      {/* Controlled confetti — brand colors, short burst, not childish */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[10000]" style={{ overflow: 'hidden' }}>
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            numberOfPieces={isScheduled ? 12 : 24}
            recycle={false}
            run={showConfetti}
            gravity={0.12}
            initialVelocityX={{ min: -5, max: 5 }}
            initialVelocityY={{ min: -10, max: -3 }}
            confettiSource={{
              x: window.innerWidth / 2,
              y: window.innerHeight * 0.38,
              w: 80,
              h: 10,
            }}
            colors={CONFETTI_COLORS}
            opacity={0.85}
            tweenDuration={700}
            drawShape={(ctx) => {
              const shape = Math.random();
              ctx.beginPath();
              if (shape < 0.4) {
                ctx.arc(0, 0, 3.5, 0, 2 * Math.PI);
              } else if (shape < 0.7) {
                ctx.fillRect(-2, -4, 4, 8);
              } else {
                // small diamond
                ctx.moveTo(0, -4);
                ctx.lineTo(3, 0);
                ctx.lineTo(0, 4);
                ctx.lineTo(-3, 0);
                ctx.closePath();
              }
              ctx.fill();
            }}
          />
        </div>
      )}

      {/* Animated success icon */}
      <div className="relative mb-8">
        {/* Expanding ring pulse */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
          className="absolute inset-0 w-[88px] h-[88px] rounded-full bg-primary/20"
        />
        {/* Second ring pulse (staggered) */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0.4 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: 'easeOut' }}
          className="absolute inset-0 w-[88px] h-[88px] rounded-full bg-primary/15"
        />

        {/* Icon disc */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 18,
            delay: 0.08,
          }}
          className="relative z-10 w-[88px] h-[88px] rounded-full bg-primary flex items-center justify-center shadow-lg"
          style={{ boxShadow: '0 8px 32px rgba(51, 78, 61, 0.3)' }}
        >
          {/* Animated checkmark — draws in with stroke */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.25 }}
          >
            <Check className="h-11 w-11 text-primary-foreground" strokeWidth={3} />
          </motion.div>
        </motion.div>
      </div>

      {/* Title & subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.35 }}
        className="text-center mb-3"
      >
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          {isScheduled ? 'Scheduled!' : 'Posted!'}
        </h2>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.3 }}
        className="text-[15px] text-muted-foreground text-center mb-1 max-w-[260px] leading-relaxed"
      >
        {isScheduled && scheduledAt
          ? `Your post will go live on ${formatScheduledTime(scheduledAt)}`
          : 'Your moment has been shared on Clbhouz'}
      </motion.p>

      {/* Engagement nudge */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="text-xs text-muted-foreground/70 text-center mb-10 max-w-[240px]"
      >
        {isScheduled
          ? "We'll remind you when it goes live"
          : "We'll notify you when people interact with it"}
      </motion.p>

      {/* Action buttons — proper 3-tier hierarchy */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.35 }}
        className="flex flex-col gap-3 w-full max-w-[280px]"
      >
        {/* Primary: View Post — brand emerald */}
        {onViewPost && !isScheduled && (
          <Button
            onClick={onViewPost}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-[15px] gap-2"
          >
            <Eye className="h-4 w-4" />
            View Post
          </Button>
        )}

        {/* Primary for scheduled: shows scheduled time */}
        {isScheduled && scheduledAt && (
          <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/8 border border-primary/15">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {formatScheduledTime(scheduledAt)}
            </span>
          </div>
        )}

        {/* Secondary: Create Another */}
        <Button
          variant="outline"
          onClick={onCreateAnother}
          className="w-full h-12 rounded-xl gap-2 font-medium text-[15px] border-border"
        >
          <Plus className="h-4 w-4" />
          Create Another
        </Button>

        {/* Tertiary: Done */}
        <Button
          variant="ghost"
          onClick={onDone}
          className="w-full h-10 rounded-xl text-muted-foreground hover:text-foreground font-medium text-sm"
        >
          Done
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default PostSuccessScreen;
