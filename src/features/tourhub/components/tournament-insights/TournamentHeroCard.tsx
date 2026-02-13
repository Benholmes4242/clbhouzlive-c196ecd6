/**
 * TournamentHeroCard - Chapter 1: Cover page with venue image
 * Now supports LIVE badge overlay during in-progress tournaments
 */

import { memo } from 'react';
import { useVenueImage } from '../../hooks/useVenueImage';
import { LiveBadge } from './LiveBadge';

interface TournamentHeroCardProps {
  tournament: {
    name: string;
    courseName: string;
    location?: string;
    dateRangeText: string;
    purseText?: string;
    parText?: string;
    yardageText?: string;
    heroImageUrl: string;
  };
  isLive?: boolean;
}

export const TournamentHeroCard = memo(function TournamentHeroCard({
  tournament,
  isLive = false,
}: TournamentHeroCardProps) {
  // Try to fetch actual venue image
  const venueImageQuery = useVenueImage(tournament.courseName, null);
  const imageUrl = venueImageQuery.data?.imageUrl || tournament.heroImageUrl;

  return (
    <div className="relative h-[306px] overflow-hidden">
      {/* Background Image - full bleed, pointed corners */}
      <img
        src={imageUrl}
        alt={tournament.courseName}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />

      {/* Gradient Overlay - dark at bottom, transparent at top */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Top Left Pill - context-aware */}
      <div className="absolute top-4 left-4">
        <span 
          className="px-3 py-[5px] rounded-[8px] uppercase font-bold"
          style={{
            fontSize: '11px',
            letterSpacing: '0.8px',
            color: 'rgba(255, 255, 255, 0.95)',
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          {isLive ? 'Live Tournament' : 'Next PGA Event'}
        </span>
      </div>

      {/* Top Right — LIVE badge */}
      {isLive && (
        <div className="absolute top-4 right-4">
          <LiveBadge />
        </div>
      )}

      {/* Content - anchored bottom left */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-4">
        {/* Tournament Name */}
        <h2 className="text-white leading-tight mb-1" style={{ fontSize: '20px', fontWeight: 700 }}>
          {tournament.name}
        </h2>

        {/* Course + Dates */}
        <p className="text-[15px] text-white/80 mb-3">
          {tournament.courseName} • {tournament.dateRangeText}
        </p>

        {/* Metadata Chips — glass style */}
        <div className="flex flex-wrap gap-2">
          {tournament.purseText && (
            <span 
            className="px-2 py-[4px] rounded-[5px] uppercase"
              style={{
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                color: 'rgba(255, 255, 255, 0.85)',
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              {tournament.purseText}
            </span>
          )}
          {tournament.parText && (
            <span 
            className="px-2 py-[4px] rounded-[5px] uppercase"
              style={{
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                color: 'rgba(255, 255, 255, 0.85)',
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              {tournament.parText}
            </span>
          )}
          {tournament.yardageText && (
            <span 
            className="px-2 py-[4px] rounded-[5px] uppercase"
              style={{
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                color: 'rgba(255, 255, 255, 0.85)',
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              {tournament.yardageText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
