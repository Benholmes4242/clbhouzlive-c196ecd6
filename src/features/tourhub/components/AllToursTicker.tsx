/**
 * AllToursTicker — Tour Hub redesign Phase B
 *
 * Dark navy stock-ticker treatment that sits flush below the Live Hero.
 * Replaces the brighter "Live Right Now" strip on the Overview page only.
 * (LiveRightNow remains in use on the Schedule tab.)
 *
 * Visual identity:
 *   - Dark navy background (#0F172A)
 *   - Pulsing green dot + "LIVE · ALL TOURS" tracked-caps eyebrow
 *   - Right-aligned "N LIVE NOW" count
 *   - Horizontal scroll of tour cells separated by hairline dividers
 *   - Each cell: amber tour pill + event name + flag + leader name + score (with live pulse dot)
 *   - Bottom amber shimmer line via `th-shimmer-line` keyframe
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveRightNow, type LiveTournamentWithLeader } from '../hooks/useOverviewModules';
import CountryFlag from '@/components/ui/country-flag';

function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

function tourPillLabel(slug?: string | null): string {
  switch ((slug ?? '').toLowerCase()) {
    case 'pga': return 'PGA';
    case 'euro': return 'DPWT';
    case 'lpga': return 'LPGA';
    case 'liv': return 'LIV';
    case 'champ': return 'CHAMPIONS';
    case 'pgad': return 'KORN FERRY';
    default: return (slug ?? '').toUpperCase();
  }
}

const TickerCell: React.FC<{ tournament: LiveTournamentWithLeader; isLast: boolean }> = ({ tournament, isLast }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="active:opacity-70 transition-opacity"
      style={{
        flexShrink: 0,
        minWidth: 220,
        padding: '12px 18px',
        borderRight: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)',
        textAlign: 'left',
        background: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
      }}
    >
      {/* Tour pill + tournament name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 6px',
            border: '1px solid rgba(247,147,30,0.45)',
            borderRadius: 4,
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: '0.14em',
            color: '#F7931E',
            textTransform: 'uppercase',
            lineHeight: 1.2,
          }}
        >
          {tourPillLabel(tournament.tourSlug)}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.92)',
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 160,
          }}
        >
          {tournament.name}
        </span>
      </div>

      {/* Leader row */}
      {tournament.leader ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CountryFlag country={tournament.leader.country} size="sm" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.78)',
              letterSpacing: '-0.005em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 110,
            }}
          >
            {abbreviateName(tournament.leader.name)}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 900,
              color: '#10B981',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"kern" 1, "liga" 1',
            }}
          >
            {tournament.leader.scoreDisplay}
          </span>
          <span className="th-live-dot" style={{ width: 6, height: 6, marginLeft: 2 }} aria-hidden />
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Starting soon</div>
      )}
    </button>
  );
};

export function AllToursTicker() {
  const { data: liveTournaments, isLoading } = useLiveRightNow();

  if (isLoading) {
    return (
      <div style={{ background: '#0F172A', padding: '14px 0 16px' }}>
        <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="th-live-dot" aria-hidden />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#10B981', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Live · All Tours
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '0 20px', overflowX: 'hidden' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ flexShrink: 0, width: 220, height: 56, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!liveTournaments || liveTournaments.length === 0) return null;

  return (
    <section
      aria-label="Live tournaments across all tours"
      style={{
        background: '#0F172A',
        position: 'relative',
        paddingTop: 14,
        paddingBottom: 14,
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Eyebrow row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="th-live-dot" aria-hidden />
          <span
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: '#10B981',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            Live · All Tours
          </span>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {liveTournaments.length} Live Now
        </span>
      </div>

      {/* Horizontal scroll of cells */}
      <div
        className="[&::-webkit-scrollbar]:hidden"
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch' as any,
          willChange: 'transform',
        }}
      >
        {liveTournaments.map((t, i) => (
          <TickerCell key={t.id} tournament={t} isLast={i === liveTournaments.length - 1} />
        ))}
      </div>

      {/* Bottom amber shimmer line */}
      <div className="th-shimmer-line" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} aria-hidden />
    </section>
  );
}

export default AllToursTicker;
