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

export const TournamentHeroCard = memo(function TournamentHeroCard({
  tournament,
  isLive = false,
  isCompleted = false,
}: TournamentHeroCardProps) {
  const venueImageQuery = useVenueImage(tournament.courseName, null);
  const imageUrl = venueImageQuery.data?.imageUrl || tournament.heroImageUrl;

  const pillStyle = {
    fontSize: '11px',
    fontWeight: 500 as const,
    letterSpacing: '0.05em',
    color: 'rgba(255, 255, 255, 0.85)',
    background: 'rgba(0, 0, 0, 0.45)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  };

  // Badge config per state
  const getBadgeConfig = () => {
    if (isLive) {
      return {
        label: 'LIVE TOURNAMENT',
        bg: 'rgba(220, 38, 38, 0.9)',
        showDot: true,
      };
    }
    if (isCompleted) {
      return {
        label: 'LATEST RESULTS',
        bg: 'rgba(255, 255, 255, 0.15)',
        showDot: false,
      };
    }
    return {
      label: 'NEXT TOURNAMENT',
      bg: 'rgba(255, 255, 255, 0.15)',
      showDot: false,
    };
  };

  const badge = getBadgeConfig();

  return (
    <div className="relative overflow-hidden" style={{ height: `${Math.round(306 * 0.8)}px` }}>
      {/* Background Image */}
      <img
        src={imageUrl}
        alt={tournament.courseName}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0.05) 100%)',
        }}
      />

      {/* Top Left Badge */}
      <div className="absolute top-4 left-4">
        <span
          className="inline-flex items-center gap-1.5 uppercase font-bold"
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'rgba(255, 255, 255, 0.95)',
            background: badge.bg,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '5px 12px',
            borderRadius: '8px',
          }}
        >
          {badge.showDot && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: 'white',
                animation: 'pulse 1.5s infinite',
                flexShrink: 0,
              }}
            />
          )}
          {badge.label}
        </span>
      </div>

      {/* Content — anchored bottom left */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-4">
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
                className="uppercase"
                style={{ ...pillStyle, padding: '4px 10px', borderRadius: '6px' }}
              >
                {text}
              </span>
            ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
});
