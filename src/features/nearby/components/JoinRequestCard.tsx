import React from 'react';
import { MapPin } from 'lucide-react';
import { GameJoinRequest } from '../hooks/useGameJoinRequests';
import HcpBadge from '@/components/HcpBadge';
import AvatarSquircle from '@/components/ui/AvatarSquircle';

interface JoinRequestCardProps {
  request: GameJoinRequest;
  onAccept: (requestId: string, gameId: string) => void;
  onDecline: (requestId: string) => void;
}

export function JoinRequestCard({ request, onAccept, onDecline }: JoinRequestCardProps) {
  const profile = request.requester_profile;
  
  if (!profile) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <AvatarSquircle
          src={profile.profile_photo_url}
          alt={profile.display_name}
          fallback={profile.display_name}
          size={48}
          ringWidth={0}
        />

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-white mb-0.5">
            {profile.display_name}
          </div>
          
          {profile.home_club && (
            <div className="flex items-center gap-1 text-[13px] text-white/70 mb-0.5">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{profile.home_club}</span>
            </div>
          )}
          
          <HcpBadge 
            value={profile.eg_handicap_index} 
            show={profile.show_handicap ?? true}
            className="text-white/60"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onDecline(request.id)}
          className="flex-1 rounded-lg bg-white/5 border border-white/20 text-white/70 text-[13px] font-medium py-2 hover:bg-white/10 transition-all"
        >
          Decline
        </button>
        <button
          onClick={() => onAccept(request.id, request.game_id)}
          className="flex-1 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 text-[13px] font-medium py-2 hover:bg-green-500/30 transition-all"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
