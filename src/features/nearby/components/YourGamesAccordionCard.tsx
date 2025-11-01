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

interface YourGamesAccordionCardProps {
  game: Game;
  isHosting: boolean;
  onCancel: () => void;
  onLeave: () => void;
}

export function YourGamesAccordionCard({ game, isHosting, onCancel, onLeave }: YourGamesAccordionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: participants = [] } = useGameParticipants(game.id);
  const navigate = useNavigate();

  // Prefer participants embedded on the game object (e.g., tagged/reserved) when available
  const rawPrefetched = (game.participants ?? []) as any[];
  const prefetchedParticipants: Participant[] = rawPrefetched.map((p: any) => ({
    user_id: p.user_id ?? null,
    role: p.role,
    state: p.state,
    display_name: p.user_profiles?.display_name || p.guest_name || 'Unknown',
    username: p.user_profiles?.username,
    profile_photo_url: p.user_profiles?.profile_photo_url || undefined,
    eg_handicap_index: (p.user_profiles as any)?.eg_handicap_index ?? (p.user_profiles as any)?.handicap ?? null,
    show_handicap: (p.user_profiles as any)?.show_handicap,
    home_club: (p.user_profiles as any)?.home_club ?? null,
    guest_name: p.guest_name ?? null,
    is_guest: !p.user_id,
  }));

  // Enrich prefetched participants with data from the hook (profiles, hcp, etc.)
  const makeKey = (p: Participant) => (p.user_id ? `u:${p.user_id}` : `g:${p.guest_name ?? ''}`);
  const hookByKey = new Map<string, Participant>();
  participants.forEach((p) => hookByKey.set(makeKey(p), p));

  const mergedPrefetched = prefetchedParticipants.map((p) => hookByKey.get(makeKey(p)) ?? p);
  const extrasFromHook = participants.filter((p) => !mergedPrefetched.some((m) => makeKey(m) === makeKey(p)));

  const baseParticipants = (mergedPrefetched.length > 0 ? [...mergedPrefetched, ...extrasFromHook] : participants);
  const hasHostInParticipants = baseParticipants.some((p) => p.role === 'host');

  // Force-show participants: ensure host and current user rows even if participants query is empty
  const { user } = useSupabaseSession();
  const { data: hostProfile } = useUserProfile(game.host_user_id);
  const { data: currentProfile } = useUserProfile(user?.id || null);

  const forcedHost = !hasHostInParticipants && hostProfile ? [
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
  const forcedSelf = shouldAddSelf ? [
    {
      user_id: currentProfile!.id,
      role: (isHosting ? 'host' : 'player'),
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
            <div className="text-[13px] font-medium text-white/80">Players ({displayParticipants.length})</div>
            <div className="space-y-2">
              {displayParticipants.length > 0 ? (
                displayParticipants.map((p) => (
                  <button
                    key={p.user_id || `guest:${p.display_name}`}
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
                          @{p.username || p.display_name}
                        </span>
                        {p.role === 'host' && (
                          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-medium rounded">
                            Host
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
                ))
              ) : (
                <div className="text-[13px] text-white/50 p-2 bg-white/5 rounded-lg">
                  No participants data available
                </div>
              )}
            </div>
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
