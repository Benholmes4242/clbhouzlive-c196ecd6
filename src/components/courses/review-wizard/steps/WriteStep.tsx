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
      className="shrink-0"
    >
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-lg font-semibold text-[#1e293b]">
          Share your experience
        </h2>
        <p className="text-sm text-[#64748b] mt-0.5">
          Help other golfers by describing what made this course special
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Review Title */}
        <div>
          <label htmlFor="review-title" className="text-sm font-medium text-[#1e293b] mb-1.5 block">
            Review Title
          </label>
          <Input
            id="review-title"
            placeholder="Sum up your experience in a few words"
            value={title}
            onChange={(e) => onTitleChange(e.target.value.slice(0, MAX_TITLE_LENGTH))}
            className="w-full"
          />
          <p className="text-xs text-[#64748b] text-right mt-1">
            {title.length}/{MAX_TITLE_LENGTH}
          </p>
        </div>

        {/* Your Review - explicit height */}
        <div>
          <label htmlFor="review-body" className="text-sm font-medium text-[#1e293b] mb-1.5 block">
            Your Review
          </label>
          <Textarea
            id="review-body"
            placeholder="What did you love about this course? What could be improved? Any tips for other golfers?"
            value={review}
            onChange={(e) => onReviewChange(e.target.value.slice(0, MAX_REVIEW_LENGTH))}
            rows={5}
            className="w-full resize-none"
            style={{ minHeight: '120px' }}
          />
          <p className={cn(
            "text-xs text-right mt-1 transition-colors",
            isNearLimit ? "text-destructive" : "text-[#64748b]"
          )}>
            {reviewLength}/{MAX_REVIEW_LENGTH}
          </p>
        </div>
      </div>

    </motion.div>
  );
}
