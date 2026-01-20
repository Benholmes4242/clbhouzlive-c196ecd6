/**
 * Step 2: Write Your Review
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface WriteStepProps {
  title: string;
  review: string;
  onTitleChange: (title: string) => void;
  onReviewChange: (review: string) => void;
}

const MAX_REVIEW_LENGTH = 4000;
const MAX_TITLE_LENGTH = 100;

export function WriteStep({
  title,
  review,
  onTitleChange,
  onReviewChange,
}: WriteStepProps) {
  const reviewLength = review.length;
  const isNearLimit = reviewLength > MAX_REVIEW_LENGTH * 0.9;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col min-h-0 overflow-hidden"
      style={{ padding: 'var(--wizard-spacing-md)', gap: 'var(--wizard-spacing-md)' }}
    >
      <div className="text-center shrink-0">
        <h2 className="text-lg font-semibold text-[#1e293b]">
          Share your experience
        </h2>
        <p className="text-sm text-[#64748b] mt-0.5">
          Help other golfers by describing what made this course special
        </p>
      </div>

      <div className="space-y-1 shrink-0">
        <label htmlFor="review-title" className="text-sm font-medium text-[#1e293b]">
          Review Title
        </label>
        <Input
          id="review-title"
          placeholder="Sum up your experience in a few words"
          value={title}
          onChange={(e) => onTitleChange(e.target.value.slice(0, MAX_TITLE_LENGTH))}
          className="w-full"
        />
        <p className="text-xs text-[#64748b] text-right">
          {title.length}/{MAX_TITLE_LENGTH}
        </p>
      </div>

      {/* Review Body - flex-1 to fill remaining space */}
      <div className="space-y-1 flex-1 flex flex-col min-h-0">
        <label htmlFor="review-body" className="text-sm font-medium text-[#1e293b]">
          Your Review
        </label>
        <Textarea
          id="review-body"
          placeholder="What did you love about this course? Any tips for other golfers?"
          value={review}
          onChange={(e) => onReviewChange(e.target.value.slice(0, MAX_REVIEW_LENGTH))}
          className="flex-1 min-h-[120px] resize-none"
        />
        <p className={cn(
          "text-xs text-right transition-colors",
          isNearLimit ? "text-destructive" : "text-[#64748b]"
        )}>
          {reviewLength}/{MAX_REVIEW_LENGTH}
        </p>
      </div>

      <p className="text-xs text-[#64748b] text-center shrink-0">
        This step is optional — you can skip it if you just want to rate the course
      </p>
    </motion.div>
  );
}
