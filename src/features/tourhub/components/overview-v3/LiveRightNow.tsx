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
        gap: '10px',
        padding: '10px 14px',
        borderRadius: '14px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        cursor: 'pointer',
      }}
    >
      {/* Green live dot */}
      <div style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        backgroundColor: 'rgba(74,222,128,0.9)',
        flexShrink: 0,
        animation: 'live-pulse 2s ease-in-out infinite',
      }} />

      {/* Tournament name — takes available space */}
      <div style={{
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: '13px',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.88)',
      }}>
        {tournament.name}
      </div>

      {/* Tour badge pill */}
      <div style={{
        flexShrink: 0,
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.45)',
        padding: '3px 7px',
        borderRadius: '6px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {tourLabel}
      </div>

      {/* Leader name */}
      <div style={{
        flexShrink: 0,
        fontSize: '12px',
        fontWeight: 500,
        color: 'rgba(255,255,255,0.5)',
        maxWidth: '90px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {tournament.leader?.name ?? 'Starting soon'}
      </div>

      {/* Leader score */}
      <div style={{
        flexShrink: 0,
        fontSize: '16px',
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        color: tournament.leader
          ? tournament.leader.score < 0
            ? 'rgba(74,222,128,0.9)'
            : tournament.leader.score > 0
              ? 'rgba(248,113,113,0.85)'
              : 'rgba(255,255,255,0.4)'
          : 'rgba(255,255,255,0.3)',
        minWidth: '36px',
        textAlign: 'right',
      }}>
        {tournament.leader?.scoreDisplay ?? '—'}
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
