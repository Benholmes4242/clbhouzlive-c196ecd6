/**
 * Success Screen — Frosted glass + amber gradient checkmark
 * With opt-in Clubhouse share prompt
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Eye, ExternalLink, X } from 'lucide-react';
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
  onShareToClubhouse?: () => void;
  isSharing?: boolean;
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
  onShareToClubhouse,
  isSharing = false,
}: SuccessScreenProps) {
  const isShared = variant === 'shared';
  const tierData = rating ? getScoreTier(rating) : null;
  const [showShareBlock, setShowShareBlock] = useState(false);

  // Confetti on all success variants
  useEffect(() => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#F7931E', '#FBBC2E', '#ffffff', '#d97706'],
    });
  }, []);

  // Fade in share block after 700ms
  useEffect(() => {
    if (onShareToClubhouse && !isShared) {
      const timer = setTimeout(() => setShowShareBlock(true), 700);
      return () => clearTimeout(timer);
    }
  }, [onShareToClubhouse, isShared]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(40px) saturate(200%)',
      }}
    >
      {/* Close button */}
      <button
        onClick={onDone}
        className="absolute top-4 right-4 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-colors active:scale-[0.97]"
        style={{
          background: 'hsl(var(--muted) / 0.8)',
          border: '1.5px solid hsl(var(--border))',
        }}
        aria-label="Close"
      >
        <X className="h-5 w-5 text-foreground" />
      </button>

      {/* Amber gradient checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{
          background: 'linear-gradient(135deg, #F7931E, #FBBC2E)',
          boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
        }}
      >
        <Check className="w-10 h-10 text-white" strokeWidth={3} />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-bold text-foreground"
      >
        {isShared ? 'Your verdict is live' : (isEditMode ? 'Verdict updated' : 'Verdict saved')}
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-muted-foreground mt-2 text-center px-8"
      >
        {isShared 
          ? (course?.name || 'Your review')
          : isEditMode
            ? `Your updated take on ${course?.name || 'the course'} is live`
            : `Your take on ${course?.name || 'the course'} is on the record`
        }
      </motion.p>

      {/* Rating pill */}
      {rating != null && tierData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 px-5 py-2.5 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))',
            border: '1.5px solid rgba(245,158,11,0.2)',
          }}
        >
          <span className="text-xl font-bold" style={{ color: tierData.accent }}>
            {rating === 10 ? '10' : rating.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground ml-1">/10</span>
          <span className="text-sm text-muted-foreground ml-2">{tierData.label}</span>
        </motion.div>
      )}

      {/* Opt-in share block — fades in after 700ms */}
      {onShareToClubhouse && !isShared && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: showShareBlock ? 1 : 0, y: showShareBlock ? 0 : 12 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[340px] mt-7 rounded-2xl p-5"
          style={{ background: 'hsl(var(--muted) / 0.6)' }}
        >
          <p className="text-[15px] font-bold text-foreground text-center">
            Share to Clubhouse?
          </p>
          <p className="text-[13px] text-muted-foreground text-center mt-1">
            Post your verdict so friends can see it in their feed
          </p>
          <button
            type="button"
            onClick={onShareToClubhouse}
            disabled={isSharing}
            className="w-full mt-4 rounded-full text-[14px] font-semibold text-white active:scale-[0.97] transition-all min-h-[44px] flex items-center justify-center disabled:opacity-60"
            style={{ background: '#1C1C1E' }}
          >
            {isSharing ? 'Sharing…' : 'Share to Clubhouse'}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="w-full mt-2 rounded-full text-[13px] font-medium text-muted-foreground active:scale-[0.97] transition-all min-h-[36px] flex items-center justify-center"
          >
            Maybe later
          </button>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-3 mt-6"
      >
        {isShared ? (
          <button
            onClick={onViewPost}
            className="px-6 rounded-full text-sm font-semibold text-white active:scale-[0.97] transition-all min-h-[44px] flex items-center justify-center"
            style={{ background: '#1C1C1E' }}
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              View on clbhouz
            </span>
          </button>
        ) : (
          <button
            onClick={onViewReview}
            className="px-6 rounded-full text-sm font-semibold text-white active:scale-[0.97] transition-all min-h-[44px] flex items-center justify-center"
            style={{ background: '#1C1C1E' }}
          >
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View my review
            </span>
          </button>
        )}
        
        <button
          onClick={onDone}
          className="px-6 rounded-full text-sm font-semibold text-foreground active:scale-[0.97] transition-all min-h-[44px] flex items-center justify-center"
          style={{ border: '1.5px solid hsl(var(--border))' }}
        >
          Done
        </button>
      </motion.div>
    </motion.div>
  );
}
