import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, Clock, MoreVertical, Bell, UserPlus, Flag } from 'lucide-react';
import { useGameDetail } from './hooks/useGameDetail';
import { GameMessagesTab } from './GameMessagesTab';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import HcpBadge from '@/components/HcpBadge';

// Hub components
import { RsvpStrip } from '@/features/hub/components/rsvp/RsvpStrip';
import { InviteToGameModal } from '@/features/hub/components/invite/InviteToGameModal';
import { GameRemindersSheet } from '@/features/hub/components/reminders/GameRemindersSheet';
import { EndGameSheet } from '@/features/hub/components/game/EndGameSheet';
import { useGameRsvp } from '@/features/hub/hooks/useGameRsvp';

export default function GameDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { game, participants, isLoading, currentUserId, refetch } = useGameDetail(id || null);
  const [activeTab, setActiveTab] = useState<'details' | 'messages' | 'participants'>('details');

  // Sheet/modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [endGameOpen, setEndGameOpen] = useState(false);

  // RSVP state
  const { data: rsvpData, isLoading: rsvpLoading, setRsvp, isUpdating: rsvpUpdating } = useGameRsvp(id);

  // Computed flags
  const isHost = !!currentUserId && game?.host_user_id === currentUserId;
  const isCompleted = game?.status === 'completed';

  // Handle deep link tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'overview') {
      setActiveTab('details');
    } else if (tabParam && ['details', 'messages', 'participants'].includes(tabParam)) {
      setActiveTab(tabParam as 'details' | 'messages' | 'participants');
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading game...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Game not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const slotsFilledText = `${game.slots_total - game.slots_open}/${game.slots_total} filled`;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">
              {game.course_name || 'Golf Game'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(game.start_time), 'EEE, MMM d · h:mm a')}
            </p>
          </div>

          {/* Invite button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInviteOpen(true)}
            disabled={isCompleted}
            className="gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </Button>

          {/* Overflow menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => setRemindersOpen(true)}
                disabled={isCompleted}
                className="gap-2"
              >
                <Bell className="w-4 h-4" />
                Reminders
              </DropdownMenuItem>

              {isHost && !isCompleted && (
                <DropdownMenuItem 
                  onClick={() => setEndGameOpen(true)} 
                  className="gap-2 text-orange-600 focus:text-orange-600"
                >
                  <Flag className="w-4 h-4" />
                  End game
                </DropdownMenuItem>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-border">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="participants">
            Participants ({participants.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="p-4 space-y-4">
          {/* Game Info */}
          <div className="space-y-3">
            {game.course_name && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">{game.course_name}</div>
                  {game.lat && game.lng && (
                    <div className="text-sm text-muted-foreground">
                      {game.lat.toFixed(4)}, {game.lng.toFixed(4)}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {format(new Date(game.start_time), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(game.start_time), 'h:mm a')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{slotsFilledText}</div>
                <div className="text-sm text-muted-foreground">
                  {game.slots_open > 0 ? `${game.slots_open} seats available` : 'Game full'}
                </div>
              </div>
            </div>

            {game.note && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Note</div>
                <p className="text-sm">{game.note}</p>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
              <p className="text-sm capitalize">{game.status.replace('_', ' ')}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="p-0">
          <GameMessagesTab game={game} participants={participants} />
        </TabsContent>

        <TabsContent value="participants" className="p-4 space-y-3">
          {participants.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No participants yet
            </div>
          ) : (
            participants.map((participant) => {
              const profile = participant.user_profiles;
              const isParticipantHost = participant.user_id === game.host_user_id;

              return (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {profile?.display_name?.[0] || '?'}
                    </div>
                    {isParticipantHost && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground border-2 border-background">
                        H
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium">
                      <span>{profile?.display_name || 'Unknown'}</span>
                      {isParticipantHost && <span className="text-xs text-primary">(Host)</span>}
                      <HcpBadge 
                        value={profile?.handicap} 
                        show={profile?.show_handicap ?? true}
                        className="text-muted-foreground"
                      />
                    </div>
                    {profile?.username && (
                      <div className="text-sm text-muted-foreground">@{profile.username}</div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {participant.state}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* RSVP Strip - Sticky footer */}
      {!rsvpLoading && rsvpData && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3 z-20">
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
        gameId={id!}
        onInviteSuccess={refetch}
      />

      <GameRemindersSheet
        isOpen={remindersOpen}
        onClose={() => setRemindersOpen(false)}
        gameId={id!}
      />

      <EndGameSheet
        isOpen={endGameOpen}
        onClose={() => setEndGameOpen(false)}
        gameId={id!}
        onSuccess={refetch}
      />
    </div>
  );
}
