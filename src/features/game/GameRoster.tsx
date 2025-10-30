import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameParticipant } from '@/features/nearby/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import HcpBadge from '@/components/HcpBadge';

interface GameRosterProps {
  participants: GameParticipant[];
  hostUserId: string;
}

export function GameRoster({ participants, hostUserId }: GameRosterProps) {
  const navigate = useNavigate();

  // Sort: host first, then others by join time
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.user_id === hostUserId) return -1;
    if (b.user_id === hostUserId) return 1;
    return new Date(a.joined_at || a.created_at).getTime() - new Date(b.joined_at || b.created_at).getTime();
  });

  const handleAvatarClick = (username?: string, userId?: string) => {
    if (username) {
      navigate(`/profile/${username}`);
    } else if (userId) {
      // Fallback: navigate with user ID if no username
      navigate(`/profile/${userId}`);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
      <div className="flex items-center gap-1">
        {sortedParticipants.map((participant, index) => {
          const profile = participant.user_profiles;
          const isHost = participant.user_id === hostUserId;
          
          return (
            <button
              key={participant.id}
              onClick={() => handleAvatarClick(profile?.username, participant.user_id)}
              className="relative group"
              style={{ zIndex: sortedParticipants.length - index }}
            >
              <Avatar className="w-10 h-10 border-2 border-background ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                <AvatarImage 
                  src={profile?.profile_photo_url || undefined} 
                  alt={profile?.display_name || 'Player'}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {profile?.display_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              {isHost && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground border border-background">
                  H
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex-1 flex items-center gap-2 text-sm text-muted-foreground">
        <span>{sortedParticipants.length} {sortedParticipants.length === 1 ? 'player' : 'players'}</span>
        <div className="flex items-center gap-1 flex-wrap">
          {sortedParticipants.map((p, i) => (
            <React.Fragment key={p.id}>
              {i > 0 && <span>•</span>}
              <HcpBadge 
                value={p.user_profiles?.handicap} 
                show={p.user_profiles?.show_handicap ?? true}
                className="text-muted-foreground"
              />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
