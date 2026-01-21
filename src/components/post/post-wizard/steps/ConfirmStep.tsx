// ConfirmStep - Step 3: Review & Post
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Tag, Eye, ChevronRight, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StepProps } from '../types';

interface ConfirmStepProps extends StepProps {
  onOpenCategories: () => void;
  onOpenVisibility?: () => void;
}

export function ConfirmStep({ 
  state, 
  dispatch,
  onOpenCategories,
  onOpenVisibility,
}: ConfirmStepProps) {
  const hasCategories = state.selectedCategories.length > 0;
  
  // Get the cover image for preview
  const coverItem = useMemo(() => {
    return state.mediaItems[state.coverIndex] || state.mediaItems[0];
  }, [state.mediaItems, state.coverIndex]);
  
  // Visibility label
  const visibilityLabel = state.visibility === 'anyone' 
    ? 'Everyone' 
    : state.visibility === 'followers' 
      ? 'Followers only' 
      : 'Only me';

  return (
    <div className="h-full flex flex-col">
      {/* Media preview - simplified for now */}
      <div className="flex-shrink-0 aspect-video max-h-[40vh] bg-muted relative overflow-hidden">
        {coverItem ? (
          <img
            src={coverItem.previewUrl}
            alt="Post preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {state.mediaItems.length > 1 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
            <span className="text-xs text-white font-medium">
              1/{state.mediaItems.length}
            </span>
          </div>
        )}
      </div>
      
      {/* Review details */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Caption preview */}
        {state.caption && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-muted/50"
          >
            <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">
              {state.caption}
            </p>
            {state.caption.length > 200 && (
              <p className="text-xs text-muted-foreground mt-1">
                ...and more
              </p>
            )}
          </motion.div>
        )}
        
        {/* Course tag */}
        {state.selectedCourse && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground">
              {state.selectedCourse.name}
            </span>
          </div>
        )}
        
        {/* Categories */}
        <button
          onClick={onOpenCategories}
          className={cn(
            "w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors",
            hasCategories 
              ? "bg-primary/10 border border-primary/20" 
              : "bg-muted hover:bg-muted/80"
          )}
        >
          <div className="flex items-center gap-2">
            <Tag className={cn(
              "h-4 w-4",
              hasCategories ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-medium",
              hasCategories ? "text-foreground" : "text-muted-foreground"
            )}>
              {hasCategories 
                ? `${state.selectedCategories.length} ${state.selectedCategories.length === 1 ? 'category' : 'categories'} selected`
                : 'Add categories (required)'
              }
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        
        {/* Visibility */}
        {onOpenVisibility && (
          <button
            onClick={onOpenVisibility}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">
                {visibilityLabel}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      
      {/* Category requirement notice */}
      {!hasCategories && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 px-4 pb-4"
        >
          <p className="text-xs text-center text-muted-foreground">
            Select at least one category to post
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default ConfirmStep;
