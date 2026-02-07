// CaptionStep - Step 2: Caption + Course Tag + Categories + @Mentions
// A*-polished: media preview strip, compact caption, promoted AI, smart counter
import { useCallback, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, X, Tag, ChevronRight, Pencil, Camera, AtSign } from 'lucide-react';

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
  
  const charCount = state.caption.length;
  const isNearLimit = charCount > CAPTION_MAX_LENGTH * 0.8;
  const isAlmostFull = charCount > CAPTION_MAX_LENGTH * 0.95;
  const isOverLimit = charCount > CAPTION_MAX_LENGTH;
  const hasContent = charCount > 0;
  
  const hasCategories = state.selectedCategories.length > 0;

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
  }, [dispatch]);

  // Handle mention selection from bottom sheet
  const handleMentionSelect = useCallback((mention: MentionSuggestion) => {
    const caption = state.caption;
    const textBeforeCursor = caption.slice(0, cursorPosition);
    const textAfterCursor = caption.slice(cursorPosition);
    
    // Find and replace the @query with the selected mention
    const beforeMention = textBeforeCursor.replace(/@\w*$/, '');
    const displayName = mention.username || mention.name;
    const newCaption = `${beforeMention}@${displayName} ${textAfterCursor}`;
    
    dispatch({ type: 'SET_CAPTION', payload: newCaption });
    setShowMentions(false);
    setMentionQuery('');
    
    // Convert MentionSuggestion to TaggableEntity for storage
    const tagEntity: TaggableEntity = {
      id: mention.id,
      entity_id: mention.entity_id,
      entity_type: mention.entity_type,
      name: mention.name,
      username: mention.username,
      avatar_url: mention.avatar_url,
    };
    
    // Add to selected tags if not already present
    if (!state.selectedTags.some(t => t.id === mention.id)) {
      dispatch({ type: 'SET_TAGS', payload: [...state.selectedTags, tagEntity] });
    }
    
    // Focus back on textarea and set cursor position after the inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeMention.length + displayName.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 100);
  }, [state.caption, state.selectedTags, cursorPosition, dispatch]);

  // Remove a tag
  const handleRemoveTag = useCallback((tagId: string) => {
    dispatch({ type: 'SET_TAGS', payload: state.selectedTags.filter(t => t.id !== tagId) });
  }, [state.selectedTags, dispatch]);
  
  // Handle course removal (by ID for multi-course)
  const handleRemoveCourse = useCallback((courseId: string) => {
    dispatch({ type: 'REMOVE_COURSE', payload: courseId });
  }, [dispatch]);

  // Navigate back to media step
  const handleEditMedia = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: 'media' });
  }, [dispatch]);

  const hasSelectedCourses = state.selectedCourses.length > 0;

  // Visible media items for the preview strip
  const previewMedia = state.mediaItems.slice(0, 4);
  const overflowCount = state.mediaItems.length - 4;

  return (
    <div 
      ref={scrollContainerRef}
      data-caption-scroll
      className="h-full flex flex-col overflow-y-auto bg-[#F8FAFC]"
    >
      <div className="flex flex-col p-5 space-y-4 pb-32">
        {/* Priority 1: Compact media preview strip — visual anchor */}
        {state.mediaItems.length > 0 && (
          <motion.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={handleEditMedia}
            className="flex items-center gap-2 group"
          >
            {/* Hero thumbnail */}
            <div className="relative flex-shrink-0">
              <img
                src={state.mediaItems[0].previewUrl}
                alt="Selected media"
                className="h-16 w-16 rounded-xl object-cover"
              />
              {/* Edit overlay */}
              <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 group-active:bg-black/30 transition-colors flex items-center justify-center">
                <Pencil className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Smaller thumbnails */}
            {previewMedia.slice(1).map((item, idx) => (
              <div key={item.id} className="relative flex-shrink-0">
                <img
                  src={item.previewUrl}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
                {/* +N overlay on last visible thumbnail */}
                {idx === previewMedia.length - 2 && overflowCount > 0 && (
                  <div className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">+{overflowCount}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Edit label */}
            <div className="ml-1 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              <Pencil className="h-3 w-3" />
              <span>Edit</span>
            </div>
          </motion.button>
        )}

        {/* Priority 2: Caption compose area — compact canvas, no card border */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={cn(
            "relative flex flex-col rounded-2xl bg-white transition-all",
            isFocused ? "ring-1 ring-primary/20" : ""
          )}
        >
          {/* Textarea — compact, auto-grows */}
          <Textarea
            ref={textareaRef}
            value={state.caption}
            onChange={handleCaptionChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="What's the story behind this moment? Type @ to mention someone"
            className={cn(
              "min-h-[120px] bg-transparent border-0 resize-none",
              "focus-visible:ring-0 focus-visible:outline-none",
              "placeholder:text-muted-foreground/60 placeholder:transition-opacity placeholder:duration-200",
              "text-sm leading-relaxed p-4 text-foreground"
            )}
            maxLength={CAPTION_MAX_LENGTH + 100}
          />

          
          {/* Tagged entities chips */}
          {state.selectedTags.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground/60">Tagged:</span>
              {state.selectedTags.map(tag => (
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
          
          {/* Priority 4: Smart character counter — only when typing, right-aligned */}
          {hasContent && (
            <div className="flex items-center justify-end px-4 py-2">
              <span className={cn(
                "text-[11px] tabular-nums transition-colors duration-200",
                isOverLimit ? "text-destructive font-medium" :
                isAlmostFull ? "text-destructive/70" :
                isNearLimit ? "text-amber-500" :
                "text-muted-foreground/40"
              )}>
                {charCount}/{CAPTION_MAX_LENGTH}
              </span>
            </div>
          )}
        </motion.div>
        
        {/* Priority 5: Course tag section — clean solid treatment */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="space-y-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-medium text-foreground">Tagged Courses</span>
            {hasSelectedCourses && (
              <span className="text-xs text-muted-foreground">
                {state.selectedCourses.length} course{state.selectedCourses.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Course chips */}
          {hasSelectedCourses && (
            <div className="flex flex-wrap gap-2">
              {state.selectedCourses
                .filter((course) => course?.id && course?.name)
                .map((course) => (
                  <div 
                    key={course.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/10 border border-primary/20"
                  >
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary font-medium">{course.name}</span>
                    <button
                      onClick={() => handleRemoveCourse(course.id)}
                      className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-primary/80" />
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* Add course button — solid border, no dashed */}
          <button
            onClick={onOpenCourseSearch}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/20 border border-border hover:border-primary/30 hover:bg-muted/40 transition-colors text-left"
          >
            <MapPin className="h-4 w-4 text-emerald-600/60 flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              {hasSelectedCourses ? "Add another course" : "Tag where this was played"}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 ml-auto" />
          </button>
        </motion.div>
        
        {/* Priority 6: Categories — prominent Required indicator */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={onOpenCategories}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left",
              hasCategories 
                ? "bg-primary/10 border-primary/20 hover:bg-primary/15" 
                : "bg-muted/20 border-border hover:border-primary/30 hover:bg-muted/40"
            )}
          >
            <Tag className={cn(
              "h-4 w-4 flex-shrink-0",
              hasCategories ? "text-primary" : "text-muted-foreground"
            )} />
            {hasCategories ? (
              <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
                {state.selectedCategories.slice(0, 3).map((cat) => (
                  <span 
                    key={typeof cat === 'string' ? cat : cat.id}
                    className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground font-medium"
                  >
                    {typeof cat === 'string' ? cat : cat.label}
                  </span>
                ))}
                {state.selectedCategories.length > 3 && (
                  <span className="text-xs text-muted-foreground/70">
                    +{state.selectedCategories.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground flex-1">
                Add categories
              </span>
            )}
            {hasCategories ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                {state.selectedCategories.length}/{POST_LIMITS.MAX_CATEGORIES}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-destructive/60 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive/60" />
                Required
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
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
