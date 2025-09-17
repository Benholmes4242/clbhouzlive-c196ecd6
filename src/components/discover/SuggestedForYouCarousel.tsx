import React, { useRef, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuggestionsQueue } from '@/hooks/useSuggestionsQueue';
import SwipeableUserCard from './SwipeableUserCard';
import './SuggestedCarousel.css';

interface SuggestedForYouCarouselProps {
  onUserFollow?: (userId: string) => void;
}

const SuggestedForYouCarousel: React.FC<SuggestedForYouCarouselProps> = ({ 
  onUserFollow 
}) => {
  const { queue, loading, error, follow, dismiss, refetch } = useSuggestionsQueue();
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection observer for video autoplay
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cardId = entry.target.getAttribute('data-card-id');
          if (!cardId) return;

          if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
            setVisibleCards(prev => new Set([...prev, cardId]));
          } else {
            setVisibleCards(prev => {
              const newSet = new Set(prev);
              newSet.delete(cardId);
              return newSet;
            });
          }
        });
      },
      {
        threshold: [0, 0.7, 1],
        rootMargin: '0px'
      }
    );

    const cards = container.querySelectorAll('[data-card-id]');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [queue]);

  const handleFollow = async (userId: string) => {
    await follow(userId);
    if (onUserFollow) {
      onUserFollow(userId);
    }
  };

  const handleDismiss = async (userId: string) => {
    await dismiss(userId);
  };

  if (loading) {
    return (
      <div className="px-4 pt-1 pb-6">
        <div className="md:container md:mx-auto md:px-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Suggested users to follow
            </h3>
          </div>
          
          <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 w-40 aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pt-1 pb-6">
        <div className="md:container md:mx-auto md:px-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Suggested users to follow
            </h3>
            <button 
              onClick={refetch}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="px-4 pt-1 pb-6">
        <div className="md:container md:mx-auto md:px-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Suggested users to follow
            </h3>
          </div>
          
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="text-gray-500 dark:text-gray-400 text-center mb-4">
              <p className="font-medium">You're all caught up!</p>
              <p className="text-sm mt-1">No new suggestions right now</p>
            </div>
            <button
              onClick={refetch}
              className="pill pill--active flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh suggestions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-1 pb-6">
      <div className="md:container md:mx-auto md:px-0">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Suggested users to follow
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Swipe or tap to follow/dismiss
          </span>
        </div>

        {/* Horizontal Scrollable Cards */}
        <div 
          ref={containerRef}
          className="suggested-carousel overflow-x-auto scrollbar-hide grid grid-flow-col auto-cols-[var(--card-w)] gap-px snap-x snap-mandatory pb-2"
          style={{ touchAction: 'pan-y' }} // Allow vertical scroll
        >
          {queue.map((user) => (
            <div
              key={user.id}
              data-card-id={user.id}
              className="snap-start"
            >
              <SwipeableUserCard
                user={user}
                onFollow={handleFollow}
                onDismiss={handleDismiss}
                isVisible={visibleCards.has(user.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestedForYouCarousel;