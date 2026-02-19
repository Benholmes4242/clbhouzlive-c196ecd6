/**
 * LiveRightNow - Compact Live Ticker Strip
 * Single-line-per-tournament vertical stack for scannable at-a-glance live view.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveRightNow, type LiveTournamentWithLeader } from '../../hooks/useOverviewModules';
import { SectionErrorState } from '../SectionErrorState';

function getTourLabel(tourSlug: string): string {
  const labels: Record<string, string> = {
    pga: 'PGA TOUR',
    euro: 'DP WORLD',
    lpga: 'LPGA',
    liv: 'LIV',
    pgad: 'KORN FERRY',
    champ: 'CHAMPIONS',
  };
  return labels[tourSlug?.toLowerCase()] ?? tourSlug?.toUpperCase() ?? 'TOUR';
}

const LiveTickerRow: React.FC<{ tournament: LiveTournamentWithLeader }> = ({ tournament }) => {
  const navigate = useNavigate();
  const tourLabel = getTourLabel(tournament.tourSlug);

  return (
    <div
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '14px',
        background: 'rgba(0,0,0,0.03)',
        border: '1px solid rgba(0,0,0,0.06)',
        cursor: 'pointer',
      }}
    >
      {/* Green live dot */}
      <div style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        backgroundColor: 'rgba(22,163,74,0.8)',
        flexShrink: 0,
        alignSelf: 'center',
        animation: 'live-pulse 2s ease-in-out infinite',
      }} />

      {/* Content: two lines */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Line 1: Tournament name — full width */}
        <div style={{
          fontSize: '13.5px',
          fontWeight: 600,
          color: 'rgba(0,0,0,0.85)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {tournament.name}
        </div>

        {/* Line 2: Leader name · score · tour badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '3px',
        }}>
          {/* Leader name */}
          <span style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'rgba(0,0,0,0.45)',
          }}>
            {tournament.leader?.name ?? 'Starting soon'}
          </span>

          {/* Score */}
          <span style={{
            fontSize: '13px',
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

          {/* Spacer pushes badge right */}
          <div style={{ flex: 1 }} />

          {/* Tour badge */}
          <span style={{
            flexShrink: 0,
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.4)',
            padding: '2px 6px',
            borderRadius: '5px',
            background: 'rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            {tourLabel}
          </span>
        </div>
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
