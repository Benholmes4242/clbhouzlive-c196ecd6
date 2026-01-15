import React from 'react';
import { Film } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideosSectionEmptyStateProps {
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * VideosSectionEmptyState - Empty state card for video sections
 * Shows when a section has no videos to display
 */
export const VideosSectionEmptyState: React.FC<VideosSectionEmptyStateProps> = ({ 
  title, 
  message = "We're new around here — and waiting for the community to upload more long-form videos (4+ minutes). Check back soon.",
  action 
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Section Header */}
      <div className="px-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>

      {/* Empty State Card */}
      <div className="mx-4 py-8 px-4 bg-muted/50 rounded-sm flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Film className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          {message}
        </p>
        {action && (
          <Button
            variant="outline"
            size="sm"
            onClick={action.onClick}
            className="rounded-full"
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
};

export default VideosSectionEmptyState;
