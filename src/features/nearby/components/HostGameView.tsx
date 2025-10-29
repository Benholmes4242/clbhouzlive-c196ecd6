import React from 'react';
import { GameBeacon } from '../hooks/useGameBeacon';
import { useGameJoinRequests } from '../hooks/useGameJoinRequests';
import { JoinRequestCard } from './JoinRequestCard';
import { MapPin, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface HostGameViewProps {
  game: GameBeacon;
  onCancelBeacon: (beaconId: string) => void;
}

export function HostGameView({ game, onCancelBeacon }: HostGameViewProps) {
  const { requests, acceptRequest, declineRequest } = useGameJoinRequests(game.id);

  const formatTeeTime = (teeTime: string | null) => {
    if (!teeTime) return 'Time TBD';
    
    const date = parseISO(teeTime);
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

  const getGameTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      '9_holes': '9 holes',
      '18_holes': '18 holes',
      'casual_golf': 'Casual golf',
      'practice': 'Practice',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* Your Game Card */}
      <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">
              Your Game
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
              <MapPin className="w-4 h-4" />
              <span className="font-medium text-white/80">{game.course_name || 'Course TBD'}</span>
            </div>
            <div className="flex items-center gap-2 text-white text-base font-semibold mb-2">
              <Clock className="w-4 h-4" />
              <span>{formatTeeTime(game.tee_time)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/60">
              <span>{getGameTypeLabel(game.game_type)}</span>
              {game.players_needed !== null && game.players_needed > 0 && (
                <>
                  <span>•</span>
                  <span className="text-green-400 font-medium">
                    Looking for {game.players_needed} more
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onCancelBeacon(game.id)}
          className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium border border-white/20 transition-all"
        >
          Cancel Game
        </button>
      </div>

      {/* Join Requests Section */}
      {requests.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-white/90">
            Requests to Join ({requests.length})
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
