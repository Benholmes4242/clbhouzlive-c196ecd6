import React from 'react';
import { MapPin, Clock, Users, Trophy, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { EventWithDetails } from '@/features/events/hooks/useEvent';

interface Props {
  event: EventWithDetails;
}

export function EventOverviewTab({ event }: Props) {
  const scoringLabels: Record<string, string> = {
    stableford: 'Stableford',
    stroke_net: 'Stroke Play (Net)',
    stroke_gross: 'Stroke Play (Gross)',
    none: 'No Scoring',
  };

  return (
    <div className="space-y-6">
      {/* Description */}
      {event.description && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-foreground">{event.description}</p>
        </div>
      )}

      {/* Rounds */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MapPin className="w-4 h-4" />
          {event.rounds?.length || 0} Round{(event.rounds?.length || 0) !== 1 ? 's' : ''}
        </div>
        <div className="space-y-2">
          {event.rounds?.map((round, index) => (
            <div key={round.id} className="bg-card rounded-xl p-4 border border-border flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{round.course_name}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(round.round_date), 'EEE, MMM d')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(`2000-01-01T${round.first_tee_time}`), 'h:mm a')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Details */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Event Details</p>
        <div className="bg-card rounded-xl p-4 border border-border space-y-3">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-muted-foreground" />
            <span>{scoringLabels[event.scoring_format || 'none']}</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span>{event.max_participants ? `Max ${event.max_participants}` : 'Unlimited'} players</span>
          </div>
          {event.scoring_format !== 'none' && event.scoring_format !== 'stroke_gross' && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{event.handicap_allowance}% handicap allowance</span>
            </div>
          )}
        </div>
      </div>

      {/* Organizer */}
      {event.creator && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Organizer</p>
          <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
              {event.creator.profile_photo_url ? (
                <img src={event.creator.profile_photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                  {event.creator.display_name?.[0] || '?'}
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold">{event.creator.display_name}</p>
              {event.creator.username && <p className="text-sm text-muted-foreground">@{event.creator.username}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
