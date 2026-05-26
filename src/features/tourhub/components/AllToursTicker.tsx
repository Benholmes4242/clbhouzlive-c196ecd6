/**
 * AllToursTicker — Persistent rail beneath the Hero on Tour Hub Overview.
 *
 * Pass 4 redesign: cinematic editorial micro-cards (168×74) with
 * tour-branded gradient backgrounds. Flush with the hero (no border seams).
 *
 * Renders in four states (always visible — never returns null):
 *   1. ALL LIVE        eyebrow "LIVE · ALL TOURS"
 *   2. MIXED           eyebrow "LIVE & RESULTS · ALL TOURS"
 *   3. ALL RESULTS     eyebrow "RESULTS · ALL TOURS"
 *   4. DEEP OFF-SEASON eyebrow "UP NEXT · ALL TOURS"
 *
 * Architectural note (locked): this component stays separate from HybridHero.
 * It owns its own state machine and is reused by the Schedule tab. The merge
 * with the hero is visual only — do not fold this into HybridHero.
 */

import React, { useEffect, useRef } from 'react';
import {
  useAllToursTickerData,
  type TickerCellData,
  type TickerCellStatus,
} from '../hooks/useOverviewModules';
import { TOUR_MAP } from '../constants/tourMap';
import { NUMERIC_STYLE } from './overview-v3/HybridHero.constants';

const GREEN = '#10B981';
const SLATE_500 = '#64748B';
const PAGE_BG = '#F8FAFC';
const AMBER = '#F7931E';

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
      return { eyebrow: 'Live · All Tours', hint: `${liveCount} Live Now · Tap to Switch`, dot: 'live' };
    case 'mixed':
      return { eyebrow: 'Live & Results · All Tours', hint: `${liveCount} Live · ${resultsCount} Final · Tap to Switch`, dot: 'live' };
    case 'all-results':
      return { eyebrow: 'Results · All Tours', hint: `${resultsCount} Final · Tap to Switch`, dot: 'static-slate' };
    case 'deep-empty':
      return { eyebrow: 'Up Next · All Tours', hint: `${upcomingCount} Events Upcoming · Tap to Preview`, dot: 'muted-amber' };
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

function tourPillBrand(slug?: string | null): { bg: string; fg: string } {
  const s = (slug ?? '').toLowerCase();
  const key = s === 'pga' ? 'pga' : s.toUpperCase();
  const meta = (TOUR_MAP as any)[key];
  return meta ? { bg: meta.bg, fg: meta.fg } : { bg: '#475569', fg: '#FFFFFF' };
}

function formatStartDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z');
  const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(d).toUpperCase();
  const day = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' }).format(d);
  return `${month} ${day}`;
}

/**
 * Card background gradient — derives from the tour's brand colours.
 * Upcoming uses a muted slate. Course photography is future work (Pass 5).
 */
function getCardGradient(
  tourSlug: string | null | undefined,
  isUpcoming: boolean,
): string {
  if (isUpcoming) {
    return 'linear-gradient(160deg, #1e293b 0%, #475569 100%)';
  }
  const s = (tourSlug ?? '').toLowerCase();
  switch (s) {
    case 'pga':
      return 'linear-gradient(160deg, #0a2540 0%, #1e3a5f 60%, #3a5b8a 100%)';
    case 'euro':
      return 'linear-gradient(160deg, #1a3a2a 0%, #2d5a3d 50%, #4a7a5d 100%)';
    case 'liv':
      return 'linear-gradient(160deg, #1a1a1a 0%, #2d2d2d 50%, #4a4a4a 100%)';
    case 'lpga':
      return 'linear-gradient(160deg, #5b1a3a 0%, #8a2d5b 50%, #b03a73 100%)';
    case 'pgad':
      return 'linear-gradient(160deg, #1a3a3a 0%, #2d5a5a 50%, #4a7a7a 100%)';
    case 'champ':
      return 'linear-gradient(160deg, #3a2a1a 0%, #5a3d2d 50%, #7a5d4a 100%)';
    default:
      return 'linear-gradient(160deg, #1e293b 0%, #475569 100%)';
  }
}

const MastheadDot: React.FC<{ kind: MastheadConfig['dot'] }> = ({ kind }) => {
  if (kind === 'live') {
    return <span className="th-live-dot" aria-hidden />;
  }
  if (kind === 'muted-amber') {
    return (
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, opacity: 0.6, display: 'inline-block' }} />
    );
  }
  return (
    <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: SLATE_500, display: 'inline-block' }} />
  );
};

const CARD_WIDTH = 168;
const CARD_HEIGHT = 74;

interface TickerCellProps {
  cell: TickerCellData;
  isActive: boolean;
  onSelect: (id: string) => void;
}

const TickerCell: React.FC<TickerCellProps> = ({ cell, isActive, onSelect }) => {
  const isLive = cell.status === 'live';
  const isCompleted = cell.status === 'completed';
  const isUpcoming = cell.status === 'upcoming';

  const tourPill = tourPillBrand(cell.tourSlug);
  const tourLabel = tourPillLabel(cell.tourSlug);
  const bgGradient = getCardGradient(cell.tourSlug, isUpcoming);

  return (
    <button
      type="button"
      onClick={() => onSelect(cell.id)}
      aria-label={`Switch to ${cell.name}`}
      aria-current={isActive ? 'true' : undefined}
      style={{
        flexShrink: 0,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
        background: bgGradient,
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        boxShadow: isActive
          ? '0 0 0 1.5px #F7931E, 0 2px 8px rgba(247,147,30,0.20)'
          : '0 1px 3px rgba(15, 23, 42, 0.10)',
        opacity: isUpcoming ? 0.55 : 1,
        transition: 'box-shadow 180ms ease, opacity 180ms ease',
      }}
    >
      {/* legibility scrim */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.62) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* tour pill — top left */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          background: tourPill.bg,
          color: tourPill.fg,
          fontFamily: "'Geist', sans-serif",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.06em',
          padding: '2px 6px',
          borderRadius: 3,
          textTransform: 'uppercase',
          lineHeight: 1.2,
        }}
      >
        {tourLabel}
      </div>

      {/* active badge — top right */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(247, 147, 30, 0.92)',
            color: 'white',
            fontFamily: "'Geist', sans-serif",
            fontSize: 8,
            fontWeight: 900,
            letterSpacing: '0.14em',
            padding: '2px 6px',
            borderRadius: 3,
            lineHeight: 1.2,
          }}
        >
          VIEWING
        </div>
      )}

      {/* live dot when live, not active */}
      {isLive && !isActive && (
        <span
          className="th-live-dot"
          style={{
            position: 'absolute',
            top: 12,
            right: 10,
            width: 6,
            height: 6,
          }}
          aria-hidden
        />
      )}

      {/* bottom content block */}
      <div
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          bottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: "'Geist', sans-serif",
            color: 'white',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
            marginBottom: 3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {cell.name}
        </div>

        {(isLive || isCompleted) && cell.personName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div
              aria-hidden
              style={{
                width: 14,
                height: 14,
                borderRadius: '34%',
                background: 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)',
                flexShrink: 0,
                boxShadow: '0 0 0 1px rgba(255,255,255,0.20)',
              }}
            />
            <span
              style={{
                fontFamily: "'Geist', sans-serif",
                color: 'rgba(255, 255, 255, 0.88)',
                fontSize: 10,
                fontWeight: 600,
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {abbreviateName(cell.personName)}
            </span>
            {cell.scoreDisplay && (
              <span
                style={{
                  ...NUMERIC_STYLE,
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                }}
              >
                {cell.scoreDisplay}
              </span>
            )}
          </div>
        )}

        {(isLive || isCompleted) && !cell.personName && (
          <div
            style={{
              fontFamily: "'Geist', sans-serif",
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {isLive ? 'Starting soon' : 'Final'}
          </div>
        )}

        {isUpcoming && (
          <div
            style={{
              ...NUMERIC_STYLE,
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {formatStartDate(cell.startDate)}
            {cell.daysUntilStart != null && (
              <span style={{ color: '#FBBC2E', marginLeft: 5, fontWeight: 700 }}>
                {cell.daysUntilStart === 0 ? 'today' : `${cell.daysUntilStart}d`}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
};

const Masthead: React.FC<{ config: MastheadConfig }> = ({ config }) => {
  return (
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
        <MastheadDot kind={config.dot} />
        <span
          style={{
            fontFamily: "'Geist', sans-serif",
            fontSize: 10,
            fontWeight: 800,
            color: AMBER,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          ↔ {config.eyebrow}
        </span>
      </div>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(15, 23, 42, 0.55)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        {config.hint}
      </span>
    </div>
  );
};

interface AllToursTickerProps {
  activeId?: string | null;
  onSelect?: (tournamentId: string) => void;
}

export function AllToursTicker({ activeId, onSelect }: AllToursTickerProps = {}) {
  const { data, isLoading } = useAllToursTickerData();
  const handleSelect = onSelect ?? (() => {});
  const railRef = useRef<HTMLDivElement>(null);

  const live = data?.live ?? [];
  const completed = data?.completed ?? [];
  const upcoming = data?.upcoming ?? [];

  let cells: TickerCellData[];
  let state: RailState;
  if (live.length > 0 && completed.length > 0) {
    state = 'mixed';
    cells = [...live, ...completed];
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

  // When activeId changes from outside, scroll the matching card into view.
  useEffect(() => {
    if (!activeId || !railRef.current) return;
    const card = railRef.current.querySelector(`[data-cell-id="${activeId}"]`);
    if (card && typeof (card as HTMLElement).scrollIntoView === 'function') {
      (card as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }, [activeId]);

  return (
    <section
      aria-label="Tournaments across all tours"
      style={{
        background: PAGE_BG,
        position: 'relative',
        paddingTop: 14,
        paddingBottom: 16,
      }}
    >
      <Masthead config={config} />

      {isLoading && cells.length === 0 ? (
        <div style={{ display: 'flex', gap: 8, padding: '0 16px', overflowX: 'hidden' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                borderRadius: 12,
                background: 'rgba(15,23,42,0.06)',
              }}
            />
          ))}
        </div>
      ) : cells.length === 0 ? (
        <div
          style={{
            padding: '14px 20px',
            fontSize: 11,
            color: SLATE_500,
            letterSpacing: '0.04em',
          }}
        >
          No tournaments scheduled in this window.
        </div>
      ) : (
        <div
          ref={railRef}
          className="th-cards-rail"
          style={{
            display: 'flex',
            gap: 8,
            padding: '0 16px',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none' as any,
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: 16,
            willChange: 'transform',
          }}
        >
          {cells.map((cell) => (
            <div
              key={cell.id}
              data-cell-id={cell.id}
              style={{ scrollSnapAlign: 'start' }}
            >
              <TickerCell
                cell={cell}
                isActive={cell.id === activeId}
                onSelect={handleSelect}
              />
            </div>
          ))}
        </div>
      )}

      {(state === 'all-live' || state === 'mixed') && (
        <div className="th-shimmer-line" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} aria-hidden />
      )}
    </section>
  );
}

export type { TickerCellData, TickerCellStatus } from '../hooks/useOverviewModules';

export default AllToursTicker;

export type _UnusedStatus = TickerCellStatus;
