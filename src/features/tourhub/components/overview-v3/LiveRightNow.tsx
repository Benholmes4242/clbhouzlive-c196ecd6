/**
 * LiveRightNow - Broadcast card strip
 * Horizontal scroll of mini broadcast cards, one per live tournament.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveRightNow, type LiveTournamentWithLeader } from '../../hooks/useOverviewModules';
import { SectionErrorState } from '../SectionErrorState';
import { getTourLogo } from '../../utils/tourLogos';
import { TOUR_COLORS } from '../../constants/colors';

function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

const WIDE_LOGO_TOURS = ['pga', 'lpga'];

function ScoreChip({ score, display }: { score: number; display: string }) {
  const color = score < 0
    ? TOUR_COLORS.movementUp
    : score > 0
    ? TOUR_COLORS.movementDown
    : 'hsl(var(--muted-foreground))';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: '8px',
        background: 'hsl(var(--muted) / 0.6)',
      }}
    >
      <span
        style={{
          fontSize: '15px',
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          color,
          letterSpacing: '-0.5px',
        }}
      >
        {display}
      </span>
    </div>
  );
}

const LiveBroadcastCard: React.FC<{ tournament: LiveTournamentWithLeader }> = ({ tournament }) => {
  const navigate = useNavigate();
  const tourSlug = tournament.tourSlug?.toLowerCase() ?? '';
  const tourLogoSrc = getTourLogo(tourSlug);
  const logoSize = WIDE_LOGO_TOURS.includes(tourSlug) ? 32 : 38;

  return (
    <button
      type="button"
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="flex-shrink-0 text-left active:scale-[0.98] transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        width: '180px',
        background: 'hsl(var(--card))',
        borderRadius: '16px',
        border: '1px solid hsl(var(--border) / 0.5)',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
      aria-label={`${tournament.name} — live now`}
    >
      {/* Green top strip */}
      <div
        style={{
          height: '4px',
          background: TOUR_COLORS.liveGreen,
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '6px',
            left: '12px',
            fontSize: '8px',
            fontWeight: 800,
            letterSpacing: '1.5px',
            color: TOUR_COLORS.liveGreen,
          }}
        >
          LIVE
        </span>
        <div style={{ position: 'absolute', top: '6px', right: '12px' }}>
          {tourLogoSrc && (
            <img
              src={tourLogoSrc}
              alt={tourSlug}
              style={{
                width: logoSize,
                height: logoSize,
                objectFit: 'contain',
                opacity: 0.5,
              }}
            />
          )}
        </div>
      </div>

      <div style={{ padding: '20px 12px 12px' }}>
        {/* Tournament name */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'hsl(var(--foreground))',
            lineHeight: 1.3,
            marginBottom: '10px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {tournament.name}
        </div>

        {/* Leader + score chip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'hsl(var(--muted-foreground) / 0.5)',
                marginBottom: '2px',
              }}
            >
              Leader
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'hsl(var(--foreground))',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tournament.leader
                ? abbreviateName(tournament.leader.name)
                : 'Starting soon'}
            </div>
          </div>

          {tournament.leader && (
            <ScoreChip score={tournament.leader.score} display={tournament.leader.scoreDisplay} />
          )}
        </div>

        {/* Tour logo */}
        {tourLogoSrc && (
          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              justifyContent: 'flex-end',
              opacity: 0.4,
            }}
          >
            <img
              src={tourLogoSrc}
              alt={tourSlug}
              style={{ width: logoSize, height: logoSize, objectFit: 'contain' }}
            />
          </div>
        )}
      </div>
    </button>
  );
};

export function LiveRightNow() {
  const { data: liveTournaments, isLoading, error, refetch } = useLiveRightNow();

  if (error) {
    return (
      <section aria-label="Live tournaments">
        <SectionErrorState sectionName="live tournaments" onRetry={() => refetch()} />
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="bg-background" aria-label="Live tournaments">
        <div className="flex items-center gap-2 mb-4 px-4">
          <span className="w-2 h-2 rounded-full bg-green-500 opacity-50" />
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            Live Right Now
          </h2>
        </div>
        <div
          className="[&::-webkit-scrollbar]:hidden"
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            padding: '0 16px',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 rounded-2xl bg-card border border-border/50 animate-pulse"
              style={{ width: '180px', height: '140px' }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (!liveTournaments || liveTournaments.length === 0) return null;

  return (
    <section className="bg-background" aria-label="Live tournaments">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 px-4">
        <span
          className="w-2 h-2 rounded-full animate-live-pulse"
          style={{
            background: '#22C55E',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.45)',
          }}
        />
        <h2 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
          Live Right Now
        </h2>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1px',
            color: TOUR_COLORS.liveGreen,
          }}
        >
          {liveTournaments.length} LIVE
        </span>
      </div>

      {/* Horizontal scroll strip */}
      <div
        className="[&::-webkit-scrollbar]:hidden"
        style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          padding: '0 16px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {liveTournaments.map((tournament) => (
          <LiveBroadcastCard key={tournament.id} tournament={tournament} />
        ))}
      </div>
    </section>
  );
}
