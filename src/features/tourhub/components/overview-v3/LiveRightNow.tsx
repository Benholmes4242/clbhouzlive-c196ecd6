/**
 * LiveRightNow - Compact Live Ticker Strip
 * Single-line-per-tournament vertical stack for scannable at-a-glance live view.
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

// PGA/LPGA logos have more horizontal width so appear larger at 42px — use 36px for visual balance
const WIDE_LOGO_TOURS = ['pga', 'lpga'];

const LiveTickerRow: React.FC<{ tournament: LiveTournamentWithLeader }> = ({ tournament }) => {
  const navigate = useNavigate();
  const tourLogoSrc = getTourLogo(tournament.tourSlug?.toLowerCase() ?? '');
  const logoSize = WIDE_LOGO_TOURS.includes(tournament.tourSlug?.toLowerCase() ?? '') ? 36 : 42;

  return (
    <button
      type="button"
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-card rounded-2xl border border-border/50 text-left transition-all active:scale-[0.98]"
      aria-label={`${tournament.name} — live now`}
    >
      {/* Green live dot */}
      <div style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        backgroundColor: 'rgba(22,163,74,0.8)',
        flexShrink: 0,
        animation: 'live-pulse 2s ease-in-out infinite',
      }} />

      {/* Content: two lines */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Line 1: Tournament name */}
        <div style={{
          fontSize: '13.5px',
          fontWeight: 600,
          color: 'hsl(var(--foreground))',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {tournament.name}
        </div>

        {/* Line 2: Leader name · score */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '1px',
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'hsl(var(--muted-foreground) / 0.6)',
          }}>
            {tournament.leader ? abbreviateName(tournament.leader.name) : 'Starting soon'}
          </span>

          <span style={{
            fontSize: '14px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: tournament.leader
              ? tournament.leader.score < 0
                ? TOUR_COLORS.movementUp
                : tournament.leader.score > 0
                  ? TOUR_COLORS.movementDown
                  : 'hsl(var(--muted-foreground))'
              : 'hsl(var(--muted-foreground) / 0.5)',
          }}>
            {tournament.leader?.scoreDisplay ?? '—'}
          </span>
        </div>
      </div>

      {/* Tour logo */}
      <div
        style={{
          flexShrink: 0,
          width: logoSize,
          height: logoSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.6,
        }}
      >
        <img
          src={tourLogoSrc}
          alt={tournament.tourSlug ?? 'Tour'}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 16px' }}>
          {[0, 1].map(i => (
            <div key={i} className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-card rounded-2xl border border-border/50">
              <div className="w-[7px] h-[7px] rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-3 w-36 rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-20 rounded bg-muted animate-pulse" />
              </div>
              <div className="w-9 h-9 rounded-lg bg-muted animate-pulse flex-shrink-0" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!liveTournaments || liveTournaments.length === 0) {
    return null;
  }

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
      </div>

      {/* Ticker rows */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '0 16px',
      }}>
        {liveTournaments.map((tournament) => (
          <LiveTickerRow key={tournament.id} tournament={tournament} />
        ))}
      </div>
    </section>
  );
}
