/**
 * Step 2: Write Your Review
 * Matches Create Moment modal input styling exactly
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
  const titleRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<HTMLTextAreaElement>(null);
  const [showTitleTopFade, setShowTitleTopFade] = useState(false);
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

      {/* Form Fields - matches Create Moment exactly */}
      <div className="space-y-3">
        {/* Review Title - edge to edge with 6px gap */}
        <div>
          <label htmlFor="review-title" className="text-sm font-medium text-[#1e293b] mb-1.5 block px-1">
            Review Title
          </label>
          <div 
            className="py-4 relative mx-auto"
            style={{ background: '#f1f5f9', width: 'calc(100% - 12px)', paddingLeft: '16px', paddingRight: '16px', borderRadius: '0px' }}
          >
            <input
              ref={titleRef}
              id="review-title"
              type="text"
              className="w-full text-base leading-relaxed resize-none bg-transparent placeholder:text-[#64748b] scrollbar-hide"
              style={{
                border: 'none',
                color: title ? '#1e293b' : '#64748b',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
                WebkitAppearance: 'none',
              }}
              placeholder="Sum up your experience in a few words"
              value={title}
              onChange={(e) => onTitleChange(e.target.value.slice(0, MAX_TITLE_LENGTH))}
              maxLength={MAX_TITLE_LENGTH}
            />
          </div>
          <p className="text-xs text-[#64748b] text-right mt-1 px-1">
            {title.length}/{MAX_TITLE_LENGTH}
          </p>
        </div>

        {/* Your Review - edge to edge with 6px gap, internal scroll */}
        <div>
          <label htmlFor="review-body" className="text-sm font-medium text-[#1e293b] mb-1.5 block px-1">
            Your Review
          </label>
          <div 
            className="py-4 relative mx-auto"
            style={{ background: '#f1f5f9', width: 'calc(100% - 12px)', paddingLeft: '16px', paddingRight: '16px', borderRadius: '0px' }}
          >
            {/* Top fade gradient - shows when scrolled */}
            <div 
              className="absolute top-4 left-4 right-4 h-6 pointer-events-none z-10 transition-opacity duration-200"
              style={{
                background: 'linear-gradient(to bottom, #f1f5f9 0%, transparent 100%)',
                opacity: showReviewTopFade ? 1 : 0,
              }}
            />
            <textarea
              ref={reviewRef}
              id="review-body"
              className="w-full text-base leading-relaxed resize-none bg-transparent placeholder:text-[#64748b] scrollbar-hide"
              style={{
                border: 'none',
                color: review ? '#1e293b' : '#64748b',
                height: '120px',
                maxHeight: '120px',
                overflowY: 'auto',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
                WebkitAppearance: 'none',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              placeholder="What did you love about this course? What could be improved? Any tips for other golfers?"
              value={review}
              onChange={(e) => onReviewChange(e.target.value.slice(0, MAX_REVIEW_LENGTH))}
              onScroll={handleReviewScroll}
              maxLength={MAX_REVIEW_LENGTH}
            />
          </div>
          <p className={cn(
            "text-xs text-right mt-1 px-1 transition-colors",
            isNearLimit ? "text-destructive" : "text-[#64748b]"
          )}>
            {reviewLength}/{MAX_REVIEW_LENGTH}
          </p>
        </div>
      </div>

    </motion.div>
  );
}