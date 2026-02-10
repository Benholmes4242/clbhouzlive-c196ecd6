/**
 * TournamentHeroCard - Chapter 1: Cover page with venue image
 */

import { memo } from 'react';
import { useVenueImage } from '../../hooks/useVenueImage';

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
}

export const TournamentHeroCard = memo(function TournamentHeroCard({
  tournament,
}: TournamentHeroCardProps) {
  // Try to fetch actual venue image
  const venueImageQuery = useVenueImage(tournament.courseName, null);
  const imageUrl = venueImageQuery.data?.imageUrl || tournament.heroImageUrl;

  return (
    <div className="relative h-[278px] overflow-hidden">
      {/* Background Image - full bleed, pointed corners */}
      <img
        src={imageUrl}
        alt={tournament.courseName}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />

      {/* Gradient Overlay - dark at bottom, transparent at top */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Top Left Pill - Next PGA Event */}
      <div className="absolute top-4 left-4">
        <span 
          className="px-[10px] py-[4px] rounded-[8px] uppercase font-bold"
          style={{
            fontSize: '10px',
            letterSpacing: '0.8px',
            color: 'rgba(255, 255, 255, 0.85)',
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          Next PGA Event
        </span>
      </div>

      {/* Content - anchored bottom left */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-4">
        {/* Tournament Name */}
        <h2 className="text-xl font-bold text-white leading-tight mb-1">
          {tournament.name}
        </h2>

        {/* Course + Dates */}
        <p className="text-sm text-white/80 mb-3">
          {tournament.courseName} • {tournament.dateRangeText}
        </p>

        {/* Metadata Chips */}
        <div className="flex flex-wrap gap-2">
          {tournament.purseText && (
            <span 
              className="px-[7px] py-[3px] rounded-[5px] uppercase font-bold"
              style={{
                fontSize: '9px',
                letterSpacing: '0.6px',
                color: 'rgba(255, 255, 255, 0.85)',
                background: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              {tournament.purseText}
            </span>
          )}
          {tournament.parText && (
            <span 
              className="px-[7px] py-[3px] rounded-[5px] uppercase font-bold"
              style={{
                fontSize: '9px',
                letterSpacing: '0.6px',
                color: 'rgba(255, 255, 255, 0.85)',
                background: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              {tournament.parText}
            </span>
          )}
          {tournament.yardageText && (
            <span 
              className="px-[7px] py-[3px] rounded-[5px] uppercase font-bold"
              style={{
                fontSize: '9px',
                letterSpacing: '0.6px',
                color: 'rgba(255, 255, 255, 0.85)',
                background: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
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
