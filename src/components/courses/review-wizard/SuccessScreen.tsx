/**
 * Success Screen — Frosted glass + amber gradient checkmark
 * Matches PostSuccessScreen aesthetic
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Eye, ExternalLink, X } from 'lucide-react';
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
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(40px) saturate(200%)',
      }}
    >
      {/* Close button */}
      <button
        onClick={onDone}
        className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-[0.97]"
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
          background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
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
        {isShared ? 'Shared to Clubhouse' : (isEditMode ? 'Review updated' : 'Review saved')}
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-muted-foreground mt-2 text-center px-8"
      >
        {isShared 
          ? 'Now live on Clubhouse'
          : isEditMode
            ? `Updated your verdict on ${course?.name || 'the course'}`
            : `Your verdict on ${course?.name || 'the course'} is live`
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
          <span className="text-xl font-bold" style={{ color: '#f59e0b' }}>
            {rating === 10 ? '10' : rating.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground ml-1">/10</span>
          <span className="text-sm text-muted-foreground ml-2">{tierData.label}</span>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-3 mt-8"
      >
        {isShared ? (
          <button
            onClick={onViewPost}
            className="px-6 py-3 rounded-full text-sm font-semibold text-white active:scale-[0.97] transition-all"
            style={{ background: '#1C1C1E' }}
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              View post
            </span>
          </button>
        ) : (
          <button
            onClick={onViewReview}
            className="px-6 py-3 rounded-full text-sm font-semibold text-white active:scale-[0.97] transition-all"
            style={{ background: '#1C1C1E' }}
          >
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View review
            </span>
          </button>
        )}
        
        <button
          onClick={onDone}
          className="px-6 py-3 rounded-full text-sm font-semibold text-foreground active:scale-[0.97] transition-all"
          style={{ border: '1.5px solid hsl(var(--border))' }}
        >
          Done
        </button>
      </motion.div>
    </motion.div>
  );
}
