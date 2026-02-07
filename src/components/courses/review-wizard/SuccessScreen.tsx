/**
 * Success Screen after review submission
 * Two variants: 'standard' (skipped share) and 'shared' (posted to Clubhouse)
 * Amber-themed confetti celebration with double-pulse ring animation
 * 
 * Review-specific: shows rating summary, course thumbnail, smart button labels
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Eye, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { getScoreTier } from '@/utils/getScoreTier';
import type { ReviewWizardCourse, SuccessVariant } from './types';

interface SuccessScreenProps {
  variant: SuccessVariant;
  course: ReviewWizardCourse | null;
  ratingId: string;
  rating?: number | null;
  postId?: string;
  onViewReview?: () => void;
  onViewPost?: () => void;
  onDone: () => void;
}

export function SuccessScreen({
  variant,
  course,
  ratingId,
  rating,
  postId,
  onViewReview,
  onViewPost,
  onDone,
}: SuccessScreenProps) {
  const isShared = variant === 'shared';
  const tierData = rating ? getScoreTier(rating) : null;
  const isOutstanding = rating != null && rating >= 9.0;
  
  // Fire confetti on mount — more celebratory for shared, subdued for saved
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: isShared ? 80 : 50,
        spread: isShared ? 70 : 60,
        origin: { y: 0.6 },
        colors: isShared
          ? ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff', '#64748b']
          : ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff'],
        disableForReducedMotion: true,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [isShared]);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex-1 flex flex-col items-center justify-center p-6 text-center bg-background"
    >
      {/* Close button */}
      <button
        onClick={onDone}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Course thumbnail — visual anchor */}
      {course?.thumbnail_image && (
        <motion.img
          src={course.thumbnail_image}
          alt={course.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="w-14 h-14 rounded-xl object-cover shadow-md mb-4"
        />
      )}

      {/* Success icon with double-pulse rings — tier-aware: amber for Outstanding, slate for rest */}
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
          className={`absolute inset-0 w-20 h-20 rounded-full ${isOutstanding ? 'bg-amber-300/40' : 'bg-slate-300/40'}`}
        />
        {/* Second pulse ring (staggered) */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className={`absolute inset-0 w-20 h-20 rounded-full ${isOutstanding ? 'bg-amber-200/30' : 'bg-slate-200/30'}`}
        />
        {/* Main icon circle */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center relative z-10 ${isOutstanding ? 'bg-amber-100' : 'bg-slate-100'}`}>
          <CheckCircle2 className={`h-10 w-10 ${isOutstanding ? 'text-amber-500' : 'text-slate-500'}`} />
        </div>
      </motion.div>

      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2 mb-3"
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

      {/* Rating summary — the defining output of the review flow */}
      {rating != null && tierData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="mb-8"
        >
          <span className={`text-lg ${isOutstanding ? 'font-bold text-amber-500' : 'font-semibold text-slate-600'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {rating === 10 ? '10' : rating.toFixed(1)}
          </span>
          <span className={`text-lg mx-1.5 ${isOutstanding ? 'font-bold text-amber-500' : 'font-semibold text-slate-600'}`}>·</span>
          <span className={`text-lg uppercase tracking-wide ${isOutstanding ? 'font-bold text-amber-500' : 'font-semibold text-slate-600'}`}>
            {tierData.label}
          </span>
        </motion.div>
      )}
      {/* Fallback spacer when no rating */}
      {(rating == null || !tierData) && <div className="mb-8" />}

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
            className="w-full h-12 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full active:scale-[0.97] transition-all duration-200"
          >
            <ExternalLink className="h-4 w-4" />
            View Post
          </Button>
        ) : (
          <Button
            onClick={onViewReview}
            className="w-full h-12 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full active:scale-[0.97] transition-all duration-200"
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
