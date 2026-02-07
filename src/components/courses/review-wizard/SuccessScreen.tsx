/**
 * Success Screen after review submission
 * Two variants: 'standard' (skipped share) and 'shared' (posted to Clubhouse)
 * Amber-themed confetti celebration with double-pulse ring animation
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Eye, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import type { ReviewWizardCourse, SuccessVariant } from './types';

interface SuccessScreenProps {
  variant: SuccessVariant;
  course: ReviewWizardCourse | null;
  ratingId: string;
  postId?: string;
  onViewReview?: () => void;
  onViewPost?: () => void;
  onDone: () => void;
}

export function SuccessScreen({
  variant,
  course,
  ratingId,
  postId,
  onViewReview,
  onViewPost,
  onDone,
}: SuccessScreenProps) {
  const isShared = variant === 'shared';
  
  // Fire amber-themed confetti on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff', '#10b981'],
        disableForReducedMotion: true,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex-1 flex flex-col items-center justify-center p-6 text-center"
    >
      {/* Close button */}
      <button
        onClick={onDone}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Success icon with double-pulse rings — amber theme */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
        className="mb-6 relative"
      >
        {/* First pulse ring */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="absolute inset-0 w-20 h-20 rounded-full bg-amber-300/40"
        />
        {/* Second pulse ring (staggered) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="absolute inset-0 w-20 h-20 rounded-full bg-amber-200/30"
        />
        {/* Main icon circle */}
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center relative z-10">
          <CheckCircle2 className="h-10 w-10 text-amber-500" />
        </div>
      </motion.div>

      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2 mb-8"
      >
        <h2 className="text-xl font-semibold text-foreground">
          {isShared ? 'Posted to Clubhouse!' : 'Review Saved!'}
        </h2>
        <p className="text-muted-foreground max-w-xs mx-auto">
          {isShared 
            ? `Your review of ${course?.name || 'the course'} has been shared to your profile and the Clubhouse feed.`
            : `Your review of ${course?.name || 'the course'} has been saved.`
          }
        </p>
      </motion.div>

      {/* Actions - Primary (brand), Secondary (ghost) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col w-full gap-3 max-w-xs"
      >
        {isShared ? (
          <Button
            onClick={onViewPost}
            className="w-full h-12 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
          >
            <ExternalLink className="h-4 w-4" />
            View Post
          </Button>
        ) : (
          <Button
            onClick={onViewReview}
            className="w-full h-12 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
          >
            <Eye className="h-4 w-4" />
            View Review
          </Button>
        )}
        
        {/* Done button - ghost style */}
        <Button
          variant="ghost"
          onClick={onDone}
          className="w-full h-12 text-muted-foreground hover:text-foreground"
        >
          Done
        </Button>
      </motion.div>
    </motion.div>
  );
}