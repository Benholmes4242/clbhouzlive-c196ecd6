import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatHcp } from '@/lib/formatHcp';

type PlayerRowProps = {
  userId: string | null;
  displayName: string | null;
  username: string | null;
  profilePhotoUrl: string | null;
  homeClub: string | null;
  handicap: number | null;
  showHandicap: boolean | null;
  isHost: boolean;
  isGuest: boolean;
};

export function PlayerRow({
  userId,
  displayName,
  username,
  profilePhotoUrl,
  homeClub,
  handicap,
  showHandicap,
  isHost,
  isGuest,
}: PlayerRowProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (username || userId) {
      navigate(`/profile/${username || userId}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!username && !userId}
      className="w-full flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-left disabled:cursor-default"
      aria-label={`View profile for ${displayName || 'guest'}`}
    >
      <Avatar className="w-10 h-10">
        <AvatarImage src={profilePhotoUrl || undefined} alt={displayName || 'Player'} />
        <AvatarFallback className="bg-neutral-700/50 text-white text-sm">
          {displayName?.[0] || '?'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-white/90 font-medium truncate">
            {username ? `@${username}` : (displayName || 'Guest')}
          </span>
          {isHost && (
            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-medium rounded">
              Host
            </span>
          )}
          {isGuest && (
            <span className="px-1.5 py-0.5 bg-neutral-700/40 text-neutral-300 text-[10px] font-medium rounded">
              Guest
            </span>
          )}
        </div>
        
        <div className="text-[11px] text-white/60 flex items-center gap-2">
          {homeClub && <span>{homeClub}</span>}
          {homeClub && showHandicap && handicap != null && <span>•</span>}
          {showHandicap && handicap != null && (
            <span>HCP {formatHcp(handicap)}</span>
          )}
        </div>
      </div>
    </button>
  );
}
