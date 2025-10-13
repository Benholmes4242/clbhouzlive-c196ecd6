import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChannelSuggestion } from '@/hooks/useChannelSuggestions';
import { useInView } from 'react-intersection-observer';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface ChannelSuggestionCardProps {
  suggestion: ChannelSuggestion;
  className?: string;
}

const formatSubscribers = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

export const ChannelSuggestionCard: React.FC<ChannelSuggestionCardProps> = ({ 
  suggestion,
  className = '' 
}) => {
  const [isSubscribed, setIsSubscribed] = useState(suggestion.isSubscribed || false);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  
  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true
  });

  // Track impression when 50% visible
  useEffect(() => {
    if (inView && !hasTrackedImpression) {
      analyticsEvents.track('channel_suggestion_impression', {
        channelId: suggestion.id,
        channelHandle: suggestion.handle,
        channelTitle: suggestion.title
      });
      setHasTrackedImpression(true);
    }
  }, [inView, hasTrackedImpression, suggestion]);

  const handleSubscribe = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSubscribed(!isSubscribed);
    
    analyticsEvents.track('channel_suggestion_click', {
      channelId: suggestion.id,
      channelHandle: suggestion.handle,
      channelTitle: suggestion.title,
      action: isSubscribed ? 'unsubscribe' : 'subscribe'
    });
  };

  const handleCardClick = () => {
    analyticsEvents.track('channel_suggestion_click', {
      channelId: suggestion.id,
      channelHandle: suggestion.handle,
      channelTitle: suggestion.title,
      action: 'card_click'
    });
    // Navigate to channel page
    console.log('Navigate to channel:', suggestion.handle);
  };

  return (
    <div 
      ref={ref}
      className={`${className}`}
      aria-label="Suggested channel"
    >
      {/* Label */}
      <div className="px-2 pb-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Suggested channel
        </p>
      </div>

      {/* Card */}
      <div
        onClick={handleCardClick}
        className="relative bg-card rounded overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Cover Image */}
        <div className="absolute inset-0">
          <img
            src={suggestion.cover}
            alt={`${suggestion.title} channel cover`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <div className="flex items-end gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={suggestion.avatar}
                alt={`${suggestion.title} avatar`}
                className="w-12 h-12 rounded-full border-2 border-white/80"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-white">
              <h3 className="font-semibold text-base leading-tight truncate mb-0.5">
                {suggestion.title}
              </h3>
              <p className="text-xs text-white/80 truncate mb-1">
                {suggestion.handle}
              </p>
              <p className="text-xs text-white/70">
                {formatSubscribers(suggestion.subscriberCount)} subscribers
              </p>
            </div>

            {/* Subscribe Button */}
            <div className="flex-shrink-0">
              <Button
                onClick={handleSubscribe}
                variant={isSubscribed ? 'outline' : 'default'}
                size="sm"
                className={`
                  px-4 h-8 font-medium text-sm
                  ${isSubscribed 
                    ? 'bg-transparent text-white border-white/60 hover:bg-white/10' 
                    : 'bg-white text-primary hover:bg-white/90'
                  }
                `}
                aria-label={isSubscribed ? `Unsubscribe from ${suggestion.title}` : `Subscribe to ${suggestion.title}`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
