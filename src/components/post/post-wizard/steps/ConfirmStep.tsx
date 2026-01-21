// ConfirmStep - Step 3: Review & Post
// Polished UI with preview container scrim, ReviewCard components
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Tag, Eye, ChevronRight, Image, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StepProps } from '../types';
import { Button } from '@/components/ui/button';

interface ConfirmStepProps extends StepProps {
  onOpenCategories: () => void;
  onOpenVisibility?: () => void;
  onEditCaption?: () => void;
}

// ReviewCard component for consistent review row styling
function ReviewCard({ 
  label, 
  value, 
  onEdit,
  required,
  fulfilled,
}: {
  label: string;
  value: React.ReactNode;
  onEdit?: () => void;
  required?: boolean;
  fulfilled?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-start justify-between p-3 rounded-xl",
      "bg-muted/30 border border-border/40"
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          {required && !fulfilled && (
            <span className="text-xs text-warning font-medium">Required</span>
          )}
        </div>
        <div className="text-sm text-foreground">
          {value}
        </div>
      </div>
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Edit
        </Button>
      )}
    </div>
  );
}

export function ConfirmStep({ 
  state, 
  dispatch,
  onOpenCategories,
  onOpenVisibility,
  onEditCaption,
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
      {/* Preview container with gradient scrim */}
      <div className="flex-shrink-0 aspect-video max-h-[35vh] bg-muted relative overflow-hidden rounded-b-2xl">
        {coverItem ? (
          <>
            <img
              src={coverItem.previewUrl}
              alt="Post preview"
              className="w-full h-full object-cover"
            />
            {/* Gradient scrim overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Media counter */}
        {state.mediaItems.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm">
            <span className="text-xs text-white font-medium tabular-nums">
              1/{state.mediaItems.length}
            </span>
          </div>
        )}
      </div>
      
      {/* Review cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Caption card */}
        {state.caption ? (
          <ReviewCard
            label="Caption"
            value={
              <p className="whitespace-pre-wrap line-clamp-3">
                {state.caption}
              </p>
            }
            onEdit={onEditCaption}
          />
        ) : (
          <ReviewCard
            label="Caption"
            value={
              <span className="text-muted-foreground italic">No caption added</span>
            }
            onEdit={onEditCaption}
          />
        )}
        
        {/* Location card */}
        {state.selectedCourse && (
          <ReviewCard
            label="Location"
            value={
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{state.selectedCourse.name}</span>
              </div>
            }
          />
        )}
        
        {/* Categories card - interactive */}
        <motion.button
          onClick={onOpenCategories}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left",
            hasCategories 
              ? "bg-primary/5 border border-primary/20" 
              : "bg-muted/30 border border-border/40 hover:bg-muted/50"
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Categories
              </span>
              {!hasCategories && (
                <span className="text-xs text-warning font-medium">Required</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Tag className={cn(
                "h-4 w-4 flex-shrink-0",
                hasCategories ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-sm",
                hasCategories ? "text-foreground" : "text-muted-foreground"
              )}>
                {hasCategories 
                  ? `${state.selectedCategories.length} ${state.selectedCategories.length === 1 ? 'category' : 'categories'} selected`
                  : 'Select at least one category'
                }
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </motion.button>
        
        {/* Visibility card - interactive */}
        {onOpenVisibility && (
          <motion.button
            onClick={onOpenVisibility}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Visibility
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground">
                  {visibilityLabel}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </motion.button>
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
            Tap categories above to complete your post
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default ConfirmStep;
