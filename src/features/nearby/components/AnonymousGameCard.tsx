import React, { useState } from 'react';
import { MapPin, Users, Clock, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useGameParticipants } from '@/features/game/hooks/useGameParticipants';
import { formatHcp } from '@/lib/formatHcp';
import { GameVisibilityBadge } from './GameVisibilityBadge';
import type { GameVisibility } from '../types';

interface AnonymousGameCardProps {
  game: {
    id: string;
    course_name: string | null;
    start_time: string;
    slots_open: number;
    slots_total: number;
    host_user_id?: string;
    visibility?: GameVisibility;
  };
  onRequestJoin: (gameId: string) => void;
  hasRequested?: boolean;
  isAccepted?: boolean;
}

export function AnonymousGameCard({ game, onRequestJoin, hasRequested, isAccepted }: AnonymousGameCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { data: participants = [] } = useGameParticipants(game.id);

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

  const slotsOpen = game.slots_open;
  const seatsFilled = game.slots_total - game.slots_open;

  const handleMessageHost = () => {
    if (game.host_user_id) {
      navigate(`/messages/${game.host_user_id}`);
    }
  };

  return (
    <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3">
      {/* Block 1: Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="text-[15px] font-semibold text-white">
              {game.course_name || 'Course TBD'}
            </div>
            {game.visibility && game.visibility !== 'public' && (
              <GameVisibilityBadge visibility={game.visibility} size="sm" />
            )}
          </div>
          <div className="text-[13px] text-white/70">
            {formatStartTime(game.start_time)}
          </div>
        </div>
        
        <div className="rounded-full bg-white/10 border border-white/20 text-white/80 text-[12px] font-medium px-2 py-1 whitespace-nowrap ml-2">
          {seatsFilled}/{game.slots_total} filled
        </div>
      </div>

      {/* Block 2: Group snapshot */}
      <div className="space-y-2 mb-3">
        {participants.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-[12px] text-white/70 mb-1">
            <span className="text-white/50">Players:</span>
            {participants.slice(0, 3).map((p, idx) => (
              <React.Fragment key={p.user_id}>
                <button
                  onClick={() => navigate(`/profile/${p.username || p.user_id}`)}
                  className="hover:text-white transition-colors"
                >
                  {p.display_name}
                  {p.show_handicap && p.eg_handicap_index != null && (
                    <span className="text-white/50"> ({formatHcp(p.eg_handicap_index)})</span>
                  )}
                </button>
                {idx < Math.min(participants.length, 3) - 1 && <span>,</span>}
              </React.Fragment>
            ))}
            {participants.length > 3 && (
              <span className="text-white/50">+{participants.length - 3} more</span>
            )}
          </div>
        )}
        <div className="text-[13px] text-white/80">{slotsOpen > 0 && (
            <span className="text-green-400 font-medium">
              {slotsOpen} spot{slotsOpen === 1 ? '' : 's'} open
            </span>
          )}
          {slotsOpen === 0 && (
            <span className="text-white/60">Game is full</span>
          )}
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[12px] text-white/50 hover:text-white/70 transition-colors"
        >
          See details
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-3 mb-3 p-3 rounded-lg bg-white/5 border border-white/10 text-[13px] text-white/70 space-y-1">
          <div>
            <span className="font-medium text-white/80">Course:</span> {game.course_name || 'TBD'}
          </div>
          <div>
            <span className="font-medium text-white/80">Seats filled:</span> {seatsFilled} of {game.slots_total}
          </div>
          <div>
            <span className="font-medium text-white/80">Seats available:</span> {slotsOpen}
          </div>
        </div>
      )}

      {/* Block 3: Footer CTA */}
      <div className="border-t border-white/10 pt-3">
        {isAccepted ? (
          <div className="space-y-2">
            <div className="text-center text-green-400 text-[14px] font-medium mb-2">
              You're in 👋
            </div>
            <button
              onClick={handleMessageHost}
              className="w-full rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 text-[13px] font-medium py-2 hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Message host
            </button>
          </div>
        ) : slotsOpen > 0 ? (
          <button
            onClick={() => onRequestJoin(game.id)}
            disabled={hasRequested}
            className="w-full rounded-lg bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:text-white/40 text-white/90 text-[13px] font-medium py-2 border border-white/20 transition-all"
          >
            {hasRequested ? 'Requested' : 'Request to Join'}
          </button>
        ) : (
          <button 
            disabled 
            className="w-full rounded-lg bg-white/5 text-white/40 text-[13px] font-medium py-2 border border-white/10"
          >
            Full
          </button>
        )}
      </div>
    </div>
  );
}
