/**
 * LiveRightNow - Broadcast card strip
 * Horizontal scroll of mini broadcast cards, one per live tournament.
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
  const tourLogoSrc = getTourLogo(tourSlug);
  const logoSize = WIDE_LOGO_TOURS.includes(tourSlug) ? 32 : 38;

  return (
    <button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="flex-shrink-0 text-left active:scale-[0.98] transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        width: '180px',
        background: 'hsl(var(--card))',
        borderRadius: '16px',
        border: '1px solid hsl(var(--border) / 0.5)',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
      aria-label={`${tournament.name} — live now`}
    >
      {/* Green top strip */}
      <div
        style={{
          background: 'linear-gradient(90deg, #16a34a, #15803d)',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em' }}>
          LIVE
        </span>
        <div
          className="animate-live-pulse"
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}
        />
      </div>

      <div style={{ padding: '10px 12px 12px' }}>
        {/* Tournament name — 2 line clamp */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'hsl(var(--foreground))',
            lineHeight: 1.25,
            marginBottom: '10px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {tournament.name}
        </div>

        {/* Leader + score chip */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '9px',
                fontWeight: 600,
                color: 'hsl(var(--muted-foreground))',
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                marginBottom: '2px',
              }}
            >
              Leader
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
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

        {/* Tour logo — bottom of card */}
        {tourLogoSrc && (
          <div style={{ marginTop: '10px', opacity: 0.5 }}>
            <img
              src={tourLogoSrc}
              alt=""
              style={{ height: logoSize, width: 'auto', objectFit: 'contain' }}
            />
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
          <div className="animate-live-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: TOUR_COLORS.liveGreen }} />
          <span style={{ fontSize: '17px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            Live Right Now
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ width: 180, height: 160, borderRadius: 16, background: 'hsl(var(--muted))', flexShrink: 0 }}
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
        <span style={{ fontSize: '17px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
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
          paddingBottom: '4px',
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
