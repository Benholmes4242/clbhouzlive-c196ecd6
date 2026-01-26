/**
 * Success Screen after review submission
 * Two variants: 'standard' (skipped share) and 'shared' (posted to Clubhouse)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Eye, ExternalLink } from 'lucide-react';
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
      className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-[#e2e8f0] flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
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

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col w-full gap-3 max-w-xs"
      >
        {isShared ? (
          // Shared variant: View Post button
          <Button
            variant="outline"
            onClick={onViewPost}
            className="w-full gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Post
          </Button>
        ) : (
          // Standard variant: View Review button
          <Button
            variant="outline"
            onClick={onViewReview}
            className="w-full gap-2"
          >
            <Eye className="h-4 w-4" />
            View Review
          </Button>
        )}
        
        {/* Done button */}
        <Button
          onClick={onDone}
          className="w-full"
        >
          Done
        </Button>
      </motion.div>
    </motion.div>
  );
}
