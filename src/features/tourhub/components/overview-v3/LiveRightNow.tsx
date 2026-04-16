/**
 * LiveRightNow - Landscape leaderboard strip cards
 * Horizontal scroll of broadcast-style cards, one per live tournament.
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

  const roundLabel = tournament.currentRound === 4
    ? 'Final Round'
    : tournament.currentRound > 0
    ? `Round ${tournament.currentRound}`
    : 'Starting Soon';

  const venue = [tournament.venueName, tournament.venueCity].filter(Boolean).join(' · ');

  return (
    <div
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="active:opacity-70 transition-opacity"
      style={{
        flexShrink: 0,
        width: 200,
        paddingRight: 20,
        marginRight: isLast ? 0 : 20,
        borderRight: isLast ? 'none' : '0.5px solid rgba(15,23,42,0.07)',
        cursor: 'pointer',
      }}
    >
      {/* Tour · Round */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
          {tourLabel}
        </span>
        <span style={{ fontSize: 9, color: 'rgba(15,23,42,0.2)' }}>·</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em' }}>
          {roundLabel}
        </span>
      </div>

      {/* Tournament name */}
      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {tournament.name}
      </div>

      {/* Course + city */}
      {venue && (
        <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {venue}
        </div>
      )}

      {/* Hairline */}
      <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.07)', marginBottom: 8 }} />

      {/* Leader */}
      {tournament.leader ? (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
            {abbreviateName(tournament.leader.name)}
          </span>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#16A34A', letterSpacing: '-0.03em' }}>
            {tournament.leader.scoreDisplay}
          </span>
        </div>
      ) : (
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
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div className="animate-live-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: TOUR_COLORS.liveGreen }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}>
            Live Now
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
           {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ width: 286, height: 99, borderRadius: 14, background: 'rgba(15,23,42,0.4)', flexShrink: 0 }}
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
