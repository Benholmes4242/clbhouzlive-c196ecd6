/**
 * TournamentHeroCard - Cinematic cover with venue image
 * Full-bleed with rounded bottom corners, state-colored badge
 * Uses canonical HUD glass spec for overlays
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
  winner?: {
    name: string;
    photoUrl?: string | null;
    scoreDisplay: string;
    marginText?: string;
    country?: string | null;
  } | null;
}

/** Canonical HUD glass spec */
const HUD_GLASS = {
  background: 'rgba(0, 0, 0, 0.35)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
} as const;

export const TournamentHeroCard = memo(function TournamentHeroCard({
  tournament,
  isLive = false,
  isCompleted = false,
  winner = null,
}: TournamentHeroCardProps) {
  const venueImageQuery = useVenueImage(tournament.courseName, null);
  const imageUrl = venueImageQuery.data?.imageUrl || tournament.heroImageUrl;

  // Badge config per state — all use HUD glass
  const getBadgeConfig = () => {
    if (isLive) {
      return {
        label: 'LIVE TOURNAMENT',
        showDot: true,
      };
    }
    if (isCompleted) {
      return {
        label: 'LATEST RESULTS',
        showDot: false,
      };
    }
    return {
      label: 'NEXT TOURNAMENT',
      showDot: false,
    };
  };

  const badge = getBadgeConfig();

  // ── Completed state with winner data: dark cinematic split layout ──
  if (isCompleted && winner) {
    return (
      <div className="relative overflow-hidden" style={{ minHeight: 244, background: '#0d1421' }}>
        {/* Venue image — right half, fading left */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '55%', height: '100%' }}>
          <img
            src={imageUrl}
            alt={tournament.courseName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            loading="eager"
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, #0d1421 0%, rgba(13,20,33,0.6) 50%, transparent 100%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(13,20,33,0.5) 0%, transparent 40%)',
          }} />
        </div>

        {/* Left content panel */}
        <div style={{ position: 'relative', zIndex: 2, padding: '20px 16px 24px', width: '65%' }}>
          {/* Top badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const,
            }}>
              {tournament.dateRangeText}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>·</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#F7931E', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
              FINAL
            </span>
          </div>

          {/* Tournament name */}
          <div style={{
            fontSize: 13, fontWeight: 600,
            color: 'rgba(255,255,255,0.45)',
            marginBottom: 6, lineHeight: 1.2,
          }}>
            {tournament.name}
          </div>

          {/* Champion eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <span style={{ fontSize: 12 }}>🏆</span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#F7931E',
              letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            }}>Champion</span>
          </div>

          {/* Winner name */}
          <div style={{
            fontSize: 26, fontWeight: 900, color: '#ffffff',
            letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 8,
          }}>
            {winner.name}
          </div>

          {/* Score */}
          <div style={{
            fontSize: 48, fontWeight: 900, color: '#F7931E',
            letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6,
          }}>
            {winner.scoreDisplay}
          </div>

          {/* Margin text */}
          {winner.marginText && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              {winner.marginText}
            </div>
          )}
        </div>

        {/* Bottom: course name */}
        <div style={{
          position: 'absolute', bottom: 14, left: 16, right: 16, zIndex: 2,
        }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            {tournament.courseName}{tournament.location ? ` · ${tournament.location}` : ''}
          </span>
        </div>
      </div>
    );
  }

  // ── Default layout (upcoming / completed-without-winner / live) ──
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

      {/* Top Left Badge — HUD glass */}
      <div className="absolute top-4 left-4">
        <span
          className="inline-flex items-center gap-1.5 uppercase font-bold"
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'rgba(255, 255, 255, 0.95)',
            ...HUD_GLASS,
            padding: '5px 12px',
            borderRadius: '8px',
          }}
        >
          {badge.showDot && (
            <span
              className="live-dot-green"
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: 'var(--th-accent-live)',
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

        {/* Metadata Chips — HUD glass */}
        <div className="flex flex-wrap gap-2">
          {[tournament.purseText, tournament.parText, tournament.yardageText]
            .filter(Boolean)
            .map((text, i) => (
              <span
                key={i}
                className="uppercase"
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  color: 'rgba(255, 255, 255, 0.85)',
                  ...HUD_GLASS,
                  padding: '4px 10px',
                  borderRadius: '6px',
                }}
              >
                {text}
              </span>
            ))}
        </div>
      </div>

      <style>{`
        .live-dot-green {
          animation: liveDotPulse 1.5s infinite;
        }
        @keyframes liveDotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
});
