/**
 * AllToursTicker — Persistent rail beneath the Hero on Tour Hub Overview.
 *
 * Pass 4.5: minimalist portrait cards (168×64) with full-bleed course photos,
 * tour pill, player headshot, name, score. No masthead, no tournament name,
 * no VIEWING badge. Flush with the hero (no border seams).
 *
 * Architectural note (locked): this component stays separate from HybridHero.
 * It owns its own state machine and is reused by the Schedule tab.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  useAllToursTickerData,
  type TickerCellData,
  type TickerCellStatus,
} from '../hooks/useOverviewModules';
import { TOUR_MAP } from '../constants/tourMap';
import { NUMERIC_STYLE } from './overview-v3/HybridHero.constants';
import { useBatchCourseImages } from '../hooks/useBatchCourseImages';
import { PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';

const SLATE_500 = '#64748B';
const PAGE_BG = '#F8FAFC';

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

/** Fallback gradient when no course image is available. */
function getCardGradient(tourSlug: string | null | undefined, isUpcoming: boolean): string {
  if (isUpcoming) return 'linear-gradient(160deg, #1e293b 0%, #475569 100%)';
  const s = (tourSlug ?? '').toLowerCase();
  switch (s) {
    case 'pga':  return 'linear-gradient(160deg, #0a2540 0%, #1e3a5f 60%, #3a5b8a 100%)';
    case 'euro': return 'linear-gradient(160deg, #1a3a2a 0%, #2d5a3d 50%, #4a7a5d 100%)';
    case 'liv':  return 'linear-gradient(160deg, #1a1a1a 0%, #2d2d2d 50%, #4a4a4a 100%)';
    case 'lpga': return 'linear-gradient(160deg, #5b1a3a 0%, #8a2d5b 50%, #b03a73 100%)';
    case 'pgad': return 'linear-gradient(160deg, #1a3a3a 0%, #2d5a5a 50%, #4a7a7a 100%)';
    case 'champ':return 'linear-gradient(160deg, #3a2a1a 0%, #5a3d2d 50%, #7a5d4a 100%)';
    default:     return 'linear-gradient(160deg, #1e293b 0%, #475569 100%)';
  }
}

const CARD_WIDTH = 168;
const CARD_HEIGHT = 64;

function PlayerHead({ photoUrl, size = 26 }: { photoUrl: string | null; size?: number }) {
  return (
    <img
      src={photoUrl || PLAYER_SILHOUETTE_URL}
      alt=""
      onError={(e) => {
        const t = e.target as HTMLImageElement;
        if (t.src !== PLAYER_SILHOUETTE_URL) t.src = PLAYER_SILHOUETTE_URL;
      }}
      style={{
        width: size,
        height: size,
        borderRadius: '34%',
        objectFit: 'cover',
        objectPosition: 'center 18%',
        background: 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)',
        boxShadow: '0 0 0 1.5px rgba(255,255,255,0.30)',
        flexShrink: 0,
      }}
    />
  );
}

interface TickerCellProps {
  cell: TickerCellData;
  isActive: boolean;
  courseImageUrl: string | null;
  onClick: () => void;
}

const TickerCell: React.FC<TickerCellProps> = ({ cell, isActive, courseImageUrl, onClick }) => {
  const isLive = cell.status === 'live';
  const isCompleted = cell.status === 'completed';
  const isUpcoming = cell.status === 'upcoming';

  const tourPill = tourPillBrand(cell.tourSlug);
  const tourLabel = tourPillLabel(cell.tourSlug);
  const fallbackGradient = getCardGradient(cell.tourSlug, isUpcoming);
  const hasPhoto = !!courseImageUrl;

  return (
    <button
      type="button"
      onClick={onClick}
      data-cell-id={cell.id}
      aria-label={isActive ? `Currently viewing ${cell.name}` : `Switch to ${cell.name}`}
      aria-current={isActive ? 'true' : undefined}
      style={{
        flexShrink: 0,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
        background: hasPhoto ? `url(${courseImageUrl}) center 30% / cover` : fallbackGradient,
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        boxShadow: isActive
          ? '0 0 0 1.5px #F7931E, 0 2px 10px rgba(247,147,30,0.22)'
          : '0 1px 3px rgba(15, 23, 42, 0.10)',
        opacity: isUpcoming ? 0.6 : 1,
        transition: 'box-shadow 180ms ease, opacity 180ms ease',
      }}
    >
      {/* legibility scrim */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: hasPhoto
            ? 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.30) 40%, rgba(0,0,0,0.78) 100%)'
            : 'linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* tour pill — top left */}
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 6,
          background: tourPill.bg,
          color: tourPill.fg,
          fontFamily: "'Geist', sans-serif",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.06em',
          padding: '2px 5px',
          borderRadius: 3,
          textTransform: 'uppercase',
          lineHeight: 1.2,
          zIndex: 2,
        }}
      >
        {tourLabel}
      </div>

      {/* state marker — top right */}
      {isLive && (
        <span
          className="th-live-dot"
          style={{ position: 'absolute', top: 10, right: 8, width: 6, height: 6, zIndex: 2 }}
          aria-hidden
        />
      )}
      {isCompleted && !isActive && (
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontFamily: "'Geist', sans-serif",
            fontSize: 8,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.78)',
            letterSpacing: '0.14em',
            padding: '2px 5px',
            borderRadius: 3,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 2,
          }}
        >
          FINAL
        </span>
      )}
      {isUpcoming && cell.daysUntilStart != null && (
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontFamily: "'Geist', sans-serif",
            ...NUMERIC_STYLE,
            fontSize: 9,
            fontWeight: 800,
            color: '#FBBC2E',
            letterSpacing: '0.06em',
            padding: '2px 5px',
            borderRadius: 3,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 2,
          }}
        >
          {cell.daysUntilStart === 0 ? 'TODAY' : `${cell.daysUntilStart}D`}
        </span>
      )}

      {/* bottom row: headshot + name + score */}
      <div
        style={{
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 2,
        }}
      >
        {(isLive || isCompleted) && cell.personName && (
          <>
            <PlayerHead photoUrl={cell.personPhotoUrl} size={26} />
            <span
              style={{
                fontFamily: "'Geist', sans-serif",
                color: 'white',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '-0.005em',
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
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                }}
              >
                {cell.scoreDisplay}
              </span>
            )}
          </>
        )}

        {isUpcoming && (
          <span
            style={{
              fontFamily: "'Geist', sans-serif",
              ...NUMERIC_STYLE,
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {formatStartDate(cell.startDate)}
          </span>
        )}
      </div>
    </button>
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
  if (live.length > 0 && completed.length > 0) cells = [...live, ...completed];
  else if (live.length > 0) cells = live;
  else if (completed.length > 0) cells = completed;
  else cells = upcoming;

  // Batch-resolve course images (shares React Query cache with the hero).
  const tournamentsForImageLookup = useMemo(
    () =>
      cells
        .filter(c => c.venueName)
        .map(c => ({ venue_name: c.venueName } as any)),
    [cells]
  );
  const { data: imageMap } = useBatchCourseImages(tournamentsForImageLookup);

  // Scroll active card into view when activeId changes externally.
  useEffect(() => {
    if (!activeId || !railRef.current) return;
    const card = railRef.current.querySelector(`[data-cell-id="${activeId}"]`);
    if (card && typeof (card as HTMLElement).scrollIntoView === 'function') {
      (card as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }, [activeId]);

  return (
    <section
      aria-label="Switch tournament"
      style={{
        background: PAGE_BG,
        position: 'relative',
        paddingTop: 12,
        paddingBottom: 14,
      }}
    >
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
          {cells.map((cell) => {
            const imageUrl = cell.venueName ? (imageMap?.get(cell.venueName) ?? null) : null;
            return (
              <div key={cell.id} style={{ scrollSnapAlign: 'start' }}>
                <TickerCell
                  cell={cell}
                  isActive={cell.id === activeId}
                  courseImageUrl={imageUrl}
                  onClick={() => handleSelect(cell.id)}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export type { TickerCellData, TickerCellStatus } from '../hooks/useOverviewModules';

export default AllToursTicker;
