import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ReviewPromptBannerProps {
  unratedCoursesCount: number;
  onAddReviewClick: () => void;
  isVisible: boolean;
}

const ReviewPromptBanner: React.FC<ReviewPromptBannerProps> = ({
  unratedCoursesCount,
  onAddReviewClick,
  isVisible
}) => {
  if (!isVisible || unratedCoursesCount === 0) {
    return null;
  }

  return (
    <Card className="mb-4 border-l-4 border-l-slate-500 bg-slate-50/50 dark:bg-slate-950/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-slate-100 dark:bg-slate-900/20 p-2">
              <Star className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {unratedCoursesCount} course{unratedCoursesCount > 1 ? 's' : ''} waiting for your review
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Share your experience to help other golfers
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddReviewClick}
            className="border-slate-200 text-cta-text hover:bg-slate-100 dark:border-slate-800 dark:text-cta-text-dark dark:hover:bg-slate-900/20"
          >
            Add Reviews
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewPromptBanner;