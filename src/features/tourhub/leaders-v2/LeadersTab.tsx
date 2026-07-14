/**
 * leaders-v2/LeadersTab — "The Boards" — category cards + deep sheets.
 * Overview grammar; no framer-motion; no shell-row dependency.
 *
 * Wiring:
 *   - Tour: TourSelectionContext (selectTour); ?tour= honored once on mount.
 *   - ?category= auto-opens the FullListSheet for that key (Overview deep-links).
 *   - Data: useLeaderCategories(tour) + useLivePlayerIds().
 *   - Sheet nav: closes first, then navigates — no stuck overlay.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { SectionTourLens } from '../overview/sections/SectionTourLens';
import { TOUR_CONFIG, type TourId } from '../hooks/useOverviewData';

import { useLivePlayerIds } from '../players-v2/data/useLivePlayerIds';
import {
  AMBER,
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
  SLATE_50,
} from '../_shared/tokens';

import { useLeaderCategories } from './data/useLeaderCategories';
import { StatBoard } from './StatBoard';
import { FullListSheet } from './FullListSheet';

const CHIP_LABEL: Record<TourId, string> = {
  pga: 'PGA',
  lpga: 'LPGA',
  euro: 'DP WORLD',
  pgad: 'KORN FERRY',
  champ: 'CHAMPIONS',
  liv: 'LIV',
};


export function LeadersTab() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Per-section tour lens (local state, NO All Tours, PGA default).
  // Champions is intentionally omitted here (insufficient stat coverage);
  // if the URL passes ?tour=champ we fall through to PGA.
  const inboundTour = searchParams.get('tour');
  const initialTour: TourId =
    inboundTour && inboundTour in TOUR_CONFIG && inboundTour !== 'champ'
      ? (inboundTour as TourId)
      : 'pga';
  const [activeTour, setActiveTour] = useState<TourId>(initialTour);


  const { data: result, isLoading } = useLeaderCategories(activeTour);
  const { data: liveMap } = useLivePlayerIds();

  const categories = result?.categories ?? [];
  const year = result?.year ?? new Date().getFullYear();

  // Deep-link ?category=
  const [openKey, setOpenKey] = useState<string | null>(null);
  const inboundCatRef = useRef(false);
  useEffect(() => {
    if (inboundCatRef.current) return;
    if (!categories.length) return;
    inboundCatRef.current = true;
    const inbound = searchParams.get('category');
    if (inbound && categories.some((c) => c.key === inbound)) {
      setOpenKey(inbound);
    }
  }, [categories, searchParams]);

  // If tour changes and the currently open sheet is not in the new tour, close it.
  useEffect(() => {
    if (!openKey) return;
    if (!categories.length) return;
    if (!categories.some((c) => c.key === openKey)) setOpenKey(null);
  }, [openKey, categories]);

  const openCategory = useCallback(
    (key: string) => {
      setOpenKey(key);
      const p = new URLSearchParams(searchParams);
      p.set('tab', 'leaderboards');
      p.set('category', key);
      setSearchParams(p, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const closeCategory = useCallback(() => {
    setOpenKey(null);
    const p = new URLSearchParams(searchParams);
    if (p.get('category')) {
      p.delete('category');
      setSearchParams(p, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.key === openKey) ?? null,
    [categories, openKey],
  );

  const tourLabel = CHIP_LABEL[activeTour];

  return (
    <div style={{ background: SLATE_50, minHeight: '100vh', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: AMBER,
              textTransform: 'uppercase',
            }}
          >
            STAT WATCH
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: INK_MUTE,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {tourLabel} {'\u00B7'} {year}
          </span>
        </div>

      </div>

      {/* Tour chips — canonical sticky glass row (locks under island band). */}
      <div
        style={{
          position: 'sticky',
          top: 'calc(var(--sat, 0px) + 69px)',
          zIndex: 10,
          background: 'rgba(248,250,252,0.72)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          padding: '8px 16px 10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {TOUR_PRIORITY.filter((s) => s !== 'champ').map((slug) => {
            const isActive = slug === activeTour;
            return (
              <button
                key={slug}
                type="button"
                aria-pressed={isActive}
                onClick={() => selectTour(slug)}
                style={{
                  flex: '0 0 auto',
                  padding: '7px 12px',
                  borderRadius: 14,
                  border: isActive ? 'none' : `0.5px solid ${HAIRLINE_INK_10}`,
                  background: isActive ? INK : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : INK,
                  fontFamily: 'inherit',
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                }}
              >
                {CHIP_LABEL[slug]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Boards feed */}
      {isLoading ? (
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className="mb-3"
              style={{ height: 168, borderRadius: 16, margin: '0 16px 12px' }}
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <TourHubEmptyState variant="leaderboard" />
      ) : (
        <div style={{ paddingBottom: 88 }}>
          {categories.map((cat) => (
            <StatBoard
              key={cat.key}
              category={cat}
              liveMap={liveMap ?? {}}
              onOpen={() => openCategory(cat.key)}
            />
          ))}
          <div
            style={{
              padding: '4px 16px 0',
              fontSize: 10.5,
              fontWeight: 500,
              color: INK_MUTE,
              letterSpacing: '0.04em',
              textAlign: 'center',
            }}
          >
            Season boards {'\u00B7'} live dot = on the course right now
          </div>
        </div>
      )}

      <FullListSheet
        open={!!activeCategory}
        onClose={closeCategory}
        category={activeCategory}
        liveMap={liveMap ?? {}}
        tourLabel={tourLabel}
        year={year}
      />
    </div>
  );
}

export default LeadersTab;
