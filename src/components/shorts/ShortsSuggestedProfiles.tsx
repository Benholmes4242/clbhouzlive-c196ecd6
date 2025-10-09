import React, { useState, useRef, useEffect } from 'react';
import { useRecommendedCreators } from '@/hooks/useRecommendedCreators';
import { useFirstRunFlag } from '@/hooks/useFirstRunFlag';
import { analyticsEvents } from '@/utils/analyticsEvents';
import Squircle from './Squircle';

const AVATAR = { size: 72, radius: 14 };

function Skeleton() {
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div
        className="bg-muted animate-pulse"
        style={{ width: AVATAR.size, height: AVATAR.size, borderRadius: AVATAR.radius }}
      />
      <div className="h-3 w-[70px] bg-muted animate-pulse mt-2 rounded" />
    </div>
  );
}

function ScrollHint({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium shadow-lg animate-pulse pointer-events-none">
      Swipe to see more →
    </div>
  );
}

export default function ShortsSuggestedProfiles() {
  const { data: creators, isLoading, error } = useRecommendedCreators(24);
  const { hasSeen, markSeen } = useFirstRunFlag('shorts-suggested');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [retrying, setRetrying] = useState(false);

  // Dismiss scroll hint on first scroll
  useEffect(() => {
    if (hasSeen || !scrollRef.current) return;

    const handleScroll = () => {
      markSeen();
    };

    const element = scrollRef.current;
    element.addEventListener('scroll', handleScroll, { once: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [hasSeen, markSeen]);

  const handleAvatarClick = (userId: string) => {
    const creator = creators.find(c => c.id === userId);
    if (creator?.username) {
      // Navigation will be handled by Squircle component, this opens immersive
      window.location.assign(`/user/${creator.username}`);
    }
  };

  const handleCreateClick = () => {
    analyticsEvents.shortsSquircle.plusClick();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        const event = new CustomEvent('open-create-moment', { detail: { files } });
        window.dispatchEvent(event);
      }
    };
    input.click();
  };

  const handleRetry = async () => {
    setRetrying(true);
    window.location.reload();
  };

  const handleImageLoad = (creatorId: string) => {
    setLoadedImages(prev => new Set([...prev, creatorId]));
  };


  // Error state
  if (error && !retrying) {
    return (
      <div className="mt-3 px-3 mb-4">
        <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Couldn't load suggestions</p>
          <button
            onClick={handleRetry}
            className="text-sm text-primary hover:underline font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !creators.length) {
    return (
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-3 mt-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (!creators.length) {
    analyticsEvents.shortsSquircle.empty();
    return null;
  }

  return (
    <div className="relative edge-fade mt-3 px-3 mb-4">
      {!hasSeen && <ScrollHint onDismiss={markSeen} />}
      
      <div ref={scrollRef} className="overflow-x-auto no-scrollbar">
        <div className="flex gap-4 pr-3">
          {/* + SQUIRCLE */}
          <div className="flex flex-col items-center flex-shrink-0">
            <button
              onClick={handleCreateClick}
              aria-label="Create moment"
              className="flex items-center justify-center bg-background border border-border shadow-sm active:scale-[0.96] transition-transform"
              style={{ width: AVATAR.size, height: AVATAR.size, borderRadius: AVATAR.radius }}
            >
              <span className="text-2xl leading-none text-foreground">＋</span>
            </button>
            <p className="text-xs text-muted-foreground mt-1 truncate w-[70px] text-center">Add</p>
          </div>

          {/* CREATOR SQUIRCLES */}
          {creators.map((creator, index) => (
            <Squircle
              key={creator.id}
              creator={creator}
              index={index}
              onAvatarClick={handleAvatarClick}
              imageLoaded={loadedImages.has(creator.id)}
              onImageLoad={() => handleImageLoad(creator.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
