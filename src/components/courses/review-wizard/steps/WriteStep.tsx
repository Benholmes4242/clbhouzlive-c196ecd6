/**
 * Step 2: Write Your Review (The Verdict)
 * Card-free layout — borderless inputs with focus-only 2px amber bottom border
 * Amber dividers between sections, @mention support
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

const TITLE_WARN_THRESHOLD = 80;
const TITLE_DANGER_THRESHOLD = 95;
const REVIEW_WARN_THRESHOLD = 0.8;
const REVIEW_DANGER_THRESHOLD = 0.95;

function countGraphemes(str: string): number {
  try {
    // @ts-ignore – Intl.Segmenter not yet in all TS libs
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    return [...segmenter.segment(str)].length;
  } catch {
    return [...str].length;
  }
}

export function WriteStep({
  title,
  review,
  selectedTags,
  onTitleChange,
  onReviewChange,
  onTagsChange,
}: WriteStepProps) {
  const reviewLength = countGraphemes(review);
  const titleLength = countGraphemes(title);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isReviewFocused, setIsReviewFocused] = useState(false);
  
  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea
  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(200, textareaRef.current.scrollHeight)}px`;
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [review, autoResize]);

  const handleReviewChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;
    
    onReviewChange(value.slice(0, MAX_REVIEW_LENGTH));
    setCursorPosition(cursor);
    
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

  const handleMentionSelect = useCallback((mention: MentionSuggestion) => {
    const textBeforeCursor = review.slice(0, cursorPosition);
    const textAfterCursor = review.slice(cursorPosition);
    
    const beforeMention = textBeforeCursor.replace(/@\w*$/, '');
    const displayName = mention.username || mention.name;
    const newReview = `${beforeMention}@${displayName} ${textAfterCursor}`;
    
    onReviewChange(newReview);
    setShowMentions(false);
    setMentionQuery('');
    
    if (!selectedTags.some(t => t.id === mention.id)) {
      onTagsChange([...selectedTags, mention]);
    }
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeMention.length + displayName.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 100);
  }, [review, cursorPosition, selectedTags, onReviewChange, onTagsChange]);

  const handleRemoveTag = useCallback((tagId: string) => {
    onTagsChange(selectedTags.filter(t => t.id !== tagId));
  }, [selectedTags, onTagsChange]);

  const handlePromptChipClick = useCallback((insert: string) => {
    const newReview = review + insert;
    onReviewChange(newReview);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = newReview.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 50);
  }, [review, onReviewChange]);

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

  const showPromptChips = isReviewFocused && reviewLength < 50;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex-1 flex flex-col min-h-0 px-4 pt-6 pb-6"
      style={{ background: 'transparent' }}
    >
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          The Verdict
        </h2>
        <p className="text-sm font-medium text-muted-foreground mt-0.5">
          Tell the story of your experience
        </p>
        {reviewLength === 0 && titleLength === 0 && (
          <p className="text-xs text-muted-foreground/70 mt-1">
            Optional — skip if you prefer to let your ratings speak
          </p>
        )}
      </div>

      {/* Form Fields — card-free, directly on background */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Headline Input — borderless, on background */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="shrink-0"
        >
          <input
            id="review-title"
            type="text"
            className="w-full text-base font-medium leading-relaxed bg-transparent focus:outline-none py-3 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50"
            style={{
              borderBottom: isTitleFocused ? '2px solid hsl(var(--primary))' : '1px solid transparent',
              paddingBottom: isTitleFocused ? 11 : 12,
            }}
            placeholder="Sum up your experience in a few words"
            value={title}
            onChange={(e) => onTitleChange(e.target.value.slice(0, MAX_TITLE_LENGTH))}
            onFocus={() => setIsTitleFocused(true)}
            onBlur={() => setIsTitleFocused(false)}
            maxLength={MAX_TITLE_LENGTH}
          />
          <div className="flex items-center justify-between mt-1 mb-1">
            <span className="text-[11px] text-muted-foreground">
              Your take in one line
            </span>
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

        {/* Section divider */}
        <div className="h-px my-2 bg-border" />

        {/* Review Textarea — borderless, on background */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col min-h-0"
        >
          <textarea
            ref={textareaRef}
            id="review-body"
            value={review}
            onChange={handleReviewChange}
            onFocus={() => setIsReviewFocused(true)}
            onBlur={() => setIsReviewFocused(false)}
            placeholder="Share what other golfers should expect?"
            className="w-full bg-transparent border-0 resize-none focus:outline-none focus-visible:ring-0 text-sm leading-relaxed py-3 text-foreground transition-all duration-200"
            style={{
              minHeight: '200px',
              borderBottom: isReviewFocused ? '2px solid hsl(var(--primary))' : '1px solid transparent',
            }}
            maxLength={MAX_REVIEW_LENGTH + 100}
          />

          {/* Prompt chips */}
          <AnimatePresence>
            {showPromptChips && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="flex flex-wrap gap-1.5 mt-2"
              >
                {PROMPT_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handlePromptChipClick(chip.insert);
                    }}
                    className="text-[11px] bg-muted text-muted-foreground rounded-full px-2.5 py-1 transition-colors hover:bg-muted/80 active:scale-[0.97]"
                  >
                    {chip.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Tagged entities chips */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2 shrink-0">
              <span className="text-xs text-muted-foreground">Tagged:</span>
              {selectedTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleRemoveTag(tag.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors bg-muted text-foreground hover:bg-muted/80 active:scale-[0.97]"
                >
                  @{(tag.username || tag.name).charAt(0).toUpperCase() + (tag.username || tag.name).slice(1)}
                  <X className="w-3 h-3 opacity-60 hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
          
          {/* Counter — right-aligned on background */}
          <div className="flex items-center justify-end mt-2 shrink-0">
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
