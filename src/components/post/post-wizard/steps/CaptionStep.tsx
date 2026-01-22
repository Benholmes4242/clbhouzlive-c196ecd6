// CaptionStep - Step 2: Caption + Course Tag + @Mentions
// Uses bottom sheet for mentions on mobile for better touch UX
import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { StepProps } from '../types';
import { TaggableEntity } from '@/components/post/create-moment/types';
import { MentionBottomSheet, MentionSuggestion } from './MentionBottomSheet';

interface CaptionStepProps extends StepProps {
  onOpenCourseSearch: () => void;
  onOpenAiCaption?: () => void;
}

const CAPTION_MAX_LENGTH = 2200;

export function CaptionStep({ 
  state, 
  dispatch,
  onOpenCourseSearch,
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
  
  // Handle course removal
  const handleRemoveCourse = useCallback(() => {
    dispatch({ type: 'SET_COURSE', payload: null });
  }, [dispatch]);

  return (
    <div className="h-full flex flex-col p-4 space-y-4 bg-[#F8FAFC]">
      {/* Caption compose card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex-1 flex flex-col rounded-2xl border bg-white transition-colors",
          isFocused ? "border-primary/50 ring-1 ring-primary/20" : "border-[#e2e8f0]"
        )}
      >
        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={state.caption}
          onChange={handleCaptionChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="What's the story behind this moment? Type @ to mention someone"
          className={cn(
            "flex-1 min-h-[150px] bg-transparent border-0 resize-none",
            "focus-visible:ring-0 focus-visible:outline-none",
            "placeholder:text-muted-foreground/70 text-base leading-relaxed p-4"
          )}
          maxLength={CAPTION_MAX_LENGTH + 100}
        />
        
        {/* Tagged entities chips */}
        {state.selectedTags.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Tagged:</span>
            {state.selectedTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleRemoveTag(tag.id)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
              >
                @{tag.username || tag.name}
                <X className="w-3 h-3 opacity-60 hover:opacity-100" />
              </button>
            ))}
          </div>
        )}
        
        {/* Helper row */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#e2e8f0]">
          <span className="text-xs text-muted-foreground">
            Use @ to tag people and businesses
          </span>
          <div className="flex items-center gap-2">
            {onOpenAiCaption && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenAiCaption}
                className="h-7 px-2 text-xs gap-1"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI
              </Button>
            )}
            <span className={cn(
              "text-xs tabular-nums",
              isOverLimit ? "text-destructive font-medium" :
              isNearLimit ? "text-warning" :
              "text-muted-foreground"
            )}>
              {charCount}/{CAPTION_MAX_LENGTH}
            </span>
          </div>
        </div>
      </motion.div>
      
      {/* Course tag picker row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {state.selectedCourse ? (
          <button
            onClick={onOpenCourseSearch}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors text-left"
          >
            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {state.selectedCourse.name}
              </p>
              {state.selectedCourse.region && (
                <p className="text-xs text-muted-foreground truncate">
                  {state.selectedCourse.region}, {state.selectedCourse.country}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveCourse();
              }}
              className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </button>
        ) : (
          <button
            onClick={onOpenCourseSearch}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#e2e8f0] hover:bg-[#e2e8f0]/50 transition-colors text-left"
          >
            <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              Tag where this was played
            </span>
          </button>
        )}
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
