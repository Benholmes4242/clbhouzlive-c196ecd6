import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Film, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideosEmptyStateProps {
  type: 'creators-you-follow' | 'search' | 'general' | 'global-explore';
  onAction?: () => void;
}

/**
 * VideosEmptyState - Enhanced empty states for different Videos tab scenarios
 */
export const VideosEmptyState: React.FC<VideosEmptyStateProps> = ({
  type,
  onAction,
}) => {
  const navigate = useNavigate();

  if (type === 'creators-you-follow') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 bg-card rounded-2xl border border-border/50 shadow-sm">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        
        {/* Message */}
        <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-xs mb-6">
          Connect with creators to see their videos here
        </p>
        
        {/* CTA Button */}
        <Button
          variant="default"
          size="sm"
          className="px-5 py-2.5 rounded-xl font-semibold shadow-sm"
          onClick={() => navigate('/golferstofollow')}
        >
          Discover creators
        </Button>
      </div>
    );
  }

  if (type === 'global-explore') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 bg-card rounded-2xl border border-border/50 shadow-sm">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4">
          <Film className="h-8 w-8 text-muted-foreground" />
        </div>
        
        {/* Message */}
        <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-xs mb-6">
          We're new around here — and waiting for the community to upload more long-form videos (4+ minutes). Check back soon.
        </p>
        
        {/* CTA Button */}
        <Button
          variant="secondary"
          size="sm"
          className="px-5 py-2.5 rounded-xl font-semibold shadow-sm"
          onClick={() => navigate('/discover?main=shorts')}
        >
          <Play className="h-4 w-4 mr-1.5" />
          Watch Shorts
        </Button>
      </div>
    );
  }

  if (type === 'search') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 bg-card rounded-2xl border border-border/50 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4">
          <Film className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          No videos found. Try a different search.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 bg-card rounded-2xl border border-border/50 shadow-sm">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4">
        <Film className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground text-center">
        No videos available at the moment.
      </p>
    </div>
  );
};

export default VideosEmptyState;
