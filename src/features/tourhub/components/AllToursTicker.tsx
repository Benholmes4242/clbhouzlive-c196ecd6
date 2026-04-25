/**
 * AllToursTicker — Tour Hub redesign Phase B
 *
 * Dark navy stock-ticker treatment that sits flush below the Live Hero.
 * Replaces the brighter "Live Right Now" strip on the Overview page only.
 * (LiveRightNow remains in use on the Schedule tab.)
 *
 * Phase A — Hero+Ticker Unification:
 *   - Background gradient now matches the dark-card system
 *     (linear-gradient 135deg #0a1628 → #1e293b — same as UpNextBroadcast)
 *   - Each cell is now a Hero switcher (tap = swap Hero, no navigation)
 *   - Active cell: amber 1.5px border + amber-tinted bg + "NOW SHOWING" label
 *   - Eyebrow shows "{N} LIVE NOW · TAP TO SWITCH" hint
 *
 * Visual identity:
 *   - Pulsing green dot + "LIVE · ALL TOURS" tracked-caps eyebrow
 *   - Right-aligned "{N} LIVE NOW · TAP TO SWITCH" hint
 *   - Horizontal scroll of tour cells separated by hairline dividers
 *   - Each cell: amber tour pill + event name + flag + leader name + score (with live pulse dot)
 *   - Bottom amber shimmer line via `th-shimmer-line` keyframe
 */

import React from 'react';
import { useLiveRightNow, type LiveTournamentWithLeader } from '../hooks/useOverviewModules';
import CountryFlag from '@/components/ui/country-flag';

const TICKER_GRADIENT = 'linear-gradient(135deg, #0a1628 0%, #1e293b 100%)';

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

interface TickerCellProps {
  tournament: LiveTournamentWithLeader;
  isLast: boolean;
  isActive: boolean;
  onSelect: (id: string) => void;
}

const TickerCell: React.FC<TickerCellProps> = ({ tournament, isLast, isActive, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(tournament.id)}
      className="active:opacity-80"
      style={{
        flexShrink: 0,
        minWidth: 220,
        padding: '12px 18px',
        borderRight: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)',
        textAlign: 'left',
        background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
        outline: isActive ? '1.5px solid #FFFFFF' : '1px solid transparent',
        outlineOffset: -1,
        color: 'inherit',
        cursor: 'pointer',
        transition: 'background 0.25s ease, outline-color 0.25s ease',
        position: 'relative',
      }}
      aria-pressed={isActive}
    >

      {/* Tour pill + tournament name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 7px',
            background: '#fff',
            borderRadius: 4,
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: '0.1em',
            color: '#000',
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
            color: isActive ? 'white' : 'rgba(255,255,255,0.85)',
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
          {tournament.leader.country && (
            <CountryFlag country={tournament.leader.country} size="sm" />
          )}
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

interface AllToursTickerProps {
  /** Currently-active tournament id (drives "NOW SHOWING" highlight). Optional — falls back to no highlight. */
  activeId?: string | null;
  /** Called when user taps a ticker cell. Optional — falls back to no-op (legacy / standalone). */
  onSelect?: (tournamentId: string) => void;
}

export function AllToursTicker({ activeId, onSelect }: AllToursTickerProps = {}) {
  const { data: liveTournaments, isLoading } = useLiveRightNow();
  const handleSelect = onSelect ?? (() => {});

  if (isLoading) {
    return (
      <div style={{ background: TICKER_GRADIENT, padding: '14px 0 16px' }}>
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
        background: TICKER_GRADIENT,
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
            fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {liveTournaments.length} Live Now · Tap to Switch
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
          <TickerCell
            key={t.id}
            tournament={t}
            isLast={i === liveTournaments.length - 1}
            isActive={activeId === t.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Bottom amber shimmer line */}
      <div className="th-shimmer-line" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} aria-hidden />
    </section>
  );
}

export default AllToursTicker;
