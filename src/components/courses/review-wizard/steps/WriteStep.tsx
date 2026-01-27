/**
 * Step 2: Write Your Review
 * Card-based inputs matching Post Wizard design with @mention support
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
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
  const titleLength = title.length;
  const isNearLimit = reviewLength > MAX_REVIEW_LENGTH * 0.9;
  const isOverLimit = reviewLength > MAX_REVIEW_LENGTH;
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isReviewFocused, setIsReviewFocused] = useState(false);
  
  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle review change with mention detection
  const handleReviewChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;
    
    onReviewChange(value.slice(0, MAX_REVIEW_LENGTH));
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
    
    // Focus back on textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeMention.length + displayName.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 100);
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
        {/* Review Title - Card wrapper matching Post Wizard */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex flex-col rounded-2xl border bg-white transition-colors shadow-sm",
            isTitleFocused ? "border-primary ring-1 ring-primary/20" : "border-border"
          )}
        >
          <input
            id="review-title"
            type="text"
            className="w-full text-sm leading-relaxed bg-transparent placeholder:text-muted-foreground focus:outline-none p-4 text-foreground"
            placeholder="Sum up your experience in a few words"
            value={title}
            onChange={(e) => onTitleChange(e.target.value.slice(0, MAX_TITLE_LENGTH))}
            onFocus={() => setIsTitleFocused(true)}
            onBlur={() => setIsTitleFocused(false)}
            maxLength={MAX_TITLE_LENGTH}
          />
          {/* Footer with divider and counter */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Review headline
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {titleLength}/{MAX_TITLE_LENGTH}
            </span>
          </div>
        </motion.div>

        {/* Your Review - Card wrapper matching Post Wizard exactly */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={cn(
            "flex flex-col rounded-2xl border bg-white transition-colors shadow-sm",
            isReviewFocused ? "border-primary ring-1 ring-primary/20" : "border-border"
          )}
        >
          {/* Textarea - grows to fill available space */}
          <Textarea
            ref={textareaRef}
            id="review-body"
            value={review}
            onChange={handleReviewChange}
            onFocus={() => setIsReviewFocused(true)}
            onBlur={() => setIsReviewFocused(false)}
            placeholder="What's the story behind your round? Type @ to mention someone"
            className={cn(
              "min-h-[200px] flex-1 bg-transparent border-0 resize-none",
              "focus-visible:ring-0 focus-visible:outline-none",
              "placeholder:text-muted-foreground text-sm leading-relaxed p-4 text-foreground"
            )}
            maxLength={MAX_REVIEW_LENGTH + 100}
          />
          
          {/* Tagged entities chips */}
          {selectedTags.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground/60">Tagged:</span>
              {selectedTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleRemoveTag(tag.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors bg-primary/10 text-primary hover:bg-primary/20"
                >
                  @{(tag.username || tag.name).charAt(0).toUpperCase() + (tag.username || tag.name).slice(1)}
                  <X className="w-3 h-3 opacity-60 hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
          
          {/* Footer with divider - exact match to Post Wizard */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Use @ to tag people and businesses
            </span>
            <span className={cn(
              "text-xs tabular-nums",
              isOverLimit ? "text-destructive font-medium" :
              isNearLimit ? "text-amber-600" :
              "text-muted-foreground"
            )}>
              {reviewLength}/{MAX_REVIEW_LENGTH}
            </span>
          </div>
        </motion.div>
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