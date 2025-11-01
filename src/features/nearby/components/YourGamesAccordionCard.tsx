import React, { useState } from 'react';
import { MapPin, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Game } from '../types';
import { format, parseISO } from 'date-fns';
import { useGameParticipants } from '@/features/game/hooks/useGameParticipants';
import { formatHcp } from '@/lib/formatHcp';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { GameParticipant as Participant } from '@/features/game/hooks/useGameParticipants';

type UiParticipant = {
  user_id: string | null;
  guest_name?: string | null;
  role: 'host' | 'player' | 'guest';
  state: 'invited' | 'accepted' | 'declined' | 'removed';
  display_name: string;
  username?: string;
  profile_photo_url?: string;
  eg_handicap_index?: number | null;
  show_handicap?: boolean;
  home_club?: string | null;
  is_guest?: boolean;
};

interface YourGamesAccordionCardProps {
  game: Game;
  isHosting: boolean;
  onCancel: () => void;
  onLeave: () => void;
}

// Chevron component for collapsible sections
function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
      <path d="M5.8 7.2l4.2 4.2 4.2-4.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function YourGamesAccordionCard({ game, isHosting, onCancel, onLeave }: YourGamesAccordionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openHost, setOpenHost] = useState(true);
  const [openMembers, setOpenMembers] = useState(false);
  const [openGuests, setOpenGuests] = useState(false);
  const { data: participants = [] } = useGameParticipants(game.id);
  const navigate = useNavigate();

  // Force-show participants: ensure host and current user rows even if participants query is empty
  const { user } = useSupabaseSession();
  const { data: hostProfile } = useUserProfile(game.host_user_id);
  const { data: currentProfile } = useUserProfile(user?.id || null);

  const baseParticipants = participants;
  const hasHostInParticipants = baseParticipants.some((p) => p.role === 'host');

  const forcedHost: UiParticipant[] = !hasHostInParticipants && hostProfile ? [
    {
      user_id: hostProfile.id,
      role: 'host',
      state: 'accepted',
      display_name: hostProfile.display_name,
      username: hostProfile.username,
      profile_photo_url: hostProfile.profile_photo_url || undefined,
      eg_handicap_index: hostProfile.eg_handicap_index,
      show_handicap: hostProfile.show_handicap,
      home_club: hostProfile.home_club,
      guest_name: null,
      is_guest: false,
    },
  ] : [];

  const isCurrentInParticipants = !!user?.id && baseParticipants.some((p) => p.user_id === user?.id);
  const shouldAddSelf = !!user?.id && !isCurrentInParticipants && !!currentProfile && (!isHosting || !hostProfile);
  const forcedSelf: UiParticipant[] = shouldAddSelf ? [
    {
      user_id: currentProfile!.id,
      role: isHosting ? 'host' : 'player',
      state: 'accepted',
      display_name: currentProfile!.display_name,
      username: currentProfile!.username,
      profile_photo_url: currentProfile!.profile_photo_url || undefined,
      eg_handicap_index: currentProfile!.eg_handicap_index,
      show_handicap: currentProfile!.show_handicap,
      home_club: currentProfile!.home_club,
      guest_name: null,
      is_guest: false,
    },
  ] : [];

  const displayParticipants = [...forcedHost, ...baseParticipants, ...forcedSelf];

  // Deduplicate by user_id/guest_name, then sort Host → Members → Guests
  const keyOf = (p: UiParticipant) => `${p.user_id ?? 'guest'}:${p.guest_name ?? ''}`;
  const dedupMap = new Map<string, UiParticipant>();
  displayParticipants.forEach(p => {
    const k = keyOf(p);
    if (!dedupMap.has(k)) dedupMap.set(k, p);
  });
  const deduped = Array.from(dedupMap.values());

  const rank = (p: UiParticipant, hostUserId: string) => {
    if (p.user_id === hostUserId) return 0;     // Host first
    if (p.user_id) return 1;                    // Members next
    return 2;                                   // Guests last
  };

  const participantsSorted = deduped.sort((a, b) => 
    rank(a, game.host_user_id) - rank(b, game.host_user_id)
  );

  // Group by role
  const hostGroup = participantsSorted.filter(p => p.user_id === game.host_user_id);
  const memberGroup = participantsSorted.filter(p => p.user_id && p.user_id !== game.host_user_id);
  const guestGroup = participantsSorted.filter(p => !p.user_id);

  const participantsCount = participantsSorted.length;

  // Render helper for person row
  const renderPersonRow = (p: UiParticipant, isHost: boolean) => {
    return (
      <button
        key={keyOf(p)}
        onClick={() => {
          if (p.username || p.user_id) {
            navigate(`/profile/${p.username || p.user_id}`);
          }
        }}
        className="w-full flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-left"
      >
        <Avatar className="w-10 h-10">
          <AvatarImage src={p.profile_photo_url || undefined} alt={p.display_name} />
          <AvatarFallback className="bg-neutral-700/50 text-white text-sm">
            {p.display_name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-white/90 font-medium truncate">
              {p.username ? `@${p.username}` : (p.display_name || p.guest_name || 'Guest')}
            </span>
            {isHost && (
              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-medium rounded">
                Host
              </span>
            )}
            {!p.user_id && (
              <span className="px-1.5 py-0.5 bg-neutral-700/40 text-neutral-300 text-[10px] font-medium rounded">
                Guest
              </span>
            )}
          </div>
          <div className="text-[11px] text-white/60 flex items-center gap-2">
            {p.home_club && <span>{p.home_club}</span>}
            {p.home_club && p.show_handicap && p.eg_handicap_index != null && <span>•</span>}
            {p.show_handicap && p.eg_handicap_index != null && (
              <span>HCP {formatHcp(p.eg_handicap_index)}</span>
            )}
          </div>
        </div>
      </button>
    );
  };

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

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const seatsFilled = game.slots_total - game.slots_open;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-[15px] font-semibold text-white/95 mb-0.5">
            {game.course_name || 'Course TBD'}
          </div>
          <div className="text-[13px] text-white/60">
            {isHosting ? "You're hosting this round" : "You're playing this round"}
          </div>
        </div>
        
        <div className="rounded-full bg-white/10 border border-white/20 text-white/80 text-[12px] font-medium px-2 py-1 whitespace-nowrap ml-2">
          {seatsFilled}/{game.slots_total} filled
        </div>
      </div>

      {/* Expand/Collapse button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white/80 transition-colors"
        aria-expanded={isExpanded}
      >
        <span>See details</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          {/* Note */}
          {game.note && (
            <div className="text-[13px] text-white/70 bg-white/5 rounded-lg p-3">
              <div className="font-medium text-white/80 mb-1">Note:</div>
              {game.note}
            </div>
          )}

          {/* Details */}
          <div className="space-y-2 text-[13px]">
            <div className="flex items-center gap-2 text-white/70">
              <MapPin className="w-4 h-4 text-white/40" />
              <span>{game.course_name || 'Course TBD'}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Clock className="w-4 h-4 text-white/40" />
              <span>{formatStartTime(game.start_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Clock className="w-4 h-4 text-white/40" />
              <span>Expires in {getTimeRemaining(game.expires_at)}</span>
            </div>
          </div>

          {/* Players */}
          <div className="space-y-2">
            <div className="text-[13px] font-medium text-white/80">Players ({participantsCount})</div>
            
            {/* HOST */}
            {hostGroup.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setOpenHost(v => !v)}
                  aria-expanded={openHost}
                  className="mb-2 flex w-full items-center justify-between rounded-md bg-white/5 px-3 py-2 text-left text-xs uppercase tracking-wide text-white/60 hover:bg-white/10 transition-colors"
                >
                  <span>Host</span>
                  <div className="flex items-center gap-2 text-white/60">
                    <span className="text-[11px]">{hostGroup.length}</span>
                    <Chevron open={openHost} />
                  </div>
                </button>

                {openHost && (
                  <div className="flex flex-col gap-2 mb-2">
                    {hostGroup.map(p => renderPersonRow(p, true))}
                  </div>
                )}
              </>
            )}

            {/* MEMBERS */}
            {memberGroup.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setOpenMembers(v => !v)}
                  aria-expanded={openMembers}
                  className="mt-2 mb-2 flex w-full items-center justify-between rounded-md bg-white/5 px-3 py-2 text-left text-xs uppercase tracking-wide text-white/60 hover:bg-white/10 transition-colors"
                >
                  <span>Members</span>
                  <div className="flex items-center gap-2 text-white/60">
                    <span className="text-[11px]">{memberGroup.length}</span>
                    <Chevron open={openMembers} />
                  </div>
                </button>

                {openMembers && (
                  <div className="flex flex-col gap-2 mb-2">
                    {memberGroup.map(p => renderPersonRow(p, false))}
                  </div>
                )}
              </>
            )}

            {/* GUESTS */}
            {guestGroup.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setOpenGuests(v => !v)}
                  aria-expanded={openGuests}
                  className="mt-2 mb-2 flex w-full items-center justify-between rounded-md bg-white/5 px-3 py-2 text-left text-xs uppercase tracking-wide text-white/60 hover:bg-white/10 transition-colors"
                >
                  <span>Guests</span>
                  <div className="flex items-center gap-2 text-white/60">
                    <span className="text-[11px]">{guestGroup.length}</span>
                    <Chevron open={openGuests} />
                  </div>
                </button>

                {openGuests && (
                  <div className="flex flex-col gap-2 mb-2">
                    {guestGroup.map(p => renderPersonRow(p, false))}
                  </div>
                )}
              </>
            )}

            {participantsSorted.length === 0 && (
              <div className="text-[13px] text-white/50 p-2 bg-white/5 rounded-lg">
                No participants data available
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={isHosting ? onCancel : onLeave}
            className={`w-full mt-2 py-2 px-3 text-sm rounded-lg font-medium transition-colors ${
              isHosting
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                : 'bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            {isHosting ? 'Cancel Game' : 'Leave Game'}
          </button>
        </div>
      )}
    </div>
  );
}
