import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ChannelSuggestion } from '@/hooks/useChannelSuggestions';
import { Button } from '@/components/ui/button';

interface ChannelSuggestionCardProps {
  suggestion: ChannelSuggestion;
  onImpression?: () => void;
  onClick?: () => void;
  className?: string;
}

const formatSubscribers = (count?: number): string => {
  if (!count) return '0 subscribers';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M subscribers`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K subscribers`;
  return `${count} subscribers`;
};

export const ChannelSuggestionCard: React.FC<ChannelSuggestionCardProps> = ({
  suggestion,
  onImpression,
  onClick,
  className = '',
}) => {
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [hasBeenViewed, setHasBeenViewed] = React.useState(false);

  // Track impression when card becomes visible
  React.useEffect(() => {
    if (!cardRef.current || hasBeenViewed) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasBeenViewed) {
          setHasBeenViewed(true);
          onImpression?.();
        }
      },
      { threshold: 0.5 }
    );

    observerRef.current.observe(cardRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [onImpression, hasBeenViewed]);

  const handleClick = () => {
    onClick?.();
    // Navigate to channel page
    window.location.href = `/channel/${suggestion.handle.replace('@', '')}`;
  };

  return (
    <div
      ref={cardRef}
      className={`group relative overflow-hidden rounded-xl bg-card cursor-pointer transition-all hover:shadow-lg ${className}`}
      onClick={handleClick}
      role="article"
      aria-label={`Suggested channel: ${suggestion.title}`}
    >
      {/* Cover Image */}
      <div className="relative w-full aspect-video overflow-hidden">
        <img
          src={suggestion.cover}
          alt=""
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Suggested label */}
        <div className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-md">
          Suggested Channel
        </div>
      </div>

      {/* Channel Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {suggestion.avatar && (
            <img
              src={suggestion.avatar}
              alt={suggestion.title}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shrink-0"
            />
          )}

          {/* Channel details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="font-semibold text-base leading-tight truncate">
                {suggestion.title}
              </h3>
              {suggestion.verified && (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              )}
            </div>
            <p className="text-sm text-white/80 mb-0.5">{suggestion.handle}</p>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <span>{formatSubscribers(suggestion.subscriberCount)}</span>
              {suggestion.videoCount && (
                <>
                  <span>•</span>
                  <span>{suggestion.videoCount} videos</span>
                </>
              )}
            </div>
          </div>

          {/* Subscribe button */}
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0 bg-white text-foreground hover:bg-white/90"
            onClick={(e) => {
              e.stopPropagation();
              // Handle subscribe
              console.log('Subscribe to', suggestion.id);
            }}
          >
            Subscribe
          </Button>
        </div>
      </div>
    </div>
  );
};
