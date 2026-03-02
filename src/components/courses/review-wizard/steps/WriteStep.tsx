/**
 * Step 2: Write Your Review (The Verdict)
 * Card-based inputs with amber focus glow, floating labels
 * @mention support, grapheme-aware counting
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CharacterRing } from '@/components/post/post-wizard/components/CharacterRing';

import { MentionBottomSheet, type MentionSuggestion } from '@/components/post/post-wizard/steps/MentionBottomSheet';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

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
  'Course highlights',
  'Conditions',
  'Memorable holes',
  'Value for money',
  'Tips for visitors',
];

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
  const keyboardHeight = useKeyboardHeight();
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
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`;
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

  const getTitleCounterColor = () => {
    if (titleLength >= 95) return 'text-destructive font-medium';
    if (titleLength >= 80) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const getReviewCounterColor = () => {
    if (reviewLength >= MAX_REVIEW_LENGTH * 0.95) return 'text-destructive font-medium';
    if (reviewLength >= MAX_REVIEW_LENGTH * 0.8) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex-1 flex flex-col min-h-0 px-4 pt-4 pb-6"
      style={{ background: 'transparent' }}
    >
      {/* Header */}
      <div className="text-center pb-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          The Verdict
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Optional – skip to let your ratings speak
        </p>
      </div>

      {/* Form Fields */}
      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        {/* Title input — card style */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="shrink-0 rounded-2xl p-4 transition-all duration-200"
          style={{
            background: isTitleFocused ? 'rgba(245, 158, 11, 0.04)' : 'hsl(var(--muted) / 0.5)',
            border: isTitleFocused
              ? '1.5px solid rgba(245, 158, 11, 0.3)'
              : '1.5px solid transparent',
          }}
        >
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[1.5px]">
            Headline
          </label>
          <input
            id="review-title"
            type="text"
            className="w-full bg-transparent text-foreground text-[16px] font-semibold mt-1 outline-none placeholder:text-muted-foreground/40"
            placeholder="Sum up your experience"
            value={title}
            onChange={(e) => onTitleChange(e.target.value.slice(0, MAX_TITLE_LENGTH))}
            onFocus={() => setIsTitleFocused(true)}
            onBlur={() => setIsTitleFocused(false)}
            maxLength={MAX_TITLE_LENGTH}
          />
          <AnimatePresence>
            {titleLength > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-end mt-1"
              >
                <span className={cn("text-[11px] tabular-nums", getTitleCounterColor())}>
                  {titleLength}/{MAX_TITLE_LENGTH}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Body textarea — card style */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col min-h-0 rounded-2xl p-4 transition-all duration-200"
          style={{
            background: isReviewFocused ? 'rgba(245, 158, 11, 0.04)' : 'hsl(var(--muted) / 0.5)',
            border: isReviewFocused
              ? '1.5px solid rgba(245, 158, 11, 0.3)'
              : '1.5px solid transparent',
          }}
        >
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[1.5px]">
            Your review
          </label>
          <textarea
            ref={textareaRef}
            id="review-body"
            value={review}
            onChange={handleReviewChange}
            onFocus={() => setIsReviewFocused(true)}
            onBlur={() => setIsReviewFocused(false)}
            placeholder="Share what other golfers should expect"
            className="w-full bg-transparent text-foreground text-[15px] mt-1 outline-none resize-none placeholder:text-muted-foreground/40"
            style={{ minHeight: '120px' }}
            maxLength={MAX_REVIEW_LENGTH + 100}
          />
          <div className="flex justify-end mt-1">
            <CharacterRing current={reviewLength} max={MAX_REVIEW_LENGTH} />
          </div>
        </motion.div>

        {/* Prompt chips — always visible when body is short */}
        {reviewLength < 50 && (
          <div className="flex flex-wrap gap-2 pt-1 justify-center">
            {PROMPT_CHIPS.map(prompt => (
              <span
                key={prompt}
                className="text-xs text-muted-foreground/60 bg-muted/30 px-2.5 py-1 rounded-full select-none"
              >
                {prompt}
              </span>
            ))}
          </div>
        )}
          
        {/* Tagged entities chips */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
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
      </div>

      {/* Mention bottom sheet */}
      <MentionBottomSheet
        open={showMentions}
        onOpenChange={setShowMentions}
        query={mentionQuery}
        onSelect={handleMentionSelect}
        bottomOffset={keyboardHeight}
      />
    </motion.div>
  );
}
