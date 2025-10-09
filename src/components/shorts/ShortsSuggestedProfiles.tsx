import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecommendedCreators } from '@/hooks/useRecommendedCreators';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const AVATAR = { size: 72, radius: 14 };

function Skeleton() {
  return (
    <div className="flex flex-col items-center">
      <div
        className="bg-muted animate-pulse"
        style={{ width: AVATAR.size, height: AVATAR.size, borderRadius: AVATAR.radius }}
      />
      <div className="h-3 w-[70px] bg-muted animate-pulse mt-2 rounded" />
    </div>
  );
}

export default function ShortsSuggestedProfiles() {
  const { data: creators, isLoading } = useRecommendedCreators(24);
  const navigate = useNavigate();

  const handleAvatarClick = (userId: string) => {
    // Navigate to user profile which will auto-open immersive mode
    const creator = creators.find(c => c.id === userId);
    if (creator?.username) {
      navigate(`/user/${creator.username}`);
    }
  };

  const handleNameClick = (username?: string | null) => {
    if (!username) return;
    navigate(`/user/${username}`);
  };

  const handleCreateClick = () => {
    // Create a file input and trigger it
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        // Trigger the bottom navigation's file handler
        const event = new CustomEvent('open-create-moment', { detail: { files } });
        window.dispatchEvent(event);
      }
    };
    input.click();
  };

  if (isLoading && !creators.length) {
    return (
      <div className="flex gap-4 overflow-x-auto no-scrollbar px-3 mt-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (!creators.length) return null;

  return (
    <div className="relative edge-fade mt-3 px-3 mb-4">
      <div className="overflow-x-auto no-scrollbar">
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
          {creators.map((creator) => {
            const name = creator.display_name || creator.username || 'Creator';
            const initials = name.slice(0, 2).toUpperCase();

            return (
              <div key={creator.id} className="flex flex-col items-center flex-shrink-0">
                <button
                  className="overflow-hidden border border-border shadow-sm bg-background active:scale-[0.96] transition-transform"
                  onClick={() => handleAvatarClick(creator.id)}
                  aria-label={`View ${name}'s profile`}
                  style={{ width: AVATAR.size, height: AVATAR.size, borderRadius: AVATAR.radius }}
                >
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarImage
                      src={creator.profile_photo_url || undefined}
                      alt={name}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-none text-lg font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>

                <button
                  onClick={() => handleNameClick(creator.username)}
                  className="text-xs text-foreground mt-1 truncate w-[70px] text-center hover:text-primary transition-colors"
                  title={name}
                >
                  {name}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
