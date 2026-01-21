// CaptionStep - Step 2: Caption + Course Tag
// Compose feel with card wrapper and helper row
import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { StepProps } from '../types';

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
  
  const charCount = state.caption.length;
  const isNearLimit = charCount > CAPTION_MAX_LENGTH * 0.9;
  const isOverLimit = charCount > CAPTION_MAX_LENGTH;
  
  // Handle caption change
  const handleCaptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_CAPTION', payload: e.target.value });
  }, [dispatch]);
  
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
          "flex-1 flex flex-col rounded-xl border bg-white transition-colors",
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
          placeholder="What's the story behind this moment?"
          className={cn(
            "flex-1 min-h-[150px] bg-transparent border-0 resize-none",
            "focus-visible:ring-0 focus-visible:outline-none",
            "placeholder:text-muted-foreground/70 text-base leading-relaxed p-4"
          )}
          maxLength={CAPTION_MAX_LENGTH + 100}
        />
        
        {/* Helper row */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#e2e8f0]">
          <span className="text-xs text-muted-foreground">
            Share the story behind this moment
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#e2e8f0] hover:bg-[#e2e8f0]/50 transition-colors text-left"
          >
            <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
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
    </div>
  );
}

export default CaptionStep;
