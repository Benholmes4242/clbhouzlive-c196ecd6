/**
 * Success Screen after review submission
 * Two variants: 'standard' (skipped share) and 'shared' (posted to Clubhouse)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Eye, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

      {/* Success icon with pulse animation - Emerald green */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="mb-6 relative"
      >
        {/* Pulse ring - Amber */}
        <motion.div
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute inset-0 w-20 h-20 rounded-full bg-[#f59e0b]/20"
        />
        <div className="w-20 h-20 rounded-full bg-[#f59e0b]/10 flex items-center justify-center relative z-10">
          <CheckCircle2 className="h-10 w-10 text-[#f59e0b]" />
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
            ? 'Your review has been shared to your profile and the Clubhouse feed.'
            : `Your review has been added to ${course?.name || 'the course'}.`
          }
        </p>
      </motion.div>

      {/* Actions - 3-tier hierarchy: Primary (dark), Secondary (outline), Tertiary (ghost) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col w-full gap-3 max-w-xs"
      >
        {isShared ? (
          // Shared variant: View Post as primary
          <Button
            onClick={onViewPost}
            className="w-full h-12 gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-full"
          >
            <ExternalLink className="h-4 w-4" />
            View Post
          </Button>
        ) : (
          // Standard variant: View Review as primary
          <Button
            onClick={onViewReview}
            className="w-full h-12 gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-full"
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
