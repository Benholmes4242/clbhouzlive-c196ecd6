import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecommendedCreators } from '@/hooks/useRecommendedCreators';
import { useImmersiveProfile } from '@/hooks/useImmersiveProfile';
import { useModalContext } from '@/contexts/ModalContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

type Props = { className?: string };

const AVATAR_SIZE = 72; // px
const AVATAR_RADIUS = 14; // px

function Skeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="bg-muted animate-pulse"
        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_RADIUS }}
      />
      <div className="h-3 w-[70px] bg-muted animate-pulse rounded" />
    </div>
  );
}

export default function ShortsSuggestedProfiles({ className }: Props) {
  const { data: creators, isLoading } = useRecommendedCreators(24);
  const navigate = useNavigate();
  const { setCreateMomentModalOpen } = useModalContext();

  const handleAvatarClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  const handleNameClick = (username?: string | null) => {
    if (!username) return;
    navigate(`/user/${username}`);
  };

  return (
    <div className={`mt-3 px-3 ${className || ''}`}>
      <div className="relative edge-fade">
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex gap-4 pr-2 py-2">
            {/* Leading "+" squircle */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <button
                aria-label="Create moment"
                onClick={() => setCreateMomentModalOpen(true)}
                className="flex items-center justify-center border border-border shadow-sm active:scale-[0.96] transition-transform bg-background hover:bg-accent"
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_RADIUS }}
              >
                <span className="text-2xl leading-none text-foreground">＋</span>
              </button>
              <p className="text-xs text-muted-foreground w-[72px] text-center truncate">Add</p>
            </div>

            {/* Loading skeletons */}
            {isLoading &&
              Array.from({ length: 10 }).map((_, i) => <Skeleton key={`sk-${i}`} />)}

            {/* Creator avatars */}
            {!isLoading &&
              creators.map((creator) => {
                const displayName = creator.display_name || creator.username || 'Creator';
                const avatarUrl = creator.profile_photo_url || undefined;

                return (
                  <div key={creator.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                    <button
                      className="border border-border shadow-sm active:scale-[0.96] transition-transform overflow-hidden bg-background hover:ring-2 hover:ring-primary/20"
                      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_RADIUS }}
                      onClick={() => handleAvatarClick(creator.id)}
                    >
                      <Avatar className="w-full h-full rounded-none">
                        <AvatarImage 
                          src={avatarUrl} 
                          alt={displayName}
                          className="object-cover w-full h-full"
                        />
                        <AvatarFallback className="rounded-none">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>

                    <button
                      className="text-xs text-foreground hover:text-primary w-[72px] text-center truncate transition-colors"
                      onClick={() => handleNameClick(creator.username)}
                      title={displayName}
                    >
                      {displayName}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
