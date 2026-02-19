/**
 * LiveRightNow - Compact Live Ticker Strip
 * Single-line-per-tournament vertical stack for scannable at-a-glance live view.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveRightNow, type LiveTournamentWithLeader } from '../../hooks/useOverviewModules';
import { SectionErrorState } from '../SectionErrorState';
import { getTourLogo } from '../../utils/tourLogos';

const LiveTickerRow: React.FC<{ tournament: LiveTournamentWithLeader }> = ({ tournament }) => {
  const navigate = useNavigate();
  const tourLogoSrc = getTourLogo(tournament.tourSlug?.toLowerCase() ?? '');

  return (
    <div
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="w-full flex items-center gap-2.5 px-3 py-2 bg-card rounded-xl border border-border/40 text-left transition-all active:scale-[0.98]"
      style={{ cursor: 'pointer' }}
    >
      {/* Green live dot */}
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'rgba(22,163,74,0.8)',
        flexShrink: 0,
        animation: 'live-pulse 2s ease-in-out infinite',
      }} />

      {/* Content: two lines */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Line 1: Tournament name */}
        <div style={{
          fontSize: '12.5px',
          fontWeight: 600,
          color: 'rgba(0,0,0,0.8)',
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
          gap: '5px',
          marginTop: '1px',
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'rgba(0,0,0,0.4)',
          }}>
            {tournament.leader?.name ?? 'Starting soon'}
          </span>

          <span style={{
            fontSize: '11.5px',
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: tournament.leader
              ? tournament.leader.score < 0
                ? 'rgba(22,163,74,0.9)'
                : tournament.leader.score > 0
                  ? 'rgba(220,38,38,0.85)'
                  : 'rgba(0,0,0,0.35)'
              : 'rgba(0,0,0,0.25)',
          }}>
            {tournament.leader?.scoreDisplay ?? '—'}
          </span>
        </div>
      </div>

      {/* Tour logo */}
      <div
        style={{
          flexShrink: 0,
          width: ['pga', 'lpga'].includes(tournament.tourSlug?.toLowerCase() ?? '') ? 20 : 24,
          height: ['pga', 'lpga'].includes(tournament.tourSlug?.toLowerCase() ?? '') ? 20 : 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.4,
        }}
      >
        <img
          src={tourLogoSrc}
          alt={tournament.tourSlug ?? 'Tour'}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </div>
    </div>
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

  if (isLoading || !liveTournaments || liveTournaments.length === 0) {
    return null;
  }

  return (
    <section className="bg-background" aria-label="Live tournaments">
      {/* Header — unchanged */}
      <div className="flex items-center gap-2 mb-4 px-4">
        <span
          className="w-2 h-2 rounded-full animate-live-pulse"
          style={{
            background: '#22C55E',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.45)',
          }}
        />
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Live Right Now
        </h2>
      </div>

      {/* Ticker rows */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '0 16px',
        marginTop: '10px',
      }}>
        {liveTournaments.map((tournament) => (
          <LiveTickerRow key={tournament.id} tournament={tournament} />
        ))}
      </div>
    </section>
  );
}
