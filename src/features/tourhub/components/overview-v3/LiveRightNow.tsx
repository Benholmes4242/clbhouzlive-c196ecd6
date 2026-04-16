/**
 * LiveRightNow - Flat dispatch-style horizontal scroll strip
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveRightNow, type LiveTournamentWithLeader } from '../../hooks/useOverviewModules';
import { SectionErrorState } from '../SectionErrorState';

function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

function formatPurse(purse: number | null): string | null {
  if (!purse) return null;
  return `$${(purse / 1_000_000).toFixed(1)}M`;
}

const LiveEventRow: React.FC<{ tournament: LiveTournamentWithLeader; isLast: boolean }> = ({ tournament, isLast }) => {
  const navigate = useNavigate();

  const tourLabel = (() => {
    switch (tournament.tourSlug?.toLowerCase()) {
      case 'pga': return 'PGA Tour';
      case 'euro': return 'DP World Tour';
      case 'lpga': return 'LPGA';
      case 'liv': return 'LIV Golf';
      case 'champ': return 'Champions';
      case 'pgad': return 'Korn Ferry';
      default: return tournament.tourSlug?.toUpperCase() ?? '';
    }
  })();

  return (
    <div
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="active:opacity-70 transition-opacity"
      style={{
        flexShrink: 0,
        paddingRight: 20,
        marginRight: isLast ? 0 : 20,
        borderRight: isLast ? 'none' : '0.5px solid rgba(15,23,42,0.07)',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>
        {tourLabel}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' as const, marginBottom: 2 }}>
        {tournament.name}
      </div>
      {tournament.leader && (
        <div style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', whiteSpace: 'nowrap' as const }}>
          {abbreviateName(tournament.leader.name)} {tournament.leader.scoreDisplay}
        </div>
      )}
      {!tournament.leader && (
        <div style={{ fontSize: 10, color: '#94A3B8' }}>Starting soon</div>
      )}
    </div>
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
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <div className="animate-live-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#16A34A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Live Now
          </span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ width: 160, height: 48, borderRadius: 4, background: 'rgba(15,23,42,0.05)', flexShrink: 0 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!liveTournaments || liveTournaments.length === 0) return null;

  return (
    <div style={{ padding: '0 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <div
          className="animate-live-pulse"
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }}
        />
        <span style={{ fontSize: 9, fontWeight: 900, color: '#16A34A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          Live Now
        </span>
      </div>

      {/* Flat horizontal scroll — vertical dividers only */}
      <div
        className="[&::-webkit-scrollbar]:hidden"
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch' as any,
          marginLeft: -20,
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        {liveTournaments.map((tournament, i) => (
          <LiveEventRow
            key={tournament.id}
            tournament={tournament}
            isLast={i === liveTournaments.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
