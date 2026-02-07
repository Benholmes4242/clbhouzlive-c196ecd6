/**
 * Step 2: Write Your Review (The Verdict)
 * Card-based inputs with @mention support, prompt chips, auto-expanding textarea
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const PROMPT_CHIPS = [
  { label: 'Course highlights', insert: 'Course highlights:\n' },
  { label: 'Conditions', insert: 'Conditions:\n' },
  { label: 'Memorable holes', insert: 'Memorable holes:\n' },
  { label: 'Value for money', insert: 'Value for money:\n' },
  { label: 'Tips for visitors', insert: 'Tips for visitors:\n' },
];

// Character counter threshold percentages
const TITLE_WARN_THRESHOLD = 80; // 80%
const TITLE_DANGER_THRESHOLD = 95; // 95%
const REVIEW_WARN_THRESHOLD = 0.8; // 80%
const REVIEW_DANGER_THRESHOLD = 0.95; // 95%

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
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isReviewFocused, setIsReviewFocused] = useState(false);
  
  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea as user types
  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`;
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [review, autoResize]);

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

  // Insert a prompt chip as section header
  const handlePromptChipClick = useCallback((insert: string) => {
    const newReview = review + insert;
    onReviewChange(newReview);
    
    // Focus textarea and place cursor at end
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = newReview.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 50);
  }, [review, onReviewChange]);

  // Counter color logic
  const getTitleCounterColor = () => {
    if (titleLength >= MAX_TITLE_LENGTH * (TITLE_DANGER_THRESHOLD / 100)) return 'text-destructive font-medium';
    if (titleLength >= TITLE_WARN_THRESHOLD) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const getReviewCounterColor = () => {
    if (reviewLength >= MAX_REVIEW_LENGTH * REVIEW_DANGER_THRESHOLD) return 'text-destructive font-medium';
    if (reviewLength >= MAX_REVIEW_LENGTH * REVIEW_WARN_THRESHOLD) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  // Show prompt chips when textarea is focused, empty or very short content
  const showPromptChips = isReviewFocused && reviewLength < 50;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col min-h-0 px-4 pt-6 pb-6"
    >
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-lg font-semibold text-foreground">
          The Verdict
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tell the story of your experience
        </p>
        <p className="text-[11px] text-muted-foreground/50 mt-1">
          Optional — skip if you prefer to let your ratings speak
        </p>
      </div>

      {/* Form Fields */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Summary Title - Compact card, single-line feel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className={cn(
            "flex flex-col rounded-2xl border bg-card transition-all duration-200 shadow-sm shrink-0",
            isTitleFocused ? "border-primary/30 ring-1 ring-primary/20" : "border-border"
          )}
        >
          <input
            id="review-title"
            type="text"
            className="w-full text-base font-medium leading-relaxed bg-transparent placeholder:text-muted-foreground/60 placeholder:font-medium focus:outline-none px-4 pt-3.5 pb-2 text-foreground"
            placeholder="Sum up your experience in a few words"
            value={title}
            onChange={(e) => onTitleChange(e.target.value.slice(0, MAX_TITLE_LENGTH))}
            onFocus={() => setIsTitleFocused(true)}
            onBlur={() => setIsTitleFocused(false)}
            maxLength={MAX_TITLE_LENGTH}
          />
          {/* Footer — no heavy divider */}
          <div className="flex items-center justify-between px-4 pb-2.5">
            <span className="text-[11px] text-muted-foreground">
              Your take in one line
            </span>
            {/* Counter: only show when typing */}
            <AnimatePresence>
              {titleLength > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className={cn("text-[11px] tabular-nums", getTitleCounterColor())}
                >
                  {titleLength}/{MAX_TITLE_LENGTH}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Review Textarea Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "flex-1 flex flex-col rounded-2xl border bg-card transition-all duration-200 shadow-sm min-h-[160px]",
            isReviewFocused ? "border-primary/30 ring-1 ring-primary/20" : "border-border"
          )}
        >
          {/* Textarea wrapper */}
          <div className="flex-1 flex flex-col min-h-0">
            <textarea
              ref={textareaRef}
              id="review-body"
              value={review}
              onChange={handleReviewChange}
              onFocus={() => setIsReviewFocused(true)}
              onBlur={() => setIsReviewFocused(false)}
              placeholder="Share what other golfers should expect?"
              className={cn(
                "w-full bg-transparent border-0 resize-none",
                "focus:outline-none focus-visible:ring-0",
                "placeholder:text-muted-foreground text-sm leading-relaxed p-4 text-foreground"
              )}
              maxLength={MAX_REVIEW_LENGTH + 100}
              style={{ minHeight: '120px' }}
            />

            {/* Prompt chips — visible when focused & empty/short */}
            <AnimatePresence>
              {showPromptChips && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pb-3 flex flex-wrap gap-1.5"
                >
                  {PROMPT_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onMouseDown={(e) => {
                        // Prevent blur on textarea
                        e.preventDefault();
                        handlePromptChipClick(chip.insert);
                      }}
                      className="text-[11px] bg-muted/40 text-muted-foreground rounded-full px-2.5 py-1 transition-colors hover:bg-muted/60 active:bg-muted/80"
                    >
                      {chip.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Tagged entities chips */}
          {selectedTags.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap items-center gap-1.5 shrink-0">
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
          
          {/* Footer — counter only, no @mention hint (placeholder handles discovery) */}
          <div className="flex items-center justify-end px-4 py-2 border-t border-border/20 shrink-0 mt-auto">
            <AnimatePresence>
              {reviewLength > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className={cn("text-[11px] tabular-nums", getReviewCounterColor())}
                >
                  {reviewLength}/{MAX_REVIEW_LENGTH}
                </motion.span>
              )}
            </AnimatePresence>
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