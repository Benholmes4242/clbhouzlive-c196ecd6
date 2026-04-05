/**
 * LiveRightNow - Compact ticker card strip
 * Horizontal scroll of mini broadcast cards, one per live tournament.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveRightNow, type LiveTournamentWithLeader } from '../../hooks/useOverviewModules';
import { SectionErrorState } from '../SectionErrorState';

import { TOUR_COLORS } from '../../constants/colors';

function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

const LiveBroadcastCard: React.FC<{ tournament: LiveTournamentWithLeader }> = ({ tournament }) => {
  const navigate = useNavigate();

  const tourLabel = (() => {
    switch (tournament.tourSlug?.toLowerCase()) {
      case 'pga': return 'PGA TOUR';
      case 'euro': return 'DP WORLD';
      case 'lpga': return 'LPGA';
      case 'liv': return 'LIV';
      case 'champ': return 'CHAMPIONS';
      case 'pgad': return 'KORN FERRY';
      default: return tournament.tourSlug?.toUpperCase() ?? '';
    }
  })();

  const roundLabel = `R${tournament.currentRound}`;

  const scoreColor = !tournament.leader
    ? 'hsl(var(--muted-foreground))'
    : tournament.leader.score < 0
    ? TOUR_COLORS.movementUp
    : tournament.leader.score > 0
    ? TOUR_COLORS.movementDown
    : 'hsl(var(--muted-foreground))';

  return (
    <button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="flex-shrink-0 text-left active:scale-[0.97] transition-transform"
      style={{
        width: '160px',
        background: 'hsl(var(--card))',
        borderRadius: '12px',
        border: '0.5px solid hsl(var(--border) / 0.5)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
      aria-label={`${tournament.name} — live now`}
    >
      {/* Tour label + live dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
        <div
          className="animate-live-pulse"
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }}
        />
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.06em' }}>
          {tourLabel}
        </span>
      </div>

      {/* Tournament name */}
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'hsl(var(--foreground))',
          lineHeight: 1.3,
          marginBottom: '8px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
          minHeight: '34px',
        }}
      >
        {tournament.name}
      </div>

      {/* Round pill */}
      <div
        style={{
          display: 'inline-block',
          fontSize: '10px',
          fontWeight: 600,
          color: 'hsl(var(--muted-foreground))',
          background: 'hsl(var(--muted))',
          borderRadius: '4px',
          padding: '2px 6px',
          marginBottom: '10px',
          alignSelf: 'flex-start',
        }}
      >
        {roundLabel}
      </div>

      {/* Leader row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '2px' }}>
            {tournament.leader ? abbreviateName(tournament.leader.name) : 'Starting soon'}
          </div>
        </div>
        {tournament.leader && (
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: scoreColor,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              flexShrink: 0,
            }}
          >
            {tournament.leader.scoreDisplay}
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
      <div style={{ padding: '0 16px' }}>
        <SectionErrorState sectionName="Live Right Now" onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div className="animate-live-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: TOUR_COLORS.liveGreen }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}>
            Live Now
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ width: 160, height: 150, borderRadius: 12, background: 'hsl(var(--muted))', flexShrink: 0 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!liveTournaments || liveTournaments.length === 0) return null;

  return (
    <div style={{ paddingLeft: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingRight: '16px' }}>
        <div className="animate-live-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: TOUR_COLORS.liveGreen }} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}>
          Live Now
        </span>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color: TOUR_COLORS.liveGreen,
          background: `${TOUR_COLORS.liveGreen}18`,
          borderRadius: '5px',
          padding: '2px 7px',
          letterSpacing: '0.02em',
        }}>
          {liveTournaments.length}
        </span>
      </div>

      {/* Horizontal scroll strip */}
      <div
        className="[&::-webkit-scrollbar]:hidden"
        style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingRight: '16px',
          paddingBottom: '0px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {liveTournaments.map((tournament) => (
          <LiveBroadcastCard key={tournament.id} tournament={tournament} />
        ))}
      </div>
    </div>
  );
}
