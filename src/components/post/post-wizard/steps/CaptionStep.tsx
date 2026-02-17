// CaptionStep - Step 2: Caption + Course Tag + Categories + @Mentions
// Card-free surface design — content sits directly on amber gradient background
import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, X, Tag, ChevronRight, Pencil, Play } from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { StepProps } from '../types';
import { TaggableEntity } from '@/components/post/create-moment/types';
import { MentionBottomSheet, MentionSuggestion } from './MentionBottomSheet';
import { POST_LIMITS } from '@/constants/postLimits';
import { useKeyboardAwareScroll } from '@/hooks/useKeyboardAwareScroll';

interface CaptionStepProps extends StepProps {
  onOpenCourseSearch: () => void;
  onOpenCategories: () => void;
}

const CAPTION_MAX_LENGTH = 2200;

const PLACEHOLDERS = [
  "How was the back nine?",
  "Tell us about the shot...",
  "What made this round special?",
  "Describe the course conditions today",
  "Any highlights from your round?",
  "What's the story behind these shots?",
];

// Section label — uppercase tracking label on amber background
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: '#92400E' }}>
      {children}
    </span>
  );
}

// Amber divider between sections
function SectionDivider() {
  return <div className="mx-4 h-px" style={{ backgroundColor: '#FCD34D' }} />;
}

export function CaptionStep({ 
  state, 
  dispatch,
  onOpenCourseSearch,
  onOpenCategories,
}: CaptionStepProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // Rotating placeholder
  const [placeholderIndex, setPlaceholderIndex] = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length));

  useEffect(() => {
    if (state.caption.length > 0) return;
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [state.caption.length]);
  
  const charCount = state.caption.length;
  const charPercent = charCount / CAPTION_MAX_LENGTH;
  const hasContent = charCount > 0;
  
  const hasCategories = state.selectedCategories.length > 0;

  // Character counter color
  const counterClass = useMemo(() => {
    if (charPercent >= 1) return 'text-red-600 font-bold';
    if (charPercent >= 0.95) return 'text-red-500 font-medium';
    if (charPercent >= 0.8) return 'text-amber-500';
    return 'text-gray-400';
  }, [charPercent]);

  // Keyboard-aware scrolling for mobile
  useKeyboardAwareScroll('textarea', {
    containerSelector: '[data-caption-scroll]',
  });

  // Handle caption change with mention detection
  const handleCaptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;
    
    dispatch({ type: 'SET_CAPTION', payload: value });
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
  }, [dispatch]);

  // Handle mention selection
  const handleMentionSelect = useCallback((mention: MentionSuggestion) => {
    const caption = state.caption;
    const textBeforeCursor = caption.slice(0, cursorPosition);
    const textAfterCursor = caption.slice(cursorPosition);
    
    const beforeMention = textBeforeCursor.replace(/@\w*$/, '');
    const displayName = mention.username || mention.name;
    const newCaption = `${beforeMention}@${displayName} ${textAfterCursor}`;
    
    dispatch({ type: 'SET_CAPTION', payload: newCaption });
    setShowMentions(false);
    setMentionQuery('');
    
    const tagEntity: TaggableEntity = {
      id: mention.id,
      entity_id: mention.entity_id,
      entity_type: mention.entity_type,
      name: mention.name,
      username: mention.username,
      avatar_url: mention.avatar_url,
    };
    
    if (!state.selectedTags.some(t => t.id === mention.id)) {
      dispatch({ type: 'SET_TAGS', payload: [...state.selectedTags, tagEntity] });
    }
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeMention.length + displayName.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 100);
  }, [state.caption, state.selectedTags, cursorPosition, dispatch]);

  const handleRemoveTag = useCallback((tagId: string) => {
    dispatch({ type: 'SET_TAGS', payload: state.selectedTags.filter(t => t.id !== tagId) });
  }, [state.selectedTags, dispatch]);
  
  const handleRemoveCourse = useCallback((courseId: string) => {
    dispatch({ type: 'REMOVE_COURSE', payload: courseId });
  }, [dispatch]);

  const handleEditMedia = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: 'media' });
  }, [dispatch]);

  const hasSelectedCourses = state.selectedCourses.length > 0;
  const previewMedia = state.mediaItems.slice(0, 6);
  const overflowCount = state.mediaItems.length - 6;

  // SVG circular progress for character counter
  const circumference = 2 * Math.PI * 6;
  const strokeDashoffset = circumference - (Math.min(charPercent, 1) * circumference);

  return (
    <div 
      ref={scrollContainerRef}
      data-caption-scroll
      className="h-full flex flex-col overflow-y-auto"
      style={{ background: 'transparent' }}
    >
      <div className="flex flex-col py-4 pb-32">
        {/* Media Preview Strip */}
        {state.mediaItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="px-4 mb-6"
          >
            <button onClick={handleEditMedia} className="flex items-center gap-2 group">
              {previewMedia.map((item, idx) => (
                <div key={item.id} className={cn(
                  "relative flex-shrink-0 rounded-xl overflow-hidden",
                  idx === 0 ? "w-14 h-14 ring-2 ring-amber-400 scale-105" : "w-12 h-12"
                )}>
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white drop-shadow-md" fill="white" />
                    </div>
                  )}
                  {idx === previewMedia.length - 1 && overflowCount > 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">+{overflowCount}</span>
                    </div>
                  )}
                </div>
              ))}
              <div className="ml-1 flex items-center gap-1 text-xs text-amber-600 group-hover:text-amber-700 transition-colors">
                <Pencil className="h-3 w-3" />
                <span>Edit</span>
              </div>
            </button>
          </motion.div>
        )}

        {/* ── Caption Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 25 }}
          className="px-4 mb-6"
        >
          <SectionLabel>Caption</SectionLabel>
          <div className="mt-2">
            <Textarea
              ref={textareaRef}
              value={state.caption}
              onChange={handleCaptionChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={PLACEHOLDERS[placeholderIndex]}
              className={cn(
                "min-h-[120px] bg-transparent border-0 border-b-2 rounded-none resize-none",
                "focus-visible:ring-0 focus-visible:outline-none",
                "text-base leading-relaxed p-0 py-3",
                isFocused
                  ? "border-b-amber-500"
                  : "border-b-transparent"
              )}
              style={{
                color: '#1f2937',
                // Placeholder color via CSS custom property
              }}
              maxLength={CAPTION_MAX_LENGTH + 100}
            />
            {/* Placeholder styling override */}
            <style>{`
              [data-caption-scroll] textarea::placeholder {
                color: rgba(217, 119, 6, 0.5);
                font-style: italic;
              }
            `}</style>

            {/* Tagged entities chips */}
            {state.selectedTags.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-xs" style={{ color: '#92400E' }}>Tagged:</span>
                {state.selectedTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleRemoveTag(tag.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors bg-amber-50 text-amber-700 hover:bg-amber-100"
                  >
                    @{(tag.username || tag.name).charAt(0).toUpperCase() + (tag.username || tag.name).slice(1)}
                    <X className="w-3 h-3 opacity-60 hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}

            {/* Character counter */}
            {hasContent && (
              <div className="flex items-center justify-end gap-1.5 pt-2">
                <svg className="w-4 h-4" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" fill="none" stroke="hsl(36, 92%, 82%)" strokeWidth="2" />
                  <circle
                    cx="8" cy="8" r="6" fill="none"
                    stroke={charPercent >= 0.95 ? '#ef4444' : '#f59e0b'}
                    strokeWidth="2"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 8 8)"
                    className="transition-all duration-200"
                  />
                </svg>
                <span className={cn("text-[11px] tabular-nums transition-colors duration-200", counterClass)}>
                  {charCount}/{CAPTION_MAX_LENGTH}
                </span>
              </div>
            )}
          </div>
        </motion.div>
        
        <SectionDivider />
        
        {/* ── Tagged Courses Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 300, damping: 25 }}
          className="px-4 py-6"
        >
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Tagged Courses</SectionLabel>
            {hasSelectedCourses && (
              <span className="text-xs text-gray-400">
                {state.selectedCourses.length} course{state.selectedCourses.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {hasSelectedCourses && (
            <div className="flex flex-wrap gap-2 mb-3">
              {state.selectedCourses
                .filter((course) => course?.id && course?.name)
                .map((course) => (
                  <div 
                    key={course.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-50 border border-amber-300"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-sm text-amber-800 font-medium">{course.name}</span>
                    <button
                      onClick={() => handleRemoveCourse(course.id)}
                      className="p-0.5 rounded-full hover:bg-amber-100 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-amber-500" />
                    </button>
                  </div>
                ))}
            </div>
          )}

          <button
            onClick={onOpenCourseSearch}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-amber-300/50 hover:border-amber-300 hover:text-amber-600 transition-colors text-left"
          >
            <MapPin className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span className="text-sm text-gray-500">
              {hasSelectedCourses ? "Add another course" : "Add a course"}
            </span>
            <ChevronRight className="h-4 w-4 text-amber-400 ml-auto" />
          </button>
        </motion.div>
        
        <SectionDivider />
        
        {/* ── Categories Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
          className="px-4 pt-6"
        >
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Categories</SectionLabel>
            {!hasCategories && (
              <span className="inline-flex items-center gap-1.5 text-xs text-red-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Required
              </span>
            )}
          </div>

          <button
            onClick={onOpenCategories}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left active:scale-[0.98]",
              hasCategories 
                ? "bg-amber-50 border-amber-200 hover:bg-amber-100" 
                : "border-dashed border-amber-300/50 hover:border-amber-300"
            )}
          >
            <Tag className={cn(
              "h-4 w-4 flex-shrink-0",
              hasCategories ? "text-amber-600" : "text-gray-400"
            )} />
            {hasCategories ? (
              <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
                {state.selectedCategories.slice(0, 3).map((cat) => (
                  <span 
                    key={typeof cat === 'string' ? cat : cat.id}
                    className="px-2.5 py-0.5 text-xs rounded-full bg-amber-500 text-white font-medium"
                  >
                    {typeof cat === 'string' ? cat : cat.label}
                  </span>
                ))}
                {state.selectedCategories.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{state.selectedCategories.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500 flex-1">
                Select at least one category
              </span>
            )}
            <span className="text-xs text-gray-400 tabular-nums">
              {state.selectedCategories.length}/{POST_LIMITS.MAX_CATEGORIES}
            </span>
            <ChevronRight className="h-4 w-4 text-amber-400" />
          </button>
        </motion.div>
      </div>
      
      {/* Mention Bottom Sheet */}
      <MentionBottomSheet
        open={showMentions}
        onOpenChange={setShowMentions}
        query={mentionQuery}
        onSelect={handleMentionSelect}
      />
    </div>
  );
}

export default CaptionStep;
