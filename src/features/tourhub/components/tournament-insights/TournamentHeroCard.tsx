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
    <div className="relative h-[220px] overflow-hidden">
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
        <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium text-white backdrop-blur-sm">
          Next PGA Event
        </span>
      </div>

      {/* Content - anchored bottom left */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
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
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium text-white backdrop-blur-sm">
              {tournament.purseText}
            </span>
          )}
          {tournament.parText && (
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium text-white backdrop-blur-sm">
              {tournament.parText}
            </span>
          )}
          {tournament.yardageText && (
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium text-white backdrop-blur-sm">
              {tournament.yardageText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
