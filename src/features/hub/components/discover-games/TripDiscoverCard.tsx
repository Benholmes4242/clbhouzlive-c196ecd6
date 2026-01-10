/**
 * TripDiscoverCard - Anonymous trip card for discover
 * 
 * Shows trip info WITHOUT revealing host identity:
 * - Trip name, dates
 * - Slots: "X spots left" / "Full"
 * - Visibility pill
 * - Anonymous host blurb
 * - CTA states: Request to join / Requested / Joined / Full
 */

import React from 'react';
import { MapPin, Users, Lock, Globe, UserPlus, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DiscoverTrip } from '../../hooks/useDiscoverTrips';

interface TripDiscoverCardProps {
  trip: DiscoverTrip;
  onTap: () => void;
  onRequestJoin?: () => void;
  isRequesting?: boolean;
}

function formatTripDates(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = differenceInDays(end, start) + 1;
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d')} (${days} day${days !== 1 ? 's' : ''})`;
}

function getVisibilityIcon(visibility: string) {
  switch (visibility) {
    case 'public': return Globe;
    case 'club': return Lock;
    default: return Users;
  }
}

function getVisibilityLabel(visibility: string) {
  switch (visibility) {
    case 'public': return 'Public';
    case 'club': return 'Club';
    case 'friends': return 'Friends';
    case 'invite': return 'Invite only';
    default: return visibility;
  }
}

export function TripDiscoverCard({
  trip,
  onTap,
  onRequestJoin,
  isRequesting,
}: TripDiscoverCardProps) {
  const VisIcon = getVisibilityIcon(trip.visibility);
  const isFull = trip.slotsOpen <= 0;
  const isJoined = trip.userRequestStatus === 'going';
  const isRequested = trip.userRequestStatus === 'requested';

  // Build anonymous host blurb
  const hostBlurbParts: string[] = [];
  if (trip.hostBlurb.handicap !== null) {
    hostBlurbParts.push(`Handicap ${Math.round(trip.hostBlurb.handicap)}`);
  }
  if (trip.hostBlurb.homeClub) {
    hostBlurbParts.push(trip.hostBlurb.homeClub);
  }
  const hostBlurbText = hostBlurbParts.length > 0 
    ? `Host: ${hostBlurbParts.join(' • ')}`
    : 'Host: Golfer';

  const handleRequestJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFull && !isJoined && !isRequested && onRequestJoin) {
      onRequestJoin();
    }
  };

  // CTA button state
  let ctaLabel = 'Request to join';
  let ctaDisabled = false;
  let ctaStyle = 'bg-[#0F4C2E] text-white';
  
  if (isJoined) {
    ctaLabel = 'Joined';
    ctaDisabled = true;
    ctaStyle = 'bg-emerald-100 text-emerald-700';
  } else if (isRequested) {
    ctaLabel = 'Requested';
    ctaDisabled = true;
    ctaStyle = 'bg-amber-100 text-amber-700';
  } else if (isFull) {
    ctaLabel = 'Full';
    ctaDisabled = true;
    ctaStyle = 'bg-gray-100 text-gray-500';
  }

  return (
    <div
      onClick={onTap}
      className="w-full rounded-2xl overflow-hidden transition-all duration-150 cursor-pointer active:scale-[0.98]"
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Cover image if available */}
      {trip.coverImageUrl && (
        <div className="h-28 w-full bg-gray-100">
          <img 
            src={trip.coverImageUrl} 
            alt={trip.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        {/* Top row: Name + Visibility */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 
              className="font-semibold text-[15px] leading-tight truncate"
              style={{ color: '#1e293b' }}
            >
              {trip.name}
            </h3>
            <p 
              className="text-[13px] mt-0.5 flex items-center gap-1"
              style={{ color: 'rgba(100, 116, 139, 0.9)' }}
            >
              <Calendar className="w-3.5 h-3.5" />
              {formatTripDates(trip.startDate, trip.endDate)}
            </p>
          </div>

          {/* Visibility pill */}
          <div 
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium flex-shrink-0"
            style={{
              background: 'rgba(0, 0, 0, 0.04)',
              color: 'rgba(71, 85, 105, 0.8)',
            }}
          >
            <VisIcon className="w-3 h-3" />
            {getVisibilityLabel(trip.visibility)}
          </div>
        </div>

        {/* Destination if available */}
        {trip.destination && (
          <p 
            className="text-[12px] mb-2 truncate flex items-center gap-1"
            style={{ color: 'rgba(100, 116, 139, 0.8)' }}
          >
            <MapPin className="w-3 h-3" />
            {trip.destination}
          </p>
        )}

        {/* Slots + Participants */}
        <div className="flex items-center gap-3 mb-3">
          <div 
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-[12px] font-medium",
              isFull 
                ? "bg-gray-100 text-gray-500"
                : "bg-emerald-50 text-emerald-700"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            {isFull ? 'Full' : `${trip.slotsOpen} spot${trip.slotsOpen !== 1 ? 's' : ''} left`}
          </div>
          <span 
            className="text-[12px]"
            style={{ color: 'rgba(100, 116, 139, 0.7)' }}
          >
            {trip.participantCount} golfer{trip.participantCount !== 1 ? 's' : ''} going
          </span>
        </div>

        {/* Anonymous host blurb */}
        <p 
          className="text-[12px] mb-3 truncate"
          style={{ color: 'rgba(100, 116, 139, 0.7)' }}
        >
          {hostBlurbText}
        </p>

        {/* CTA Button */}
        <button
          onClick={handleRequestJoin}
          disabled={ctaDisabled || isRequesting}
          className={cn(
            "w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150",
            ctaStyle,
            (ctaDisabled || isRequesting) && "opacity-80 cursor-not-allowed"
          )}
        >
          {isRequesting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {!ctaDisabled && <UserPlus className="w-4 h-4" />}
              {ctaLabel}
            </span>
          )}
        </button>

        {/* Helper text for requested state */}
        {isRequested && (
          <p 
            className="text-[11px] text-center mt-1.5"
            style={{ color: 'rgba(100, 116, 139, 0.7)' }}
          >
            Waiting for host approval
          </p>
        )}
      </div>
    </div>
  );
}
