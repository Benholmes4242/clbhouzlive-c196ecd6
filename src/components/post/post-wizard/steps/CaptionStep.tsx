// CaptionStep - Step 2: Caption + Course Tag + Categories + @Mentions
// Consolidated all inputs on this screen for better flow
import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, X, Sparkles, Tag, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { StepProps } from '../types';
import { TaggableEntity } from '@/components/post/create-moment/types';
import { MentionBottomSheet, MentionSuggestion } from './MentionBottomSheet';
import { POST_LIMITS } from '@/constants/postLimits';

interface CaptionStepProps extends StepProps {
  onOpenCourseSearch: () => void;
  onOpenCategories: () => void;
  onOpenAiCaption?: () => void;
}

const CAPTION_MAX_LENGTH = 2200;

export function CaptionStep({ 
  state, 
  dispatch,
  onOpenCourseSearch,
  onOpenCategories,
  onOpenAiCaption,
}: CaptionStepProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const charCount = state.caption.length;
  const isNearLimit = charCount > CAPTION_MAX_LENGTH * 0.9;
  const isOverLimit = charCount > CAPTION_MAX_LENGTH;
  
  const hasCategories = state.selectedCategories.length > 0;
  
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
        const newCursorPos = beforeMention.length + displayName.length + 2; // +2 for @ and space
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

  const hasSelectedCourses = state.selectedCourses.length > 0;

  return (
    <div className="h-full flex flex-col p-5 space-y-4 bg-[#F8FAFC]">
      {/* Caption compose card - Apple-level: auto-grow, refined, expanded height */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col rounded-2xl border bg-white transition-colors shadow-sm flex-1",
          isFocused ? "border-primary ring-1 ring-primary/20" : "border-border"
        )}
      >
        {/* Textarea - grows to fill available space */}
        <Textarea
          ref={textareaRef}
          value={state.caption}
          onChange={handleCaptionChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="What's the story behind this moment? Type @ to mention someone"
          className={cn(
            "min-h-[280px] flex-1 bg-transparent border-0 resize-none",
            "focus-visible:ring-0 focus-visible:outline-none",
            "placeholder:text-muted-foreground text-sm leading-relaxed p-4 text-foreground"
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
        
        {/* Helper row */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Use @ to tag people and businesses
          </span>
          <div className="flex items-center gap-2">
            {onOpenAiCaption && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenAiCaption}
                className="h-6 px-2 text-xs gap-1"
              >
                <Sparkles className="h-3 w-3" />
                AI
              </Button>
            )}
            <span className={cn(
              "text-xs tabular-nums",
              isOverLimit ? "text-destructive font-medium" :
              isNearLimit ? "text-amber-600" :
              "text-muted-foreground"
            )}>
              {charCount}/{CAPTION_MAX_LENGTH}
            </span>
          </div>
        </div>
      </motion.div>
      
      {/* Course tag section - Multi-course support */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-2"
      >
        {/* Header with count */}
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-medium text-gray-700">Tagged Courses</span>
          {hasSelectedCourses && (
            <span className="text-xs text-gray-400">
              {state.selectedCourses.length} course{state.selectedCourses.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Course chips */}
        {hasSelectedCourses && (
          <div className="flex flex-wrap gap-2">
            {state.selectedCourses.map((course) => (
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

        {/* Add course button */}
        <button
          onClick={onOpenCourseSearch}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-dashed border-gray-300 hover:border-gray-400 hover:bg-muted/50 transition-colors text-left shadow-sm"
        >
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground">
            {hasSelectedCourses ? "Add another course" : "Tag where this was played"}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 ml-auto" />
        </button>
      </motion.div>
      
      {/* Categories card - NEW: moved from confirm step */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <button
          onClick={onOpenCategories}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left shadow-sm",
            hasCategories 
              ? "bg-primary/10 border-primary/20 hover:bg-primary/15" 
              : "bg-white border-border hover:bg-muted/50"
          )}
        >
          <Tag className={cn(
            "h-4 w-4 flex-shrink-0",
            hasCategories ? "text-primary" : "text-muted-foreground"
          )} />
          {hasCategories ? (
            <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
              {state.selectedCategories.slice(0, 3).map((cat, idx) => (
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
            <span className="text-xs text-muted-foreground/50">
              Required
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        </button>
      </motion.div>
      
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
