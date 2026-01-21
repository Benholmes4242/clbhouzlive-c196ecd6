/**
 * Step 2: Write Your Review
 * Card-based inputs matching Post Wizard design
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isReviewFocused, setIsReviewFocused] = useState(false);
  const [showReviewTopFade, setShowReviewTopFade] = useState(false);

  // Track scroll position to show/hide top fade
  const handleReviewScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    setShowReviewTopFade(target.scrollTop > 10);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="shrink-0 px-4"
    >
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-lg font-semibold text-foreground">
          Share your experience
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Help other golfers by describing what made this course special
        </p>
      </div>

      {/* Form Fields - Card pattern matching Post Wizard */}
      <div className="space-y-4">
        {/* Review Title - Card wrapper */}
        <div>
          <label htmlFor="review-title" className="text-sm font-medium text-foreground mb-2 block">
            Review Title
          </label>
          <div 
            className={cn(
              "bg-white border rounded-2xl p-3 transition-all duration-200",
              isTitleFocused 
                ? "border-[#e2e8f0] ring-2 ring-[#e2e8f0]/50" 
                : "border-border/60"
            )}
          >
            <input
              id="review-title"
              type="text"
              className="w-full text-base leading-relaxed bg-transparent placeholder:text-muted-foreground/70 focus:outline-none"
              placeholder="Sum up your experience in a few words"
              value={title}
              onChange={(e) => onTitleChange(e.target.value.slice(0, MAX_TITLE_LENGTH))}
              onFocus={() => setIsTitleFocused(true)}
              onBlur={() => setIsTitleFocused(false)}
              maxLength={MAX_TITLE_LENGTH}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right mt-1.5">
            {title.length}/{MAX_TITLE_LENGTH}
          </p>
        </div>

        {/* Your Review - Card wrapper with internal scroll */}
        <div>
          <label htmlFor="review-body" className="text-sm font-medium text-foreground mb-2 block">
            Your Review
          </label>
          <div 
            className={cn(
              "bg-white border rounded-2xl p-3 relative transition-all duration-200",
              isReviewFocused 
                ? "border-[#e2e8f0] ring-2 ring-[#e2e8f0]/50" 
                : "border-border/60"
            )}
          >
            {/* Top fade gradient - shows when scrolled */}
            <div 
              className="absolute top-3 left-3 right-3 h-6 pointer-events-none z-10 transition-opacity duration-200 rounded-t-xl"
              style={{
                background: 'linear-gradient(to bottom, white 0%, transparent 100%)',
                opacity: showReviewTopFade ? 1 : 0,
              }}
            />
            <textarea
              id="review-body"
              className="w-full text-base leading-relaxed resize-none bg-transparent placeholder:text-muted-foreground/70 focus:outline-none scrollbar-hide"
              style={{
                height: '120px',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
              placeholder="What did you love about this course? What could be improved? Any tips for other golfers?"
              value={review}
              onChange={(e) => onReviewChange(e.target.value.slice(0, MAX_REVIEW_LENGTH))}
              onScroll={handleReviewScroll}
              onFocus={() => setIsReviewFocused(true)}
              onBlur={() => setIsReviewFocused(false)}
              maxLength={MAX_REVIEW_LENGTH}
            />
          </div>
          {/* Helper row */}
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-muted-foreground/70">
              Help other golfers decide
            </p>
            <p className={cn(
              "text-xs transition-colors",
              isNearLimit ? "text-destructive" : "text-muted-foreground"
            )}>
              {reviewLength}/{MAX_REVIEW_LENGTH}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
