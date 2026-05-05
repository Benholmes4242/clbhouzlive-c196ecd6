/**
 * AllToursTicker — Persistent rail beneath the Hero on Tour Hub Overview.
 *
 * Renders in four states (always visible — never returns null):
 *
 *   1. ALL LIVE        eyebrow "LIVE · ALL TOURS",           green pulsing dot
 *   2. MIXED           eyebrow "LIVE & RESULTS · ALL TOURS", green pulsing dot
 *   3. ALL RESULTS     eyebrow "RESULTS · ALL TOURS",        static slate dot
 *   4. DEEP OFF-SEASON eyebrow "UP NEXT · ALL TOURS",        muted amber dot
 *
 * Cells:
 *   - live      → tour pill + name + flag + leader + green score + pulse dot
 *   - completed → tour pill + name + flag + winner + slate score + "FINAL" tag
 *   - upcoming  → tour pill + name + flag + start date + "{N}d" until start
 *
 * Tap on any cell calls onSelect(tournamentId) → parent swaps Hero slide.
 * HeroCarousel already supports live / completed / upcoming slide types so
 * all three cell variants drive the Hero correctly.
 */

import React from 'react';
import {
  useAllToursTickerData,
  type TickerCellData,
  type TickerCellStatus,
} from '../hooks/useOverviewModules';
import CountryFlag from '@/components/ui/country-flag';

const TICKER_GRADIENT = 'linear-gradient(135deg, #0a1628 0%, #1e293b 100%)';
const GREEN = '#10B981';
const SLATE_300 = '#CBD5E1';
const SLATE_500 = '#64748B';
const SLATE_700 = '#334155';
const AMBER = '#F7931E';
const GOLD = '#FFB800';

type RailState = 'all-live' | 'mixed' | 'all-results' | 'deep-empty';

interface MastheadConfig {
  eyebrow: string;
  hint: string;
  dot: 'live' | 'static-slate' | 'muted-amber';
}

function resolveMasthead(
  state: RailState,
  liveCount: number,
  resultsCount: number,
  upcomingCount: number,
): MastheadConfig {
  switch (state) {
    case 'all-live':
      return {
        eyebrow: 'Live · All Tours',
        hint: `${liveCount} Live Now · Tap to Switch`,
        dot: 'live',
      };
    case 'mixed':
      return {
        eyebrow: 'Live & Results · All Tours',
        hint: `${liveCount} Live · ${resultsCount} Final · Tap to Switch`,
        dot: 'live',
      };
    case 'all-results':
      return {
        eyebrow: 'Results · All Tours',
        hint: `${resultsCount} Final · Tap to Switch`,
        dot: 'static-slate',
      };
    case 'deep-empty':
      return {
        eyebrow: 'Up Next · All Tours',
        hint: `${upcomingCount} Events Upcoming · Tap to Preview`,
        dot: 'muted-amber',
      };
  }
}

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

function formatStartDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z');
  const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(d).toUpperCase();
  const day = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' }).format(d);
  return `${month} ${day}`;
}

// ── Dot ─────────────────────────────────────────────────────────────────────
const MastheadDot: React.FC<{ kind: MastheadConfig['dot'] }> = ({ kind }) => {
  if (kind === 'live') {
    return <span className="th-live-dot" aria-hidden />;
  }
  if (kind === 'muted-amber') {
    return (
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: AMBER,
          opacity: 0.6,
          display: 'inline-block',
        }}
      />
    );
  }
  // static-slate
  return (
    <span
      aria-hidden
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: SLATE_500,
        display: 'inline-block',
      }}
    />
  );
};

// ── Cell ────────────────────────────────────────────────────────────────────
interface TickerCellProps {
  cell: TickerCellData;
  isLast: boolean;
  isActive: boolean;
  onSelect: (id: string) => void;
}

const TickerCell: React.FC<TickerCellProps> = ({ cell, isLast, isActive, onSelect }) => {
  const isLive = cell.status === 'live';
  const isCompleted = cell.status === 'completed';
  const isUpcoming = cell.status === 'upcoming';

  const activeBorderColor = isLive ? GREEN
    : isCompleted ? GOLD
    : isUpcoming ? AMBER
    : '#FFFFFF';
  const activeBackground = isLive ? 'rgba(16,185,129,0.08)'
    : isCompleted ? 'rgba(255,184,0,0.08)'
    : isUpcoming ? 'rgba(247,147,30,0.08)'
    : 'rgba(255,255,255,0.08)';

  return (
    <button
      type="button"
      onClick={() => onSelect(cell.id)}
      className="active:opacity-80"
      style={{
        flexShrink: 0,
        minWidth: 220,
        padding: '7px 18px',
        borderRight: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)',
        textAlign: 'left',
        background: isActive ? activeBackground : 'transparent',
        border: isActive ? `1.5px solid ${activeBorderColor}` : '1.5px solid transparent',
        borderRadius: 12,
        color: 'inherit',
        cursor: 'pointer',
        transition: 'background 0.25s ease, border-color 0.25s ease',
        position: 'relative',
      }}
      aria-pressed={isActive}
    >
      {/* Tour pill + tournament name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
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
          {tourPillLabel(cell.tourSlug)}
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
          {cell.name}
        </span>
      </div>

      {/* Detail row */}
      {(isLive || isCompleted) && cell.personName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {cell.country && <CountryFlag country={cell.country} size="sm" />}
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
            {abbreviateName(cell.personName)}
          </span>
          {cell.scoreDisplay && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: isLive ? GREEN : SLATE_300,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"kern" 1, "liga" 1',
              }}
            >
              {cell.scoreDisplay}
            </span>
          )}
          {isLive ? (
            <span className="th-live-dot" style={{ width: 6, height: 6, marginLeft: 2 }} aria-hidden />
          ) : (
            <span
              style={{
                fontSize: 8,
                fontWeight: 900,
                color: SLATE_500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginLeft: 2,
                padding: '2px 5px',
                borderRadius: 3,
                background: 'rgba(255,255,255,0.06)',
              }}
            >
              Final
            </span>
          )}
        </div>
      )}

      {(isLive || isCompleted) && !cell.personName && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          {isLive ? 'Starting soon' : 'Final'}
        </div>
      )}

      {isUpcoming && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {cell.country && <CountryFlag country={cell.country} size="sm" />}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.78)',
              letterSpacing: '-0.005em',
              whiteSpace: 'nowrap',
            }}
          >
            {formatStartDate(cell.startDate)}
          </span>
          {cell.daysUntilStart != null && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: AMBER,
                letterSpacing: '-0.005em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {cell.daysUntilStart === 0 ? 'today' : `${cell.daysUntilStart}d`}
            </span>
          )}
        </div>
      )}
    </button>
  );
};

// ── Masthead (always renders) ───────────────────────────────────────────────
const Masthead: React.FC<{ config: MastheadConfig }> = ({ config }) => {
  const eyebrowColor =
    config.dot === 'live'
      ? GREEN
      : config.dot === 'muted-amber'
      ? AMBER
      : SLATE_300;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        marginBottom: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MastheadDot kind={config.dot} />
        <span
          style={{
            fontSize: 9,
            fontWeight: 900,
            color: eyebrowColor,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          {config.eyebrow}
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
        {config.hint}
      </span>
    </div>
  );
};

interface AllToursTickerProps {
  /** Currently-active tournament id (drives "NOW SHOWING" highlight). Optional — falls back to no highlight. */
  activeId?: string | null;
  /** Called when user taps a ticker cell. Optional — falls back to no-op (legacy / standalone). */
  onSelect?: (tournamentId: string) => void;
}

export function AllToursTicker({ activeId, onSelect }: AllToursTickerProps = {}) {
  const { data, isLoading } = useAllToursTickerData();
  const handleSelect = onSelect ?? (() => {});

  const live = data?.live ?? [];
  const completed = data?.completed ?? [];
  const upcoming = data?.upcoming ?? [];

  // Resolve cells + state
  let cells: TickerCellData[];
  let state: RailState;
  if (live.length > 0 && completed.length > 0) {
    state = 'mixed';
    cells = [...live, ...completed]; // live first, then results
  } else if (live.length > 0) {
    state = 'all-live';
    cells = live;
  } else if (completed.length > 0) {
    state = 'all-results';
    cells = completed;
  } else {
    state = 'deep-empty';
    cells = upcoming;
  }

  const config = resolveMasthead(state, live.length, completed.length, upcoming.length);

  return (
    <section
      aria-label="Tournaments across all tours"
      style={{
        background: TICKER_GRADIENT,
        position: 'relative',
        paddingTop: 10,
        paddingBottom: 10,
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <Masthead config={config} />

      {/* Cell strip — skeletons during initial load, otherwise the resolved cells */}
      {isLoading && cells.length === 0 ? (
        <div style={{ display: 'flex', gap: 12, padding: '0 20px', overflowX: 'hidden' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                width: 220,
                height: 56,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
              }}
            />
          ))}
        </div>
      ) : cells.length === 0 ? (
        // Truly empty (no live, no recent, no upcoming) — show a quiet placeholder
        <div
          style={{
            padding: '14px 20px',
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.04em',
          }}
        >
          No tournaments scheduled in this window.
        </div>
      ) : (
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
          {cells.map((c, i) => (
            <TickerCell
              key={c.id}
              cell={c}
              isLast={i === cells.length - 1}
              isActive={activeId === c.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Bottom amber shimmer line — only show when live action is present */}
      {(state === 'all-live' || state === 'mixed') && (
        <div className="th-shimmer-line" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} aria-hidden />
      )}
    </section>
  );
}

// Re-export for backward compatibility (any old import path expecting LiveTournamentWithLeader)
export type { TickerCellData, TickerCellStatus } from '../hooks/useOverviewModules';

export default AllToursTicker;

// Suppress unused-type warnings — referenced via re-export above
export type _UnusedStatus = TickerCellStatus;
