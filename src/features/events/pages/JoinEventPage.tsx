import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Trophy, ChevronLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEventByShareCode } from '@/features/events/hooks/useEvent';
import { useJoinEvent } from '@/features/events/hooks/useEventParticipants';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function JoinEventPage() {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();
  const [handicap, setHandicap] = useState('');

  const { data: event, isLoading, error } = useEventByShareCode(shareCode);
  const { mutate: joinEvent, isPending: isJoining } = useJoinEvent();

  const handleJoin = () => {
    if (!event) return;
    
    joinEvent(
      { eventId: event.id, handicapIndex: handicap ? parseFloat(handicap) : undefined },
      { onSuccess: () => navigate(`/events/${event.id}`) }
    );
  };

  const handleLoginAndJoin = () => {
    sessionStorage.setItem('pendingEventJoin', shareCode || '');
    navigate('/auth/login');
  };

  if (isLoading || authLoading) {
    return <JoinEventSkeleton />;
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-xl font-semibold">Event not found</p>
          <p className="text-muted-foreground">This invite link may have expired or the event was cancelled.</p>
          <Button onClick={() => navigate('/hub')}>Go to Hub</Button>
        </div>
      </div>
    );
  }

  const eventTypeLabel = {
    single_round: 'Round',
    society_day: 'Society Day',
    multi_day: 'Golf Trip',
    tournament: 'Tournament',
  }[event.event_type] || 'Event';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-4 pb-8">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/50 rounded-full mb-4">
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <span className="text-xs font-medium text-primary uppercase tracking-wide">
          {eventTypeLabel}
        </span>
        <h1 className="text-2xl font-bold mt-1">{event.name}</h1>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(event.start_date), 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6 -mt-4">
        {/* Event Info Card */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          {event.description && (
            <p className="text-foreground">{event.description}</p>
          )}
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4" />
              {event.scoring_format === 'stableford' ? 'Stableford' : event.scoring_format === 'stroke_net' ? 'Stroke (Net)' : event.scoring_format === 'none' ? 'No Scoring' : 'Stroke Play'}
            </div>
            {event.max_participants && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                Max {event.max_participants}
              </div>
            )}
          </div>

          {/* Organizer */}
          {event.creator && (
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                {event.creator.profile_photo_url ? (
                  <img src={event.creator.profile_photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">
                    {event.creator.display_name?.[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Organized by {event.creator.display_name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Join Section */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <h3 className="font-semibold">Join this event</h3>
          
          {user ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Your handicap (optional)</label>
                <input
                  type="number"
                  step="0.1"
                  value={handicap}
                  onChange={(e) => setHandicap(e.target.value)}
                  placeholder="e.g., 18.5"
                  className="w-full p-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button onClick={handleJoin} disabled={isJoining} className="w-full h-12 rounded-xl">
                {isJoining ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Joining...</> : 'Join Event'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Sign in to join this event</p>
              <Button onClick={handleLoginAndJoin} className="w-full h-12 rounded-xl">
                Sign In to Join
              </Button>
              <Button onClick={() => navigate('/auth/signup')} variant="outline" className="w-full">
                Create Account
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JoinEventSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-4 pb-8">
        <Skeleton className="w-6 h-6 rounded-full mb-4" />
        <Skeleton className="w-24 h-4 mb-2" />
        <Skeleton className="w-48 h-8 mb-2" />
        <Skeleton className="w-32 h-4" />
      </div>
      <div className="p-4 space-y-6 -mt-4">
        <Skeleton className="w-full h-40 rounded-xl" />
        <Skeleton className="w-full h-48 rounded-xl" />
      </div>
    </div>
  );
}
