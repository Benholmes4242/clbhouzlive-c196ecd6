/**
 * GameDetailContent - Shared content component for game detail sheet & page
 * Reusable between GameDetailSheetV2 and GameDetailView
 * 
 * V2 Design:
 * - Glass cards with premium styling
 * - Matched pill tabs
 * - Consistent spacing
 */

import React, { useState } from 'react';
import { MapPin, Users, Clock, MoreVertical, Bell, UserPlus, Flag, ExternalLink, Calendar, Users2 } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import HcpBadge from '@/components/HcpBadge';
import { RsvpStrip } from '@/features/hub/components/rsvp/RsvpStrip';
import { InviteToGameModal } from '@/features/hub/components/invite/InviteToGameModal';
import { GameRemindersSheet } from '@/features/hub/components/reminders/GameRemindersSheet';
import { EndGameSheet } from '@/features/hub/components/game/EndGameSheet';
import { GameMessagesTab } from '@/features/game/GameMessagesTab';
import { GameDetailTabPills } from './GameDetailTabPills';
import type { RsvpStatus, GameRsvpData } from '@/features/hub/hooks/useGameRsvp';

// Types for game data - made flexible to match various sources
export interface GameData {
  id: string;
  course_name?: string | null;
  course_id?: string | null;
  start_time: string;
  status: string;
  slots_total: number;
  slots_open: number;
  host_user_id: string;
  note?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface GameParticipant {
  id: string;
  user_id?: string | null;
  guest_name?: string | null;
  rsvp_status?: string;
  user_profiles?: {
    display_name?: string | null;
    username?: string | null;
    profile_photo_url?: string | null;
    handicap?: number | null;
    show_handicap?: boolean | null;
  } | null;
}

interface GameDetailContentProps {
  game: GameData;
  participants: GameParticipant[];
  currentUserId: string | null;
  rsvpData: GameRsvpData | null;
  rsvpLoading: boolean;
  rsvpUpdating: boolean;
  setRsvp: (status: RsvpStatus) => void;
  refetch: () => void;
  activeTab: 'details' | 'messages' | 'participants';
  onTabChange: (tab: 'details' | 'messages' | 'participants') => void;
  // Optional: for sheet to provide "Open full page" action
  onOpenFullPage?: () => void;
}

// RSVP status label component - premium pill styling
function RsvpStatusLabel({ status }: { status: RsvpStatus | string | null }) {
  const labels: Record<string, { text: string; color: string; bg: string }> = {
    going: { text: 'Joined', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' },
    maybe: { text: 'Maybe', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' },
    declined: { text: "Can't go", color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' },
    invited: { text: 'Invited', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' },
    requested: { text: 'Requested', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  };
  
  const config = status ? labels[status] : null;
  if (!config) return null;
  
  return (
    <span 
      className="px-2.5 py-1 rounded-lg text-[12px] font-semibold flex-shrink-0"
      style={{ color: config.color, background: config.bg }}
    >
      {config.text}
    </span>
  );
}

// V2 Glass Card component for details - warm polish styling with color variants
type IconVariant = 'blue' | 'green' | 'gray';

function DetailCard({ 
  icon: Icon, 
  title, 
  subtitle,
  variant = 'gray',
}: { 
  icon: React.ElementType; 
  title: string; 
  subtitle?: string;
  variant?: IconVariant;
}) {
  const iconStyles: Record<IconVariant, { bg: string; color: string }> = {
    blue: {
      bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      color: 'rgb(59, 130, 246)',
    },
    green: {
      bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
      color: 'rgb(34, 197, 94)',
    },
    gray: {
      bg: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
      color: 'rgba(30, 41, 59, 0.5)',
    },
  };

  const style = iconStyles[variant];

  return (
    <div 
      className="flex items-center gap-3.5 p-4 rounded-2xl transition-all"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
      }}
    >
      <div 
        className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
        style={{ background: style.bg }}
      >
        <Icon 
          className="w-5 h-5" 
          style={{ color: style.color }} 
        />
      </div>
      <div className="flex-1 min-w-0">
        <div 
          className="font-medium text-[14px] leading-snug"
          style={{ color: '#1e293b' }}
        >
          {title}
        </div>
        {subtitle && (
          <div 
            className="text-[12px] mt-0.5"
            style={{ color: 'rgba(30, 41, 59, 0.5)' }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export function GameDetailContent({
  game,
  participants,
  currentUserId,
  rsvpData,
  rsvpLoading,
  rsvpUpdating,
  setRsvp,
  refetch,
  activeTab,
  onTabChange,
  onOpenFullPage,
}: GameDetailContentProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [endGameOpen, setEndGameOpen] = useState(false);

  const isHost = !!currentUserId && game.host_user_id === currentUserId;
  const isCompleted = game.status === 'completed';
  const slotsFilled = game.slots_total - game.slots_open;
  const slotsAvailableText = game.slots_open > 0 
    ? `${game.slots_open} ${game.slots_open === 1 ? 'spot' : 'spots'} available` 
    : 'Game full';

  return (
    <>
      {/* Completed banner */}
      {isCompleted && (
        <div 
          className="px-5 py-2 text-center flex-shrink-0"
          style={{ background: 'rgba(0,0,0,0.03)' }}
        >
          <p className="text-xs text-muted-foreground">This game has ended</p>
        </div>
      )}

      {/* Header actions row */}
      <div className="flex items-center justify-end gap-2 px-5 py-2 flex-shrink-0">
        {/* Invite button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInviteOpen(true)}
          disabled={isCompleted}
          className="h-8 gap-1.5 text-xs rounded-full border-black/10 hover:bg-black/5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite
        </Button>

        {/* Overflow menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-full transition-colors hover:bg-black/5">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => setRemindersOpen(true)}
              disabled={isCompleted}
              className="gap-2 text-sm"
            >
              <Bell className="w-4 h-4" />
              Reminders
            </DropdownMenuItem>

            {onOpenFullPage && (
              <DropdownMenuItem 
                onClick={onOpenFullPage}
                className="gap-2 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open full page
              </DropdownMenuItem>
            )}

            {isHost && !isCompleted && (
              <DropdownMenuItem 
                onClick={() => setEndGameOpen(true)} 
                className="gap-2 text-sm text-orange-600 focus:text-orange-600"
              >
                <Flag className="w-4 h-4" />
                End game
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Pill tabs - matching V2 design */}
      <div className="px-5 pb-3 flex-shrink-0">
        <GameDetailTabPills
          activeTab={activeTab}
          onTabChange={onTabChange}
          participantCount={participants.length}
        />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {activeTab === 'details' && (
          <div className="space-y-3">
            {/* Location Card */}
            {game.course_name && (
              <DetailCard
                icon={MapPin}
                title={game.course_name}
                variant="blue"
              />
            )}

            {/* Date & Time Card */}
            <DetailCard
              icon={Calendar}
              title={format(new Date(game.start_time), 'EEEE, MMMM d, yyyy')}
              subtitle={format(new Date(game.start_time), 'h:mm a')}
              variant="blue"
            />

            {/* Slots Card */}
            <DetailCard
              icon={Users}
              title={`${slotsFilled}/${game.slots_total} players`}
              subtitle={slotsAvailableText}
              variant="green"
            />

            {/* Note - warm amber tint */}
            {game.note && (
              <div 
                className="p-4 rounded-2xl"
                style={{
                  background: 'linear-gradient(180deg, #FEFDFB 0%, rgba(254,243,199,0.15) 100%)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
                  border: '1px solid rgba(251, 191, 36, 0.15)',
                }}
              >
                <div 
                  className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5"
                  style={{ color: 'rgba(146, 64, 14, 0.6)' }}
                >
                  Note from host
                </div>
                <p 
                  className="text-[14px] leading-relaxed"
                  style={{ color: '#78350f' }}
                >
                  {game.note}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="-mx-5">
            <GameMessagesTab game={game as any} participants={participants as any} />
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="space-y-3">
            {participants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                {/* Icon container */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <Users2 className="h-7 w-7 text-green-500" />
                </div>
                
                {/* Title */}
                <p className="text-[15px] font-semibold text-slate-700 mb-1">
                  No players yet
                </p>
                
                {/* Subtitle */}
                <p className="text-[13px] text-slate-400 text-center">
                  Invite friends to join this game
                </p>
              </div>
            ) : (
              participants.map((participant) => {
                const profile = participant.user_profiles;
                const isParticipantHost = participant.user_id === game.host_user_id;

                return (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{
                      background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
                      border: '1px solid rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    {/* Avatar with host badge */}
                    <div className="relative flex-shrink-0">
                      <SquircleAvatar
                        src={profile?.profile_photo_url || undefined}
                        alt={profile?.display_name || 'Player'}
                        size={48}
                        fallback={profile?.display_name?.[0] || '?'}
                        className="border-2 border-white shadow-sm"
                      />
                      {isParticipantHost && (
                        <div 
                          className="absolute -bottom-0.5 -right-0.5 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white"
                          style={{
                            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                            borderRadius: '6px',
                            border: '2px solid white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          }}
                        >
                          H
                        </div>
                      )}
                    </div>
                    
                    {/* Player info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[15px] text-slate-800 truncate">
                          {profile?.display_name || 'Unknown'}
                        </span>
                        {isParticipantHost && (
                          <span 
                            className="px-2 py-0.5 text-[11px] font-semibold rounded-md"
                            style={{
                              background: 'rgba(249, 115, 22, 0.1)',
                              color: '#EA580C',
                            }}
                          >
                            Host
                          </span>
                        )}
                        {profile?.handicap !== undefined && profile?.handicap !== null && profile?.show_handicap !== false && (
                          <span className="text-[13px] text-slate-500">
                            HCP {typeof profile.handicap === 'number' ? profile.handicap.toFixed(1) : profile.handicap}
                          </span>
                        )}
                      </div>
                      {profile?.username && (
                        <div className="text-[13px] text-slate-400 truncate">@{profile.username}</div>
                      )}
                    </div>
                    
                    {/* RSVP Status */}
                    <RsvpStatusLabel status={participant.rsvp_status || null} />
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* RSVP Footer */}
      {!rsvpLoading && rsvpData && (
        <div 
          className="absolute bottom-0 left-0 right-0 px-5 py-3"
          style={{ 
            background: 'linear-gradient(180deg, rgba(253, 252, 251, 0.95) 0%, rgba(245, 243, 240, 0.98) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {isCompleted ? (
            <div className="text-center py-1">
              <p className="text-xs text-muted-foreground">This game has ended</p>
            </div>
          ) : (
            <RsvpStrip
              currentStatus={rsvpData.currentUserRsvp}
              counts={rsvpData.counts}
              isHost={isHost}
              isUpdating={rsvpUpdating}
              onStatusChange={setRsvp}
            />
          )}
        </div>
      )}

      {/* Modals & Sheets */}
      <InviteToGameModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        gameId={game.id}
        courseName={game.course_name || undefined}
        startTime={game.start_time}
        onInviteSuccess={refetch}
      />

      <GameRemindersSheet
        isOpen={remindersOpen}
        onClose={() => setRemindersOpen(false)}
        gameId={game.id}
      />

      <EndGameSheet
        isOpen={endGameOpen}
        onClose={() => setEndGameOpen(false)}
        gameId={game.id}
        onSuccess={refetch}
      />
    </>
  );
}
