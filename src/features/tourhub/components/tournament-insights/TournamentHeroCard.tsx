/**
 * TournamentHeroCard - Cinematic cover with venue image
 * Full-bleed with rounded bottom corners, state-colored badge
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
  isLive?: boolean;
  isCompleted?: boolean;
}

const getBadgeAccent = (isLive: boolean, isCompleted: boolean): string => {
  if (isLive) return '#22c55e';
  if (isCompleted) return '#F59E0B';
  return '#3478F6';
};

export const TournamentHeroCard = memo(function TournamentHeroCard({
  tournament,
  isLive = false,
  isCompleted = false,
}: TournamentHeroCardProps) {
  const venueImageQuery = useVenueImage(tournament.courseName, null);
  const imageUrl = venueImageQuery.data?.imageUrl || tournament.heroImageUrl;
  const badgeAccent = getBadgeAccent(isLive, isCompleted);

  const pillStyle = {
    fontSize: '10px',
    fontWeight: 500 as const,
    letterSpacing: '0.05em',
    color: 'rgba(255, 255, 255, 0.85)',
    background: 'rgba(0, 0, 0, 0.45)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  };

  return (
    <div className="relative overflow-hidden rounded-b-2xl" style={{ height: `${Math.round(306 * 0.8)}px` }}>
      {/* Background Image */}
      <img
        src={imageUrl}
        alt={tournament.courseName}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />

      {/* Gradient Overlay — richer bottom, lighter middle, whisper at top */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0.05) 100%)',
        }}
      />

      {/* Top Left Badge — state-colored left border */}
      <div className="absolute top-4 left-4">
        <span
          className="px-3 py-[5px] rounded-[8px] uppercase font-bold inline-block"
          style={{
            fontSize: '11px',
            letterSpacing: '0.8px',
            color: 'rgba(255, 255, 255, 0.95)',
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderLeft: `3px solid ${badgeAccent}`,
          }}
        >
          {isLive ? 'LIVE TOURNAMENT' : isCompleted ? 'LATEST RESULTS' : 'NEXT TOURNAMENT'}
        </span>
      </div>

      {/* Content — anchored bottom left */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-4">
        {/* Tournament Name — 22px/800 with text shadow */}
        <h2
          className="leading-tight mb-1"
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'white',
            textShadow: '0 1px 8px rgba(0,0,0,0.3)',
          }}
        >
          {tournament.name}
        </h2>

        {/* Course + Dates */}
        <p
          className="mb-3"
          style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.75)',
            textShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        >
          {tournament.courseName} • {tournament.dateRangeText}
        </p>

        {/* Metadata Chips */}
        <div className="flex flex-wrap gap-2">
          {[tournament.purseText, tournament.parText, tournament.yardageText]
            .filter(Boolean)
            .map((text, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-[6px] uppercase"
                style={pillStyle}
              >
                {text}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
});
