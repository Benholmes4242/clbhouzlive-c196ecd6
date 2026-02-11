import React, { useState, useRef, useEffect } from 'react';
import { useMixedProfiles } from '@/hooks/useMixedProfiles';
import { useFirstRunFlag } from '@/hooks/useFirstRunFlag';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useImmersiveProfile } from '@/hooks/useImmersiveProfile';
import { useNavigate } from 'react-router-dom';
import Squircle from './Squircle';

const AVATAR = { size: 96, radius: 18 };

function Skeleton() {
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div
        className="bg-muted animate-pulse"
        style={{ width: AVATAR.size, height: AVATAR.size, borderRadius: AVATAR.radius }}
      />
      <div className="h-3 w-[80px] bg-muted animate-pulse mt-2.5 rounded" />
    </div>
  );
}

export default function ShortsSuggestedProfiles() {
  const { data: creators, isLoading, error } = useMixedProfiles({ 
    limit: 24, 
    mix: { known: 0.6, suggested: 0.4 } 
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [retrying, setRetrying] = useState(false);
  const navigate = useNavigate();
  const { openImmersive } = useImmersiveProfile('', false);

  const handleAvatarClick = (userId: string) => {
    openImmersive(0); // Open immersive profile modal
    // Navigate to profile to load the immersive view
    const creator = creators.find(c => c.id === userId);
    if (creator?.username) {
      navigate(`/user/${creator.username}`);
    }
  };

  const handleLabelClick = (userId: string) => {
    const creator = creators.find(c => c.id === userId);
    if (creator?.username) {
      navigate(`/u/${creator.username}`);
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
      <div className="mt-3 px-3 mb-3">
        <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Couldn't load suggestions</p>
          <button
            onClick={handleRetry}
            className="text-sm text-foreground hover:underline font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !creators.length) {
    return (
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-3 mt-3 mb-3">
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
    <div className="relative px-4 mb-5">
      <div ref={scrollRef} className="overflow-x-auto no-scrollbar">
        <div className="flex gap-3 pr-4">
          {/* CREATOR SQUIRCLES */}
          {creators.map((creator, index) => (
            <Squircle
              key={creator.id}
              creator={creator}
              index={index}
              onAvatarClick={handleAvatarClick}
              onLabelClick={handleLabelClick}
              imageLoaded={loadedImages.has(creator.id)}
              onImageLoad={() => handleImageLoad(creator.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
