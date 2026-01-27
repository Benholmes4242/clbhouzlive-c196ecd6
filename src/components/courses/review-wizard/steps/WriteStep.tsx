/**
 * Step 2: Write Your Review
 * Card-based inputs matching Post Wizard design with @mention support
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MentionBottomSheet, type MentionSuggestion } from '@/components/post/post-wizard/steps/MentionBottomSheet';

interface WriteStepProps {
  title: string;
  review: string;
  selectedTags: MentionSuggestion[];
  onTitleChange: (title: string) => void;
  onReviewChange: (review: string) => void;
  onTagsChange: (tags: MentionSuggestion[]) => void;
}

const MAX_REVIEW_LENGTH = 4000;
const MAX_TITLE_LENGTH = 100;

export function WriteStep({
  title,
  review,
  selectedTags,
  onTitleChange,
  onReviewChange,
  onTagsChange,
}: WriteStepProps) {
  const reviewLength = review.length;
  const isNearLimit = reviewLength > MAX_REVIEW_LENGTH * 0.9;
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isReviewFocused, setIsReviewFocused] = useState(false);
  const [showReviewTopFade, setShowReviewTopFade] = useState(false);
  
  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track scroll position to show/hide top fade
  const handleReviewScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    setShowReviewTopFade(target.scrollTop > 10);
  }, []);

  // Handle review change with mention detection
  const handleReviewChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, MAX_REVIEW_LENGTH);
    const cursor = e.target.selectionStart || 0;
    
    onReviewChange(value);
    setCursorPosition(cursor);
    
    // Detect @mention trigger
    const textBeforeCursor = value.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, [onReviewChange]);

  // Handle mention selection
  const handleMentionSelect = useCallback((mention: MentionSuggestion) => {
    const textBeforeCursor = review.slice(0, cursorPosition);
    const textAfterCursor = review.slice(cursorPosition);
    
    // Replace the @query with @username
    const beforeMention = textBeforeCursor.replace(/@\w*$/, '');
    const displayName = mention.username || mention.name;
    const newReview = `${beforeMention}@${displayName} ${textAfterCursor}`;
    
    onReviewChange(newReview);
    setShowMentions(false);
    setMentionQuery('');
    
    // Add to tags if not already present
    if (!selectedTags.some(t => t.id === mention.id)) {
      onTagsChange([...selectedTags, mention]);
    }
    
    // Refocus textarea
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [review, cursorPosition, selectedTags, onReviewChange, onTagsChange]);

  // Remove a tag
  const handleRemoveTag = useCallback((tagId: string) => {
    onTagsChange(selectedTags.filter(t => t.id !== tagId));
  }, [selectedTags, onTagsChange]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="shrink-0 px-4 pt-6"
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
              "bg-white border rounded-2xl p-3 shadow-sm transition-all duration-200",
              isTitleFocused 
                ? "border-border ring-2 ring-border/50" 
                : "border-border/60"
            )}
          >
            <input
              id="review-title"
              type="text"
              className="w-full text-base leading-relaxed bg-transparent placeholder:text-muted-foreground focus:outline-none"
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
              "bg-white border rounded-2xl p-3 relative shadow-sm transition-all duration-200",
              isReviewFocused 
                ? "border-border ring-2 ring-border/50" 
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
              ref={textareaRef}
              id="review-body"
              className="w-full text-base leading-relaxed resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none scrollbar-hide"
              style={{
                height: '160px',
                minHeight: '160px',
                overflowY: 'auto',
              }}
              placeholder="What did you love about this course? Type @ to tag someone"
              value={review}
              onChange={handleReviewChange}
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

        {/* Tagged users display */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Tagged:</span>
            {selectedTags.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
              >
                @{tag.username || tag.name}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="hover:text-primary/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Mention bottom sheet */}
      <MentionBottomSheet
        open={showMentions}
        onOpenChange={setShowMentions}
        query={mentionQuery}
        onSelect={handleMentionSelect}
      />
    </motion.div>
  );
}