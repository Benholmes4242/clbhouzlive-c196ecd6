/**
 * LiveRightNow - Broadcast card strip
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
        background: `${color}15`,
        borderRadius: '8px',
        padding: '2px 8px',
      }}
    >
      <span
        style={{
          color,
          fontSize: '22px',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
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

  const tourLabel = (() => {
    switch (tourSlug) {
      case 'pga': return 'PGA TOUR';
      case 'euro': return 'DP WORLD';
      case 'lpga': return 'LPGA';
      case 'liv': return 'LIV';
      case 'champ': return 'CHAMPIONS';
      case 'pgad': return 'KORN FERRY';
      default: return tourSlug.toUpperCase();
    }
  })();
  return (
    <button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="flex-shrink-0 text-left active:scale-[0.97] transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        width: '200px',
        padding: 0,
        background: 'hsl(var(--card))',
        borderRadius: '14px',
        border: '1px solid hsl(var(--border) / 0.4)',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
      aria-label={`${tournament.name} — live now`}
    >
      {/* Live gradient line */}
      <div
        style={{
          background: 'linear-gradient(135deg, #22C55E 0%, #16a34a 60%, #15803d 100%)',
          height: '2px',
          width: '100%',
          flexShrink: 0,
        }}
      />
      {/* Live badge + tour label row */}
      <div
        style={{
          padding: '5px 10px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div
            className="animate-live-pulse"
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.5)' }}
          />
          <span style={{ color: '#22C55E', fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em' }}>
            LIVE
          </span>
        </div>
        {tourLabel && (
          <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em' }}>
            {tourLabel}
          </span>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '6px 10px 10px' }}>
        {/* Tournament name */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'hsl(var(--foreground))',
            lineHeight: 1.3,
            marginBottom: '8px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {tournament.name}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'hsl(var(--border) / 0.5)', marginBottom: '10px' }} />

        {/* Leader row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: 'hsl(var(--muted-foreground))',
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                marginBottom: '3px',
              }}
            >
              LEADER
            </div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'hsl(var(--foreground))',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tournament.leader ? abbreviateName(tournament.leader.name) : 'Starting soon'}
            </div>
          </div>
          {tournament.leader && (
            <ScoreChip
              score={tournament.leader.score}
              display={tournament.leader.scoreDisplay}
            />
          )}
        </div>
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
          <div className="animate-live-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: TOUR_COLORS.liveGreen }} />
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))' }}>
            Live Right Now
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ width: 200, height: 170, borderRadius: 14, background: 'hsl(var(--muted))', flexShrink: 0 }}
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
        <div className="animate-live-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: TOUR_COLORS.liveGreen }} />
        <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))' }}>
          Live Right Now
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: TOUR_COLORS.liveGreen,
            background: `${TOUR_COLORS.liveGreen}15`,
            borderRadius: '6px',
            padding: '3px 8px',
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
