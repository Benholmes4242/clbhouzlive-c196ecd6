/**
 * TripHeader - Header section for trip page
 */

import React from 'react';
import { Calendar, Users, Globe, Lock, UserCheck } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import type { TripData, TripParticipant } from '../../hooks/useTripTimeline';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { formatRsvpCount } from '@/lib/rsvpLabels';

interface TripHeaderProps {
  trip: TripData;
  participants: TripParticipant[];
}

export function TripHeader({ trip, participants }: TripHeaderProps) {
  const dayCount = differenceInDays(trip.endDate, trip.startDate) + 1;
  const joinedCount = participants.filter(p => p.rsvpStatus === 'going').length;
  
  const visibilityIcon = trip.visibility === 'invite' ? Lock : 
                         trip.visibility === 'friends' ? UserCheck : Globe;
  const VisIcon = visibilityIcon;

  return (
    <div className="space-y-4">
      {/* Cover image */}
      {trip.coverImageUrl && (
        <div className="w-full h-40 rounded-xl overflow-hidden bg-muted -mt-2">
          <img
            src={trip.coverImageUrl}
            alt={trip.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Title & meta */}
      <div>
        <h1 className="text-xl font-bold text-foreground">{trip.name}</h1>
        
        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {format(trip.startDate, 'MMM d')} – {format(trip.endDate, 'MMM d, yyyy')}
          </span>
          <span className="text-muted-foreground/50">•</span>
          <span>{dayCount} {dayCount === 1 ? 'day' : 'days'}</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="flex items-center gap-1">
            <VisIcon className="w-3.5 h-3.5" />
            {trip.visibility}
          </span>
        </div>

        {trip.description && (
          <p className="text-sm text-muted-foreground mt-2">{trip.description}</p>
        )}
      </div>

      {/* Participants */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {participants.slice(0, 5).map(p => (
            <SquircleAvatar
              key={p.id}
              src={p.profile?.profilePhotoUrl}
              alt={p.profile?.displayName || 'Participant'}
              size={28}
              className="border-2 border-background"
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {formatRsvpCount(joinedCount, 'going')}
          {participants.length > joinedCount && ` · ${participants.length - joinedCount} invited`}
        </span>
      </div>
    </div>
  );
}
