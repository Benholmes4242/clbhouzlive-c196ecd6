// ConfirmStep - Step 3: Review & Post
// Review cards with preview container
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Tag, Eye, Pencil, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StepProps } from '../types';

interface ConfirmStepProps extends StepProps {
  onOpenCategories: () => void;
  onOpenVisibility?: () => void;
  onEditCaption?: () => void;
}

// Review Card Component
function ReviewCard({ 
  label, 
  value, 
  onEdit 
}: { 
  label: string; 
  value: React.ReactNode; 
  onEdit?: () => void;
}) {
  return (
    <div className="px-4 py-3 bg-card rounded-xl border border-border">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
      </div>
      <div className="text-sm text-foreground">
        {value}
      </div>
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
      {/* Preview container with scrim */}
      <div className="flex-shrink-0 aspect-video max-h-[40vh] bg-muted relative overflow-hidden rounded-b-2xl">
        {coverItem ? (
          <>
            <img
              src={coverItem.previewUrl}
              alt="Post preview"
              className="w-full h-full object-cover"
            />
            {/* Bottom scrim for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Media counter pill */}
        {state.mediaItems.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm">
            <span className="text-xs text-white font-medium tabular-nums">
              1/{state.mediaItems.length}
            </span>
          </div>
        )}
        
        {/* Caption preview overlay */}
        {state.caption && (
          <div className="absolute bottom-3 left-3 right-16 max-w-[280px]">
            <p className="text-sm text-white font-medium line-clamp-2 drop-shadow-md">
              {state.caption}
            </p>
          </div>
        )}
      </div>
      
      {/* Review details */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Caption review card */}
        {state.caption && (
          <ReviewCard
            label="Caption"
            value={
              <p className="whitespace-pre-wrap line-clamp-3">
                {state.caption}
              </p>
            }
            onEdit={onEditCaption}
          />
        )}
        
        {/* Location review card */}
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
        
        {/* Categories card - required, interactive */}
        <button
          onClick={onOpenCategories}
          className={cn(
            "w-full text-left px-4 py-3 rounded-xl border transition-colors",
            hasCategories 
              ? "bg-card border-border hover:bg-muted/50" 
              : "bg-primary/5 border-primary/20 hover:bg-primary/10"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Categories
            </span>
            <span className="text-xs text-muted-foreground">
              {hasCategories ? 'Edit' : 'Required'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className={cn(
              "h-4 w-4 flex-shrink-0",
              hasCategories ? "text-primary" : "text-muted-foreground"
            )} />
            {hasCategories ? (
              <div className="flex flex-wrap gap-1">
                {state.selectedCategories.slice(0, 3).map((cat, idx) => (
                  <span 
                    key={typeof cat === 'string' ? cat : cat.id}
                    className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium"
                  >
                    {typeof cat === 'string' ? cat : cat.label}
                  </span>
                ))}
                {state.selectedCategories.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{state.selectedCategories.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-warning font-medium">
                Add categories (required)
              </span>
            )}
          </div>
        </button>
        
        {/* Visibility review card */}
        {onOpenVisibility && (
          <ReviewCard
            label="Visibility"
            value={
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{visibilityLabel}</span>
              </div>
            }
            onEdit={onOpenVisibility}
          />
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
