import React from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

interface WriteReviewPromptProps {
  onRateClick: () => void;
}

/**
 * "Write a review" prompt card shown to users who haven't left a review yet.
 * Placed after filters and before first review card.
 */
export const WriteReviewPrompt: React.FC<WriteReviewPromptProps> = ({
  onRateClick,
}) => {
  return (
    <div className="rounded-sq-md border border-border bg-card px-4 py-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
          <Star className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Played here?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Rate this course to help the community.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 h-9 active:scale-[0.98] transition-transform"
            onClick={onRateClick}
          >
            Rate this course
          </Button>
        </div>
      </div>
    </div>
  );
};