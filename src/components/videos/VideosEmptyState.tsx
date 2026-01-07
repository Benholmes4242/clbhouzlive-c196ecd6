import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideosEmptyStateProps {
  type: 'creators-you-follow' | 'search' | 'general' | 'global-explore';
  onAction?: () => void;
}

/**
 * VideosEmptyState - Empty states for different Videos tab scenarios
 */
export const VideosEmptyState: React.FC<VideosEmptyStateProps> = ({
  type,
  onAction,
}) => {
  const navigate = useNavigate();

  if (type === 'creators-you-follow') {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 bg-muted/30 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Connect with creators to see their videos here
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/golfers')}
        >
          Discover creators
        </Button>
      </div>
    );
  }

  if (type === 'global-explore') {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4 bg-muted/20 rounded-lg border border-border/40">
        <p className="text-sm text-muted-foreground text-center">
          We're new around here — and waiting for the community to upload more long-form videos (4+ minutes). Check back soon.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3 bg-muted hover:bg-muted/80 text-foreground"
          onClick={() => navigate('/discover?main=shorts')}
        >
          Watch Shorts
        </Button>
      </div>
    );
  }

  if (type === 'search') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-sm text-muted-foreground text-center">
          No videos found. Try a different search.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <p className="text-sm text-muted-foreground text-center">
        No videos available at the moment.
      </p>
    </div>
  );
};

export default VideosEmptyState;
