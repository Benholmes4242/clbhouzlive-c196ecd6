/**
 * Success Screen — Amber-themed, matching Post Wizard success
 * Rating summary, confetti, radial glow
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
  isEditMode?: boolean;
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
  isEditMode = false,
  postId,
  onViewReview,
  onViewPost,
  onDone,
}: SuccessScreenProps) {
  const isShared = variant === 'shared';
  const tierData = rating ? getScoreTier(rating) : null;
  const isOutstanding = rating != null && rating >= 9.0;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: isEditMode ? 35 : (isShared ? 80 : 50),
        spread: isShared ? 70 : 60,
        origin: { y: 0.6 },
        colors: isShared
          ? ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff', '#64748b']
          : ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff'],
        disableForReducedMotion: true,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [isShared, isEditMode]);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex-1 flex flex-col items-center justify-center p-6 text-center"
      style={{ backgroundColor: '#FFFBEB', backgroundImage: 'linear-gradient(to bottom, rgba(254,243,199,0.3) 0%, rgba(254,243,199,0.2) 45%, white 75%, white 100%)' }}
    >
      {/* Close button */}
      <button
        onClick={onDone}
        className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-amber-100/80 flex items-center justify-center text-amber-700 hover:bg-amber-200/80 transition-colors active:scale-[0.97]"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Course thumbnail */}
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

      {/* Success icon with pulse rings */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
        className="mb-6 relative"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className={`absolute inset-0 w-20 h-20 rounded-full ${isOutstanding ? 'bg-amber-300/40' : 'bg-slate-300/40'}`}
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className={`absolute inset-0 w-20 h-20 rounded-full ${isOutstanding ? 'bg-amber-200/30' : 'bg-slate-200/30'}`}
        />
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
          {isShared ? 'Posted to Clubhouse!' : (isEditMode ? 'Review Updated!' : 'Review Saved!')}
        </h2>
        <p className="text-gray-500 max-w-xs mx-auto">
          {isShared 
            ? `Your review of ${course?.name || 'the course'} has been shared to your profile and the Clubhouse feed.`
            : isEditMode
              ? `Your review of ${course?.name || 'the course'} has been updated.`
              : `Your review of ${course?.name || 'the course'} has been saved.`
          }
        </p>
      </motion.div>

      {/* Rating summary */}
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
      {(rating == null || !tierData) && <div className="mb-8" />}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col w-full gap-3 max-w-xs"
      >
        {isShared ? (
          <button
            onClick={onViewPost}
            className="w-full h-12 gap-2 text-white font-semibold rounded-full active:scale-[0.97] transition-all duration-200 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
          >
            <ExternalLink className="h-4 w-4" />
            View Post
          </button>
        ) : (
          <button
            onClick={onViewReview}
            className="w-full h-12 gap-2 text-white font-semibold rounded-full active:scale-[0.97] transition-all duration-200 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
          >
            <Eye className="h-4 w-4" />
            View Review
          </button>
        )}
        
        <Button variant="ghost" onClick={onDone} className="w-full h-12 text-gray-500 hover:text-foreground">
          Done
        </Button>
      </motion.div>
    </motion.div>
  );
}
