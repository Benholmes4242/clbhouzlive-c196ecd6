/**
 * LiveRightNow - Landscape leaderboard strip cards
 * Horizontal scroll of broadcast-style cards, one per live tournament.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLiveRightNow, type LiveTournamentWithLeader } from '../../hooks/useOverviewModules';
import { SectionErrorState } from '../SectionErrorState';
import { TOUR_COLORS } from '../../constants/colors';

function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

function formatPurse(purse: number | null): string | null {
  if (!purse) return null;
  return `$${(purse / 1_000_000).toFixed(1)}M`;
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

  const scoreColor = !tournament.leader
    ? 'rgba(255,255,255,0.35)'
    : tournament.leader.score < 0
    ? '#F7931E'
    : tournament.leader.score > 0
    ? '#EF4444'
    : 'rgba(255,255,255,0.35)';

  const scoreBg = !tournament.leader
    ? 'rgba(255,255,255,0.04)'
    : tournament.leader.score < 0
    ? 'rgba(247,147,30,0.10)'
    : tournament.leader.score > 0
    ? 'rgba(220,38,38,0.08)'
    : 'rgba(255,255,255,0.04)';

  const purseStr = formatPurse(tournament.purse);

  return (
    <button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="flex-shrink-0 text-left active:scale-[0.97] transition-transform"
      style={{
        width: 260,
        background: '#0F172A',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 20px rgba(15,23,42,0.20)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
      }}
      aria-label={`${tournament.name} — live now`}
    >
      {/* Left accent stripe */}
      <div style={{ width: 3, flexShrink: 0, background: '#F7931E' }} />

      {/* Score column */}
      <div
        style={{
          width: 72,
          flexShrink: 0,
          padding: '14px 12px 14px 14px',
          background: scoreBg,
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontWeight: 900,
            fontFamily: 'Georgia, serif',
            letterSpacing: '-0.05em',
            lineHeight: 1,
            color: scoreColor,
          }}
        >
          {tournament.leader?.scoreDisplay ?? '—'}
        </div>
        <div
          style={{
            fontSize: 8,
            fontWeight: 800,
            color: scoreColor,
            opacity: 0.5,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginTop: 3,
          }}
        >
          TOTAL
        </div>
      </div>

      {/* Main info column */}
      <div style={{ flex: 1, padding: '12px 0 12px 14px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Tour + Round */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: '8.5px', fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {tourLabel}
          </span>
          <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.3)' }}>·</span>
          <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>
            Round {tournament.currentRound}
          </span>
        </div>

        {/* Tournament name */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.2,
            marginBottom: 4,
            fontFamily: 'Georgia, serif',
            letterSpacing: '-0.025em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tournament.name}
        </div>

        {/* Venue + city */}
        {(tournament.venueName || tournament.venueCity) && (
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.35)',
              marginBottom: 8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {[tournament.venueName, tournament.venueCity].filter(Boolean).join(', ')}
          </div>
        )}

        {/* Hairline */}
        <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.07)', marginBottom: 8 }} />

        {/* Leader row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
            {tournament.leader ? abbreviateName(tournament.leader.name) : 'Starting soon'}
          </span>
          {purseStr && (
            <>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>·</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{purseStr}</span>
            </>
          )}
        </div>
      </div>

      {/* Right column */}
      <div
        style={{
          flexShrink: 0,
          padding: '12px 14px 12px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div
            className="animate-live-pulse"
            style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }}
          />
          <span style={{ fontSize: '8.5px', fontWeight: 700, color: '#22C55E', letterSpacing: '0.06em' }}>
            LIVE
          </span>
        </div>

        {/* Chevron */}
        <ChevronRight style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.2)' }} />
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
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ width: 260, height: 90, borderRadius: 14, background: 'rgba(15,23,42,0.4)', flexShrink: 0 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!liveTournaments || liveTournaments.length === 0) return null;

  return (
    <div style={{ paddingLeft: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingRight: 16 }}>
        <div className="animate-live-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: TOUR_COLORS.liveGreen }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}>
          Live Now
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: TOUR_COLORS.liveGreen,
          background: `${TOUR_COLORS.liveGreen}18`,
          borderRadius: 5,
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
          gap: 10,
          overflowX: 'auto',
          paddingRight: 16,
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
