/**
 * GameDetailPage - Full page view for game details
 * Replaces the cramped GameDetailSheetV2 bottom sheet
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Share2, MoreVertical, MapPin, Calendar, Users, Bell, UserPlus, Flag, Pencil, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useGameDetail } from '@/features/game/hooks/useGameDetail';
import { useGameRsvp, RsvpStatus } from '@/features/hub/hooks/useGameRsvp';
import { GameMessagesTab } from '@/features/game/GameMessagesTab';
import { RsvpStrip } from '@/features/hub/components/rsvp/RsvpStrip';
import { InviteToGameModal } from '@/features/hub/components/invite/InviteToGameModal';
import { GameRemindersSheet } from '@/features/hub/components/reminders/GameRemindersSheet';
import { EndGameSheet } from '@/features/hub/components/game/EndGameSheet';
import { EditGameSheet } from '@/features/hub/components/edit-game/EditGameSheet';
import { CancelGameDialog } from '@/features/hub/components/CancelGameDialog';
import { cn } from '@/lib/utils';
import HcpBadge from '@/components/HcpBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type Tab = 'details' | 'messages' | 'participants';

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

export function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('details');
  
  // Data hooks
  const { game, participants, isLoading, currentUserId, refetch } = useGameDetail(gameId || null);
  const { data: rsvpData, isLoading: rsvpLoading, setRsvp, isUpdating: rsvpUpdating } = useGameRsvp(gameId);
  
  // Sheet/modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [endGameOpen, setEndGameOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  
  // Computed flags
  const isHost = !!currentUserId && game?.host_user_id === currentUserId;
  const isCompleted = game?.status === 'completed';
  const goingCount = participants?.filter(p => (p as any).rsvp_status === 'going').length || 0;

  // Handle deep link tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'overview') {
      setActiveTab('details');
    } else if (tabParam && ['details', 'messages', 'participants'].includes(tabParam)) {
      setActiveTab(tabParam as Tab);
    }
  }, [searchParams]);

  if (isLoading) {
    return <GameDetailSkeleton />;
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Game not found</h2>
          <button 
            onClick={() => navigate('/hub')}
            className="text-primary underline"
          >
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex-1 text-center px-2">
            <h1 className="font-semibold text-lg truncate">{game.course_name || 'Golf Game'}</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(game.start_time), 'EEE, MMM d · h:mm a')}
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setInviteOpen(true)}
              disabled={isCompleted}
              className="p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-muted rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isHost && !isCompleted && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => setEditOpen(true)}
                      className="gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit game
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem 
                  onClick={() => setRemindersOpen(true)}
                  disabled={isCompleted}
                  className="gap-2"
                >
                  <Bell className="w-4 h-4" />
                  Reminders
                </DropdownMenuItem>
                {isHost && !isCompleted && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => setEndGameOpen(true)} 
                      className="gap-2 text-orange-600 focus:text-orange-600"
                    >
                      <Flag className="w-4 h-4" />
                      End game
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setCancelOpen(true)} 
                      className="gap-2 text-red-600 focus:text-red-600"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel game
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Completed banner */}
        {isCompleted && (
          <div className="bg-muted/50 border-b border-border px-4 py-2">
            <p className="text-sm text-muted-foreground text-center">
              This game has ended
            </p>
          </div>
        )}
        
        {/* Tab Bar */}
        <div className="flex border-b border-border">
          {(['details', 'messages', 'participants'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-3 text-sm font-medium capitalize transition-colors',
                activeTab === tab 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground'
              )}
            >
              {tab === 'participants' ? `Players (${participants.length})` : tab}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-32">
        {activeTab === 'details' && (
          <DetailsTab game={game} />
        )}
        {activeTab === 'messages' && (
          <div className="h-full">
            <GameMessagesTab game={game} participants={participants} />
          </div>
        )}
        {activeTab === 'participants' && (
          <PlayersTab participants={participants} hostId={game.host_user_id} />
        )}
      </main>

      {/* Bottom RSVP Bar */}
      {!rsvpLoading && rsvpData && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3 z-20 pb-safe">
          {isCompleted ? (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">This game has ended</p>
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
        gameId={gameId!}
        courseName={game.course_name}
        startTime={game.start_time}
        onInviteSuccess={refetch}
      />

      <GameRemindersSheet
        isOpen={remindersOpen}
        onClose={() => setRemindersOpen(false)}
        gameId={gameId!}
      />

      <EndGameSheet
        isOpen={endGameOpen}
        onClose={() => setEndGameOpen(false)}
        gameId={gameId!}
        onSuccess={refetch}
      />

      {isHost && (
        <>
          <EditGameSheet
            open={editOpen}
            onClose={() => setEditOpen(false)}
            game={game}
            onSuccess={refetch}
          />
          <CancelGameDialog
            open={cancelOpen}
            onClose={() => setCancelOpen(false)}
            gameId={gameId!}
            courseName={game.course_name}
            participantCount={participants.length}
            onSuccess={() => navigate('/hub')}
          />
        </>
      )}
    </div>
  );
}

// Sub-components

function DetailsTab({ game }: { game: any }) {
  const slotsFilledText = `${game.slots_total - game.slots_open}/${game.slots_total} filled`;
  
  return (
    <div className="p-4 space-y-4">
      {/* Course Card */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium truncate">{game.course_name || 'Unknown Course'}</h3>
            {game.lat && game.lng && (
              <p className="text-sm text-muted-foreground">
                {game.lat.toFixed(4)}, {game.lng.toFixed(4)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Date/Time Card */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">{format(new Date(game.start_time), 'EEEE, MMMM d, yyyy')}</h3>
            <p className="text-sm text-muted-foreground">{format(new Date(game.start_time), 'h:mm a')}</p>
          </div>
        </div>
      </div>

      {/* Players Card */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">{slotsFilledText}</h3>
            <p className="text-sm text-muted-foreground">
              {game.slots_open > 0 ? `${game.slots_open} spots available` : 'Game full'}
            </p>
          </div>
        </div>
      </div>

      {/* Host Note */}
      {game.note && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Note from host
          </p>
          <p className="text-sm">{game.note}</p>
        </div>
      )}

      {/* Status */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
          Status
        </p>
        <p className="text-sm capitalize">{game.status?.replace('_', ' ') || 'scheduled'}</p>
      </div>
    </div>
  );
}

function PlayersTab({ participants, hostId }: { participants: any[]; hostId: string }) {
  if (participants.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No participants yet
      </div>
    );
  }

  // Group by RSVP status
  const goingPlayers = participants.filter(p => (p as any).rsvp_status === 'going');
  const maybePlayers = participants.filter(p => (p as any).rsvp_status === 'maybe');
  const invitedPlayers = participants.filter(p => (p as any).rsvp_status === 'invited');
  const declinedPlayers = participants.filter(p => (p as any).rsvp_status === 'declined');

  return (
    <div className="p-4 space-y-6">
      {goingPlayers.length > 0 && (
        <PlayerSection title="Going" players={goingPlayers} hostId={hostId} />
      )}
      {maybePlayers.length > 0 && (
        <PlayerSection title="Maybe" players={maybePlayers} hostId={hostId} />
      )}
      {invitedPlayers.length > 0 && (
        <PlayerSection title="Invited" players={invitedPlayers} hostId={hostId} />
      )}
      {declinedPlayers.length > 0 && (
        <PlayerSection title="Declined" players={declinedPlayers} hostId={hostId} />
      )}
    </div>
  );
}

function PlayerSection({ title, players, hostId }: { 
  title: string; 
  players: any[]; 
  hostId: string;
}) {
  return (
    <div>
      <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-3">
        {players.map((participant) => {
          const profile = participant.user_profiles;
          const isParticipantHost = participant.user_id === hostId;
          
          return (
            <div key={participant.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {profile?.profile_photo_url ? (
                    <img src={profile.profile_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium">
                      {profile?.display_name?.[0] || '?'}
                    </span>
                  )}
                </div>
                {isParticipantHost && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground border-2 border-background">
                    H
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {profile?.display_name || 'Unknown'}
                  </span>
                  {isParticipantHost && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                      Host
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {profile?.username && <span>@{profile.username}</span>}
                  <HcpBadge 
                    value={profile?.handicap} 
                    show={profile?.show_handicap ?? true}
                  />
                </div>
              </div>
              <RsvpStatusLabel status={(participant as any).rsvp_status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GameDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <header className="px-4 py-3 border-b border-border">
        <div className="h-6 bg-muted rounded w-48 mx-auto mb-2" />
        <div className="h-4 bg-muted rounded w-32 mx-auto" />
      </header>
      <div className="flex border-b border-border">
        <div className="flex-1 py-3 px-4">
          <div className="h-4 bg-muted rounded w-16 mx-auto" />
        </div>
        <div className="flex-1 py-3 px-4">
          <div className="h-4 bg-muted rounded w-16 mx-auto" />
        </div>
        <div className="flex-1 py-3 px-4">
          <div className="h-4 bg-muted rounded w-16 mx-auto" />
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="h-20 bg-muted rounded-xl" />
        <div className="h-20 bg-muted rounded-xl" />
        <div className="h-20 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

export default GameDetailPage;
