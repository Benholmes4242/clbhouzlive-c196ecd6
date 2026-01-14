import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameParticipant } from '@/features/nearby/types';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import HcpBadge from '@/components/HcpBadge';
import { getProfilePathById } from '@/lib/profileRoutes';

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

  const handleAvatarClick = (userId: string, username?: string, creatorOnly?: boolean) => {
    const path = getProfilePathById(userId, creatorOnly, username);
    navigate(path);
  };

  return (
    <div 
      className="flex items-center gap-3 px-4 py-3 mx-4 mt-4 rounded-[14px]"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center gap-1">
        {sortedParticipants.map((participant, index) => {
          const profile = participant.user_profiles;
          const isHost = participant.user_id === hostUserId;
          
          return (
            <button
              key={participant.id}
              onClick={() => handleAvatarClick(participant.user_id, profile?.username, (profile as any)?.creator_only)}
              className="relative group"
              style={{ zIndex: sortedParticipants.length - index }}
            >
              <SquircleAvatar
                src={profile?.profile_photo_url || undefined}
                alt={profile?.display_name || 'Player'}
                size={40}
                fallback={profile?.display_name?.[0] || '?'}
                className="border-2 border-background"
              />
              {isHost && (
                <div 
                  className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-[6px] flex items-center justify-center text-[10px] font-bold text-white border border-white"
                  style={{
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  }}
                >
                  H
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex-1 flex items-center gap-2">
        <span className="font-semibold text-[14px] text-slate-800">
          {sortedParticipants.length} {sortedParticipants.length === 1 ? 'player' : 'players'}
        </span>
        <div className="flex items-center gap-1 flex-wrap text-[13px] text-slate-500">
          {sortedParticipants.map((p, i) => (
            <React.Fragment key={p.id}>
              {i > 0 && <span>•</span>}
              <HcpBadge 
                value={p.user_profiles?.handicap} 
                show={p.user_profiles?.show_handicap ?? true}
                className="text-slate-500"
              />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
