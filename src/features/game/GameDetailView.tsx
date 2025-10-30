import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, Clock } from 'lucide-react';
import { useGameDetail } from './hooks/useGameDetail';
import { GameMessagesTab } from './GameMessagesTab';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

export default function GameDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { game, participants, isLoading } = useGameDetail(id || null);
  const [activeTab, setActiveTab] = useState<'details' | 'messages' | 'participants'>('messages');

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
    <div className="min-h-screen bg-background pb-20">
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
        </div>
      </div>

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
              const isHost = participant.user_id === game.host_user_id;

              return (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {profile?.display_name?.[0] || '?'}
                    </div>
                    {isHost && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground border-2 border-background">
                        H
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {profile?.display_name || 'Unknown'}
                      {isHost && <span className="ml-2 text-xs text-primary">(Host)</span>}
                    </div>
                    {profile?.username && (
                      <div className="text-sm text-muted-foreground">@{profile.username}</div>
                    )}
                    {profile?.handicap !== undefined && profile.handicap !== null && (
                      <div className="text-xs text-muted-foreground">HCP: {profile.handicap}</div>
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
    </div>
  );
}
