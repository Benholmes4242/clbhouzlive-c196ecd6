import React, { useState } from 'react';
import { MapPin, Clock, ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Game } from '../../types';
import { formatExpires } from '@/lib/formatExpires';
import { useMinuteTick } from '@/hooks/useMinuteTick';
import { useGameParticipants } from '@/features/game/hooks/useGameParticipants';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PlayerRow } from './PlayerRow';
import { TapButton } from '@/components/ui/TapButton';

type GameCardProps = {
  game: Game;
  isHosting: boolean;
  onCancel: () => void;
  onLeave: () => void;
  onInvite?: () => void;
  onEdit?: () => void;
  onMessageHost?: () => void;
};

export function GameCard({
  game,
  isHosting,
  onCancel,
  onLeave,
  onInvite,
  onEdit,
  onMessageHost,
}: GameCardProps) {
  useMinuteTick(); // Auto-refresh expiry time
  const [isExpanded, setIsExpanded] = useState(false);
  const [openHost, setOpenHost] = useState(true);
  const [openMembers, setOpenMembers] = useState(true);
  
  const { data: participants = [] } = useGameParticipants(game.id);
  const { data: hostProfile } = useUserProfile(game.host_user_id);

  // Group participants
  const hostGroup = participants.filter(p => p.user_id === game.host_user_id);
  const memberGroup = participants.filter(p => p.user_id && p.user_id !== game.host_user_id);
  
  // Ensure host shows even if not in participants
  const hasHost = hostGroup.length > 0;
  const displayHostGroup = hasHost ? hostGroup : (hostProfile ? [{
    user_id: hostProfile.id,
    role: 'host' as const,
    state: 'accepted' as const,
    display_name: hostProfile.display_name,
    username: hostProfile.username,
    profile_photo_url: hostProfile.profile_photo_url,
    home_club: hostProfile.home_club,
    eg_handicap_index: hostProfile.eg_handicap_index,
    show_handicap: hostProfile.show_handicap,
  }] : []);

  const seatsFilled = game.slots_total - game.slots_open;
  
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

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      role="button"
      aria-expanded={isExpanded}
      className="rounded-2xl bg-white/[0.04] border border-white/10 shadow-[0_20px_48px_rgba(0,0,0,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40 transition-all"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleExpand();
        }
      }}
    >
      {/* Header & Meta - clickable to expand/collapse */}
      <button
        onClick={toggleExpand}
        className="w-full text-left p-4 space-y-3 hover:bg-white/[0.02] rounded-t-2xl transition-colors"
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-semibold text-white/95 mb-1 truncate">
              {game.course_name || 'Course TBD'}
            </h3>
          </div>
          
          <div 
            className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-[12px] font-medium whitespace-nowrap border border-white/15"
            aria-label={`${seatsFilled} of ${game.slots_total} spots filled`}
          >
            {seatsFilled}/{game.slots_total} filled
          </div>
        </div>

        {/* Meta row */}
        <div className="space-y-1.5 text-[14px] text-white/70">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-white/40 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{game.course_name || 'Course TBD'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/40 flex-shrink-0" aria-hidden="true" />
            <span>{formatStartTime(game.start_time)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/40 flex-shrink-0" aria-hidden="true" />
            <span>{formatExpires(game.expires_at)}</span>
          </div>
        </div>

        {/* Chevron */}
        <div className="flex items-center justify-center pt-1">
          <ChevronDown
            className={`w-4 h-4 text-white/40 transition-transform duration-200 ease-out ${
              isExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-4">
          {/* Note */}
          {game.note && (
            <div className="text-[13px] text-white/70 bg-white/5 rounded-lg p-3">
              <div className="font-medium text-white/80 mb-1">Note:</div>
              {game.note}
            </div>
          )}

          {/* Players section */}
          <div className="space-y-2">
            {/* HOST */}
            {displayHostGroup.length > 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setOpenHost(!openHost)}
                  aria-expanded={openHost}
                  className="w-full flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-left text-xs uppercase tracking-wide text-white/60 hover:bg-white/10 transition-colors"
                >
                  <span>Host</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]">{displayHostGroup.length}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-150 ${
                        openHost ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                </button>

                {openHost && (
                  <div className="space-y-2">
                    {displayHostGroup.map((p) => (
                      <PlayerRow
                        key={p.user_id}
                        userId={p.user_id}
                        displayName={p.display_name || null}
                        username={p.username || null}
                        profilePhotoUrl={p.profile_photo_url || null}
                        homeClub={p.home_club || null}
                        handicap={p.eg_handicap_index || null}
                        showHandicap={p.show_handicap || false}
                        isHost={true}
                        isGuest={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MEMBERS */}
            {memberGroup.length > 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setOpenMembers(!openMembers)}
                  aria-expanded={openMembers}
                  className="w-full flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-left text-xs uppercase tracking-wide text-white/60 hover:bg-white/10 transition-colors"
                >
                  <span>Members</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]">{memberGroup.length}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-150 ${
                        openMembers ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                </button>

                {openMembers && (
                  <div className="space-y-2">
                    {memberGroup.map((p) => (
                      <PlayerRow
                        key={p.user_id}
                        userId={p.user_id}
                        displayName={p.display_name || null}
                        username={p.username || null}
                        profilePhotoUrl={p.profile_photo_url || null}
                        homeClub={p.home_club || null}
                        handicap={p.eg_handicap_index || null}
                        showHandicap={p.show_handicap || false}
                        isHost={false}
                        isGuest={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-2 pt-2">
            {isHosting ? (
              <>
                {onInvite && (
                  <TapButton
                    onClick={onInvite}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/14 active:bg-white/18 border border-white/15 text-sm font-medium text-white/90 transition-colors"
                  >
                    Invite
                  </TapButton>
                )}
                {onEdit && (
                  <TapButton
                    onClick={onEdit}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/14 active:bg-white/18 border border-white/15 text-sm font-medium text-white/90 transition-colors"
                  >
                    Edit
                  </TapButton>
                )}
                <TapButton
                  onClick={onCancel}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/20 text-sm font-medium text-red-400 transition-colors"
                >
                  Cancel
                </TapButton>
              </>
            ) : (
              <>
                {onMessageHost && (
                  <TapButton
                    onClick={onMessageHost}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/14 active:bg-white/18 border border-white/15 text-sm font-medium text-white/90 transition-colors"
                  >
                    Message Host
                  </TapButton>
                )}
                <TapButton
                  onClick={onLeave}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/20 text-sm font-medium text-red-400 transition-colors"
                >
                  Leave Game
                </TapButton>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
