/**
 * TripDetailPage - Full page view for trip details
 * Replaces the cramped TripDetailSheetV2 bottom sheet
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, MoreVertical, Calendar, Users, MapPin, Plus, MessageCircle, Pencil, XCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useTripDetail } from '@/features/hub/hooks/useTripDetail';
import { useTripTimeline } from '@/features/hub/hooks/useTripTimeline';
import { EditTripSheet } from '@/features/hub/components/edit-trip/EditTripSheet';
import { CancelTripDialog } from '@/features/hub/components/CancelTripDialog';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type Tab = 'details' | 'messages' | 'players';

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('details');
  
  const { data: trip, isLoading, refetch } = useTripDetail(tripId || null);
  const { timeline } = useTripTimeline(tripId);
  
  // Sheet/modal state
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  
  // Check if current user is the organizer 
  // userRequestStatus === 'going' and organizer identity is available means they are org or have access
  const isOrganizer = trip?.userRequestStatus === 'going' && trip?.organizer !== null;

  if (isLoading) {
    return <TripDetailSkeleton />;
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Trip not found</h2>
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

  const dateRange = `${format(new Date(trip.startDate), 'MMM d')} – ${format(new Date(trip.endDate), 'MMM d, yyyy')}`;
  const dayCount = differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1;

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
            <h1 className="font-semibold text-lg truncate">{trip.title}</h1>
            <p className="text-sm text-muted-foreground">{dateRange}</p>
          </div>
          
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-muted rounded-full transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-muted rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isOrganizer && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => setEditOpen(true)}
                      className="gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit trip
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setCancelOpen(true)} 
                      className="gap-2 text-red-600 focus:text-red-600"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel trip
                    </DropdownMenuItem>
                  </>
                )}
                {!isOrganizer && (
                  <DropdownMenuItem disabled className="gap-2 text-muted-foreground">
                    No actions available
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Tab Bar */}
        <div className="flex border-b border-border">
          {(['details', 'messages', 'players'] as Tab[]).map((tab) => (
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
              {tab === 'players' ? `Players (${trip.participantCount})` : tab}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-safe">
        {activeTab === 'details' && (
          <TripDetailsTab 
            trip={trip} 
            timeline={timeline} 
            dayCount={dayCount}
            isOrganizer={isOrganizer}
            onGameClick={(gameId) => navigate(`/hub/games/${gameId}`)}
          />
        )}
        {activeTab === 'messages' && (
          <TripMessagesTab tripId={tripId!} />
        )}
        {activeTab === 'players' && (
          <TripPlayersTab 
            participants={trip.participants} 
            organizerId={trip.organizerId}
            organizer={trip.organizer}
            canSeeIdentity={trip.canSeeIdentity}
          />
        )}
      </main>

      {/* Edit/Cancel Sheets */}
      {isOrganizer && (
        <>
          <EditTripSheet
            open={editOpen}
            onClose={() => setEditOpen(false)}
            trip={{
              id: trip.id,
              name: trip.title,
              description: trip.description,
              start_date: trip.startDate,
              end_date: trip.endDate,
              visibility: trip.visibility,
            }}
            courses={timeline
              ?.filter(item => item.type === 'game')
              .map((item, index) => ({
                id: item.gameId || `temp-${index}`,
                courseId: item.courseId || '',
                courseName: item.courseName || item.title || 'TBD',
                dayNumber: item.dayNumber || index + 1,
              })) || []}
            onSuccess={() => refetch()}
          />
          <CancelTripDialog
            open={cancelOpen}
            onClose={() => setCancelOpen(false)}
            tripId={tripId!}
            tripName={trip.title}
            participantCount={trip.participantCount}
            onSuccess={() => navigate('/hub')}
          />
        </>
      )}
    </div>
  );
}

function TripDetailsTab({ 
  trip, 
  timeline, 
  dayCount,
  isOrganizer,
  onGameClick
}: { 
  trip: any; 
  timeline: any[];
  dayCount: number;
  isOrganizer: boolean;
  onGameClick: (gameId: string) => void;
}) {
  // Filter to only game items
  const rounds = timeline?.filter(item => item.type === 'game') || [];

  return (
    <div className="p-4 space-y-4">
      {/* Trip Info Cards */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">
              {format(new Date(trip.startDate), 'MMM d')} – {format(new Date(trip.endDate), 'MMM d, yyyy')}
            </h3>
            <p className="text-sm text-muted-foreground">{dayCount} day{dayCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">{trip.participantCount} player{trip.participantCount !== 1 ? 's' : ''} joined</h3>
            <p className="text-sm text-muted-foreground">
              {trip.visibility === 'invite' ? 'Invite only' : trip.visibility}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      {trip.description && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Trip Description
          </p>
          <p className="text-sm">{trip.description}</p>
        </div>
      )}

      {/* Rounds Section */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs text-muted-foreground uppercase tracking-wide">Rounds</h2>
          {isOrganizer && (
            <button className="text-sm text-primary font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Add round
            </button>
          )}
        </div>

        {rounds.length > 0 ? (
          <div className="space-y-3">
            {rounds.map((round, index) => (
              <button 
                key={round.id}
                onClick={() => round.gameId && onGameClick(round.gameId)}
                className="w-full bg-card rounded-xl p-4 border border-border text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-green-700 dark:text-green-400 font-medium text-sm">
                      D{round.dayNumber || index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{round.courseName || round.title || 'TBD'}</h3>
                    {round.subtitle && (
                      <p className="text-sm text-muted-foreground">{round.subtitle}</p>
                    )}
                    {round.rsvpCounts && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {round.rsvpCounts.going} going
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed border-border">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">No rounds scheduled yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add rounds to build your tour itinerary
            </p>
            {isOrganizer && (
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                Add a round
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TripMessagesTab({ tripId }: { tripId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="font-medium mb-2">Trip Chat</h3>
      <p className="text-sm text-muted-foreground text-center">
        Group messages for this trip coming soon
      </p>
    </div>
  );
}

function TripPlayersTab({ 
  participants, 
  organizerId,
  organizer,
  canSeeIdentity
}: { 
  participants: any[]; 
  organizerId: string;
  organizer: any;
  canSeeIdentity: boolean;
}) {
  if (!canSeeIdentity) {
    return (
      <div className="p-4 text-center py-12">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium mb-2">Join to see participants</h3>
        <p className="text-sm text-muted-foreground">
          Request to join this trip to see who's going
        </p>
      </div>
    );
  }

  // Group by RSVP status
  const goingPlayers = participants?.filter(p => p.rsvpStatus === 'going') || [];
  const invitedPlayers = participants?.filter(p => p.rsvpStatus === 'invited') || [];
  const requestedPlayers = participants?.filter(p => p.rsvpStatus === 'requested') || [];

  return (
    <div className="p-4 space-y-6">
      {/* Organizer */}
      {organizer && (
        <div>
          <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Organizer</h3>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {organizer.avatarUrl ? (
                <img src={organizer.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-medium">
                  {organizer.displayName?.[0] || '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{organizer.displayName}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                  Organizer
                </span>
              </div>
              {organizer.username && (
                <span className="text-sm text-muted-foreground">@{organizer.username}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {goingPlayers.length > 0 && (
        <TripPlayerSection title="Going" players={goingPlayers} />
      )}
      {invitedPlayers.length > 0 && (
        <TripPlayerSection title="Invited" players={invitedPlayers} />
      )}
      {requestedPlayers.length > 0 && (
        <TripPlayerSection title="Requested" players={requestedPlayers} />
      )}

      {participants.length === 0 && !organizer && (
        <div className="text-center py-12 text-muted-foreground">
          No participants yet
        </div>
      )}
    </div>
  );
}

function TripPlayerSection({ title, players }: { title: string; players: any[] }) {
  return (
    <div>
      <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-3">
        {players.map((participant) => (
          <div key={participant.odUserId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {participant.avatarUrl ? (
                <img src={participant.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-medium">
                  {participant.displayName?.[0] || '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium truncate block">{participant.displayName}</span>
              {participant.username && (
                <span className="text-sm text-muted-foreground">@{participant.username}</span>
              )}
            </div>
            {participant.handicap && participant.showHandicap && (
              <span className="text-xs text-muted-foreground">
                HCP {participant.handicap}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TripDetailSkeleton() {
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
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

export default TripDetailPage;
