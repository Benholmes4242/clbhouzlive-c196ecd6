/**
 * Step 2: Write Your Review (The Verdict)
 * Voice input, tappable prompt chips, amber focus cards
 * @mention support, grapheme-aware counting
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Square, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

import { MentionBottomSheet, type MentionSuggestion } from '@/components/shared/media/MentionBottomSheet';

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

const CHIPS = [
  { label: 'Best holes', text: 'The standout holes were ' },
  { label: 'Conditions', text: 'The course condition was ' },
  { label: 'Value', text: 'In terms of value for money, ' },
  { label: 'Tips', text: 'A tip for visitors: ' },
  { label: 'The views', text: 'The views were ' },
  { label: 'Pace', text: 'Pace of play was ' },
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

// Check if SpeechRecognition is available
const getSpeechRecognition = (): any => {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

/* ── VoiceMic sub-component ── */
type VoiceState = 'idle' | 'listening' | 'processing';

function VoiceMic({ onTranscript, onStateChange }: { onTranscript: (text: string) => void; onStateChange?: (state: VoiceState) => void }) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const updateVoiceState = useCallback((s: VoiceState) => { setVoiceState(s); onStateChange?.(s); }, [onStateChange]);
  const recognitionRef = useRef<any>(null);
  const SpeechRecognitionClass = getSpeechRecognition();

  const startListening = useCallback(() => {
    if (!SpeechRecognitionClass) return;
    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'en-GB';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');
      if (transcript.trim()) {
        setVoiceState('processing');
        onTranscript(transcript.trim());
        setTimeout(() => setVoiceState('idle'), 400);
      }
    };

    recognition.onerror = () => setVoiceState('idle');
    recognition.onend = () => {
      if (voiceState === 'listening') setVoiceState('idle');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setVoiceState('listening');
  }, [SpeechRecognitionClass, onTranscript, voiceState]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setVoiceState('idle');
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleTap = () => {
    if (voiceState === 'listening') {
      stopListening();
    } else if (voiceState === 'idle') {
      startListening();
    }
  };

  if (!SpeechRecognitionClass) {
    return (
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center opacity-30"
        style={{ background: 'hsl(var(--muted))' }}
      >
        <Mic className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Pulse rings when listening */}
      {voiceState === 'listening' && (
        <>
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'rgba(239,68,68,0.15)', animationDuration: '1.5s' }}
          />
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'rgba(239,68,68,0.08)', animationDuration: '2s', animationDelay: '0.3s' }}
          />
        </>
      )}
      <button
        type="button"
        onClick={handleTap}
        className="relative w-11 h-11 rounded-full flex items-center justify-center active:scale-[0.95] transition-all z-10"
        style={{
          background: voiceState === 'listening'
            ? 'rgba(239,68,68,0.12)'
            : voiceState === 'processing'
              ? 'rgba(247,147,30,0.10)'
              : 'hsl(var(--muted))',
        }}
      >
        {voiceState === 'listening' ? (
          <Square className="w-4 h-4 text-red-500 fill-red-500" />
        ) : voiceState === 'processing' ? (
          <RotateCw className="w-5 h-5 text-amber-500 animate-spin" />
        ) : (
          <Mic className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

/* ── WriteStep ── */
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
  const [currentVoiceState, setCurrentVoiceState] = useState<VoiceState>('idle');

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

  // Voice transcript handler
  const handleVoiceTranscript = useCallback((transcript: string) => {
    const current = review;
    let newText: string;
    if (!current) {
      newText = transcript.charAt(0).toUpperCase() + transcript.slice(1);
    } else {
      newText = current.endsWith(' ')
        ? current + transcript
        : current + ' ' + transcript;
    }
    onReviewChange(newText.slice(0, MAX_REVIEW_LENGTH));
  }, [review, onReviewChange]);

  // Insert chip text
  const insertChip = useCallback((chipText: string) => {
    const current = review;
    let newText: string;
    if (!current) {
      newText = chipText;
    } else {
      newText = current.endsWith(' ')
        ? current + chipText
        : current + ' ' + chipText;
    }
    onReviewChange(newText.slice(0, MAX_REVIEW_LENGTH));
    // Focus textarea after chip insertion
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [review, onReviewChange]);

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
        <h2 className="text-[22px] text-foreground" style={{ fontWeight: 900 }}>
          The Verdict
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Optional — your ratings already tell the story
        </p>
      </div>

      {/* Form Fields */}
      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        {/* Headline card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="shrink-0 rounded-[14px] p-4 transition-all duration-200"
          style={{
            background: (isTitleFocused || title.length > 0) ? 'rgba(245, 158, 11, 0.04)' : 'hsl(var(--muted) / 0.5)',
            border: (isTitleFocused || title.length > 0)
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
                <span className={cn(
                  "text-[11px] tabular-nums",
                  titleLength >= 95 ? 'text-destructive font-medium' :
                  titleLength >= 80 ? 'text-amber-500' : 'text-muted-foreground'
                )}>
                  {titleLength}/{MAX_TITLE_LENGTH}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Body card with textarea + voice toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex flex-col min-h-0 rounded-[14px] transition-all duration-200"
          style={{
            background: (isReviewFocused || review.length > 0) ? 'rgba(245, 158, 11, 0.04)' : 'hsl(var(--muted) / 0.5)',
            border: (isReviewFocused || review.length > 0)
              ? '1.5px solid rgba(245, 158, 11, 0.3)'
              : '1.5px solid transparent',
          }}
        >
          <div className="p-4 pb-0 flex-1 flex flex-col min-h-0">
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
          </div>

          {/* Voice toolbar — separated by thin border */}
          <div
            className="flex items-center gap-3 px-4 py-2.5"
            style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
          >
            <VoiceMic onTranscript={handleVoiceTranscript} onStateChange={setCurrentVoiceState} />
            <span className="text-[12px] text-muted-foreground flex-1">
              {currentVoiceState === 'listening' ? 'Listening… tap to stop' : 'Tap mic to speak'}
            </span>
            {reviewLength > 0 && (
              <span className={cn(
                "text-[11px] tabular-nums",
                reviewLength >= MAX_REVIEW_LENGTH * 0.95 ? 'text-destructive font-medium' :
                reviewLength >= MAX_REVIEW_LENGTH * 0.8 ? 'text-amber-500' : 'text-muted-foreground'
              )}>
                {reviewLength.toLocaleString()}/{MAX_REVIEW_LENGTH.toLocaleString()}
              </span>
            )}
          </div>
        </motion.div>

        {/* Tappable prompt chips */}
        <div>
          <p className="text-[11px] text-muted-foreground mb-2 ml-0.5">Write about…</p>
          <div className="flex flex-wrap gap-2">
            {CHIPS.map(chip => (
              <button
                key={chip.label}
                type="button"
                onClick={() => insertChip(chip.text)}
                className="px-3.5 py-1.5 rounded-full border border-border bg-card text-[13px] font-medium shadow-sm active:scale-[0.95] active:bg-[rgba(247,147,30,0.1)] transition-all"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

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
        isOpen={showMentions}
        onClose={() => setShowMentions(false)}
        query={mentionQuery}
        onSelect={handleMentionSelect}
      />
    </motion.div>
  );
}
