/**
 * LiveRightNow - Compact Live Ticker Strip
 * Single-line-per-tournament vertical stack for scannable at-a-glance live view.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveRightNow, type LiveTournamentWithLeader } from '../../hooks/useOverviewModules';
import { SectionErrorState } from '../SectionErrorState';

const LiveTickerRow: React.FC<{ tournament: LiveTournamentWithLeader }> = ({ tournament }) => {
  const navigate = useNavigate();

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

      {/* Left: two lines stacked */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Line 1: Tournament name */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
            fontSize: '13.5px',
            fontWeight: 600,
            color: 'rgba(0,0,0,0.85)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
            flex: 1,
          }}>
            {tournament.name}
          </span>
        </div>

        {/* Line 2: Leader name */}
        <div style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'rgba(0,0,0,0.45)',
          marginTop: '2px',
        }}>
          {tournament.leader?.name ?? 'Starting soon'}
        </div>
      </div>

      {/* Right: Score */}
      <div style={{
        flexShrink: 0,
        fontSize: '18px',
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        color: tournament.leader
          ? tournament.leader.score < 0
            ? 'rgba(22,163,74,0.9)'
            : tournament.leader.score > 0
              ? 'rgba(220,38,38,0.85)'
              : 'rgba(0,0,0,0.35)'
          : 'rgba(0,0,0,0.25)',
        minWidth: '36px',
        textAlign: 'right' as const,
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
