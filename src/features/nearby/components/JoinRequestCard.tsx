import React from 'react';
import { MapPin } from 'lucide-react';
import { GameJoinRequest } from '../hooks/useGameJoinRequests';

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
    <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-12 w-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-sm font-medium overflow-hidden flex-shrink-0">
          {profile.profile_photo_url ? (
            <img 
              src={profile.profile_photo_url} 
              alt={profile.display_name}
              className="h-full w-full object-cover rounded-full" 
            />
          ) : (
            getInitials(profile.display_name)
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base text-white">
            {profile.display_name}
          </div>
          
          {profile.home_club && (
            <div className="flex items-center gap-1 text-sm text-white/60 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{profile.home_club}</span>
            </div>
          )}
          
          {profile.eg_handicap_index !== null && (
            <div className="text-sm text-white/60 mt-0.5">
              Handicap {profile.eg_handicap_index}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onDecline(request.id)}
          className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 text-[13px] font-medium border border-white/20 transition-all"
        >
          Decline
        </button>
        <button
          onClick={() => onAccept(request.id, request.game_id)}
          className="flex-1 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 text-[13px] font-medium border border-green-500/40 transition-all"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
