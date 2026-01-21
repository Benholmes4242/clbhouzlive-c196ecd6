// CaptionStep - Step 2: Caption + Course Tag
// Polished UI with compose card wrapper, premium course picker
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
  const handleRemoveCourse = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SET_COURSE', payload: null });
  }, [dispatch]);

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Compose card wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 flex flex-col bg-muted/20 border border-border/60 rounded-2xl overflow-hidden"
      >
        {/* Textarea - borderless inside card */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={state.caption}
            onChange={handleCaptionChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="What's the story behind this moment?"
            className={cn(
              "min-h-[150px] h-full resize-none text-base leading-relaxed",
              "bg-transparent border-0 rounded-none",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-muted-foreground/70"
            )}
            maxLength={CAPTION_MAX_LENGTH + 100}
          />
        </div>
        
        {/* Footer row inside card */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
          <span className="text-xs text-muted-foreground">
            Share the story behind this moment
          </span>
          <div className="flex items-center gap-2">
            {onOpenAiCaption && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenAiCaption}
                className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
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
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        onClick={onOpenCourseSearch}
        className={cn(
          "w-full bg-muted/20 border border-border/60 rounded-2xl",
          "p-4 flex items-center gap-3 text-left",
          "hover:bg-muted/30 transition-colors"
        )}
      >
        <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {state.selectedCourse ? (
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary text-sm px-2 py-0.5 rounded-full truncate">
                {state.selectedCourse.name}
              </span>
              <button
                onClick={handleRemoveCourse}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <span className="text-muted-foreground">
              Tag where this was played
            </span>
          )}
        </div>
      </motion.button>
    </div>
  );
}

export default CaptionStep;
