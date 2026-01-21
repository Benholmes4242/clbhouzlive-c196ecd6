// CaptionStep - Step 2: Caption + Course Tag
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
    <div className="h-full flex flex-col p-4">
      {/* Header prompt */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h2 className="text-lg font-semibold text-foreground">
          What went down out there?
        </h2>
        <p className="text-sm text-muted-foreground">
          Share the story behind this moment
        </p>
      </motion.div>
      
      {/* Caption textarea */}
      <div className="relative flex-1 mb-4">
        <Textarea
          ref={textareaRef}
          value={state.caption}
          onChange={handleCaptionChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Write a caption..."
          className={cn(
            "min-h-[150px] h-full resize-none text-base leading-relaxed",
            "focus-visible:ring-1 focus-visible:ring-primary",
            isOverLimit && "border-destructive focus-visible:ring-destructive"
          )}
          maxLength={CAPTION_MAX_LENGTH + 100} // Allow slight over for UX
        />
        
        {/* Character counter */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
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
      
      {/* Course tagging section */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Tag where this was played
          </span>
        </div>
        
        {state.selectedCourse ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"
          >
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
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
              onClick={handleRemoveCourse}
              className="h-6 w-6 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <Button
            variant="outline"
            onClick={onOpenCourseSearch}
            className="w-full justify-start gap-2 text-muted-foreground"
          >
            <MapPin className="h-4 w-4" />
            Search for a course...
          </Button>
        )}
      </div>
    </div>
  );
}

export default CaptionStep;
