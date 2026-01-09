/**
 * GameDetailContent - Shared content component for game detail sheet & page
 * Reusable between GameDetailSheetV2 and GameDetailView
 */

import React, { useState } from 'react';
import { MapPin, Users, Clock, MoreVertical, Bell, UserPlus, Flag, ExternalLink } from 'lucide-react';
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

// RSVP status label component
function RsvpStatusLabel({ status }: { status: RsvpStatus | string | null }) {
  const labels: Record<string, { text: string; color: string }> = {
    going: { text: 'Going', color: 'text-green-600' },
    maybe: { text: 'Maybe', color: 'text-yellow-600' },
    declined: { text: 'Declined', color: 'text-red-500' },
    invited: { text: 'Invited', color: 'text-blue-500' },
  };
  
  const config = status ? labels[status] : null;
  if (!config) return null;
  
  return (
    <span className={`text-xs font-medium ${config.color}`}>
      {config.text}
    </span>
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
  const slotsFilledText = `${game.slots_total - game.slots_open}/${game.slots_total} filled`;

  const tabs: { key: 'details' | 'messages' | 'participants'; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'messages', label: 'Messages' },
    { key: 'participants', label: `Participants (${participants.length})` },
  ];

  return (
    <>
      {/* Completed banner */}
      {isCompleted && (
        <div 
          className="px-5 py-2 text-center"
          style={{ background: 'rgba(0,0,0,0.03)' }}
        >
          <p className="text-xs text-muted-foreground">This game has ended</p>
        </div>
      )}

      {/* Header actions row */}
      <div className="flex items-center justify-end gap-2 px-5 py-2">
        {/* Invite button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInviteOpen(true)}
          disabled={isCompleted}
          className="h-8 gap-1.5 text-xs"
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

      {/* Pill tabs */}
      <div className="flex gap-2 px-5 pb-3">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: activeTab === tab.key 
                ? 'rgba(0,0,0,0.06)' 
                : 'transparent',
              color: activeTab === tab.key 
                ? '#1e293b' 
                : 'rgba(30,41,59,0.5)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {activeTab === 'details' && (
          <div className="space-y-3">
            {game.course_name && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">{game.course_name}</div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">
                  {format(new Date(game.start_time), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(game.start_time), 'h:mm a')}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60">
              <Users className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">{slotsFilledText}</div>
                <div className="text-xs text-muted-foreground">
                  {game.slots_open > 0 ? `${game.slots_open} seats available` : 'Game full'}
                </div>
              </div>
            </div>

            {game.note && (
              <div className="p-3 rounded-xl bg-white/60">
                <div className="text-xs font-medium text-muted-foreground mb-1">Note</div>
                <p className="text-sm">{game.note}</p>
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
          <div className="space-y-2">
            {participants.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No participants yet
              </div>
            ) : (
              participants.map((participant) => {
                const profile = participant.user_profiles;
                const isParticipantHost = participant.user_id === game.host_user_id;

                return (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/60"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {profile?.display_name?.[0] || '?'}
                      </div>
                      {isParticipantHost && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground border-2 border-white">
                          H
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        <span className="truncate">{profile?.display_name || 'Unknown'}</span>
                        {isParticipantHost && <span className="text-[10px] text-primary">(Host)</span>}
                        <HcpBadge 
                          value={profile?.handicap} 
                          show={profile?.show_handicap ?? true}
                          className="text-muted-foreground text-[10px]"
                        />
                      </div>
                      {profile?.username && (
                        <div className="text-xs text-muted-foreground truncate">@{profile.username}</div>
                      )}
                    </div>
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
          className="absolute bottom-0 left-0 right-0 px-5 py-3 border-t"
          style={{ 
            background: 'rgba(249, 250, 251, 0.95)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(0,0,0,0.06)',
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
