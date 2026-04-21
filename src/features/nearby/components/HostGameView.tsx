import React, { useState } from 'react';
import { GameBeacon } from '../hooks/useGameBeacon';
import { useGameJoinRequests } from '../hooks/useGameJoinRequests';
import { JoinRequestCard } from './JoinRequestCard';
import { MapPin, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useGameParticipants } from '@/features/game/hooks/useGameParticipants';
import { useNavigate } from 'react-router-dom';
import { formatHcp } from '@/lib/formatHcp';
import { TapButton } from '@/components/ui/TapButton';
import { Squircle } from '@/components/ui/squircle';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getProfilePathById } from '@/lib/profileRoutes';

interface HostGameViewProps {
  game: GameBeacon;
  onCancelBeacon: (beaconId: string) => void;
}

export function HostGameView({ game, onCancelBeacon }: HostGameViewProps) {
  const { requests, acceptRequest, declineRequest } = useGameJoinRequests(game.id);
  const { data: participants = [] } = useGameParticipants(game.id);
  const navigate = useNavigate();
  const [isCancelling, setIsCancelling] = useState(false);

  const formatStartTime = (startTime: string) => {
    const date = parseISO(startTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today • ${format(date, 'h:mm a')}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow • ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'EEE, MMM d • h:mm a');
    }
  };

  const slotsOpen = game.slots_open || 0;

  return (
    <div className="space-y-4">
      {/* Your Game Card */}
      <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-white mb-0.5">
                {game.course_name || 'Course TBD'}
              </div>
              <div className="text-[13px] text-white/70">
                {formatStartTime(game.start_time)}
              </div>
            </div>
            
            <div className="rounded-full bg-white/10 border border-white/20 text-white/80 text-[12px] font-medium px-2 py-1 whitespace-nowrap ml-2">
              {game.slots_total - game.slots_open}/{game.slots_total} filled
            </div>
          </div>

          {/* Game info */}
          <div className="space-y-1">
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {participants.map((p) => (
                  <button
                    key={p.user_id}
                    onClick={() => navigate(getProfilePathById(p.user_id, (p as any).creator_only, p.username))}
                    className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <SquircleAvatar
                      src={p.profile_photo_url}
                      alt={p.display_name}
                      userId={p.user_id}
                      size={20}
                      hideRing
                    />
                    <span className="text-[11px] text-white/90">{p.display_name}</span>
                    {p.show_handicap && p.eg_handicap_index != null && (
                      <span className="text-[10px] text-white/60">({formatHcp(p.eg_handicap_index)})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {slotsOpen > 0 && (
              <div className="text-[13px] text-green-400 font-medium">
                {slotsOpen} spot{slotsOpen === 1 ? '' : 's'} open
              </div>
            )}
            <div className="text-[12px] text-white/50">
              You're hosting this round
            </div>
          </div>

          {/* Cancel button */}
          <TapButton
            onClick={async () => {
              setIsCancelling(true);
              await onCancelBeacon(game.id);
              setIsCancelling(false);
            }}
            disabled={isCancelling}
            className="w-full rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[12px] font-medium px-3 py-2 hover:bg-red-500/15 transition-all disabled:opacity-50"
            aria-label="Cancel game"
          >
            {isCancelling ? 'Cancelling…' : 'Cancel Game'}
          </TapButton>
        </div>
      </div>

      {/* Join Requests Section */}
      {requests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-white/90">
              Join requests
            </span>
            <div className="bg-white/10 border border-white/20 text-white/80 text-[12px] rounded-full px-2 py-[2px]">
              {requests.length}
            </div>
          </div>
          
          {requests.map((request) => (
            <JoinRequestCard
              key={request.id}
              request={request}
              onAccept={acceptRequest}
              onDecline={declineRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}
