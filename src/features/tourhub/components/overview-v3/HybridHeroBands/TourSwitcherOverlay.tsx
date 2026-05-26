/**
 * TourSwitcherOverlay — Pass 5. Type-only tour pills overlaid on the PhotoBand
 * top scrim. Replaces the AllToursTicker rail below the hero.
 *
 * Reads the same data as AllToursTicker via useAllToursTickerData. Renders one
 * pill per tour that has a live/completed/upcoming tournament (priority order).
 * Active pill = glass-blur background, white text. Live tours show a pulsing dot.
 */

import React, { useMemo } from 'react';
import { useAllToursTickerData, type TickerCellData } from '../../../hooks/useOverviewModules';

const TOUR_ORDER = ['pga', 'euro', 'liv', 'lpga', 'pgad', 'champ'] as const;
type TourSlug = (typeof TOUR_ORDER)[number];

const TOUR_LABEL: Record<TourSlug, string> = {
  pga: 'PGA',
  euro: 'DPWT',
  liv: 'LIV',
  lpga: 'LPGA',
  pgad: 'Korn Ferry',
  champ: 'Champions',
};

interface TourPillData {
  slug: TourSlug;
  label: string;
  resolvedId: string | null;
  isLive: boolean;
  isActive: boolean;
}

function deriveTourPills(
  data: { live: TickerCellData[]; completed: TickerCellData[]; upcoming: TickerCellData[] } | undefined,
  activeTournamentId: string | null,
): TourPillData[] {
  if (!data) return [];

  return TOUR_ORDER.map(slug => {
    const liveCell = data.live.find(c => c.tourSlug === slug);
    const completedCell = data.completed.find(c => c.tourSlug === slug);
    const upcomingCell = data.upcoming.find(c => c.tourSlug === slug);
    const resolvedCell = liveCell || completedCell || upcomingCell || null;

    return {
      slug,
      label: TOUR_LABEL[slug],
      resolvedId: resolvedCell?.id ?? null,
      isLive: !!liveCell,
      isActive: resolvedCell?.id === activeTournamentId,
    };
  }).filter(p => p.resolvedId !== null);
}

interface TourSwitcherOverlayProps {
  activeTournamentId: string | null;
  onSelectTour: (tournamentId: string) => void;
}

export function TourSwitcherOverlay({ activeTournamentId, onSelectTour }: TourSwitcherOverlayProps) {
  const { data } = useAllToursTickerData();
  const pills = useMemo(
    () => deriveTourPills(data, activeTournamentId),
    [data, activeTournamentId],
  );

  if (pills.length === 0) return null;

  return (
    <div
      className="tour-switcher-rail"
      aria-label="Switch tour"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none' as any,
        padding: '12px 14px',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {pills.map(pill => (
        <button
          key={pill.slug}
          onClick={() => pill.resolvedId && onSelectTour(pill.resolvedId)}
          aria-pressed={pill.isActive}
          aria-label={
            pill.isActive
              ? `Currently viewing ${pill.label}`
              : `Switch to ${pill.label}${pill.isLive ? ', live now' : ''}`
          }
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 11px',
            borderRadius: 16,
            border: 'none',
            background: pill.isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
            backdropFilter: pill.isActive ? 'blur(8px)' : undefined,
            WebkitBackdropFilter: pill.isActive ? 'blur(8px)' : undefined,
            boxShadow: pill.isActive ? 'inset 0 0 0 0.5px rgba(255,255,255,0.30)' : 'none',
            cursor: 'pointer',
            transition: 'background 180ms ease, box-shadow 180ms ease',
            fontFamily: "'Geist', sans-serif",
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"zero" 0',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: pill.isActive ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
              transition: 'color 180ms ease',
              textShadow: pill.isActive ? 'none' : '0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            {pill.label}
          </span>
          {pill.isLive && (
            <span
              className="hybrid-live-pulse"
              aria-hidden="true"
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: pill.isActive
                  ? '0 0 0 2.5px rgba(16,185,129,0.30)'
                  : '0 0 0 2px rgba(16,185,129,0.18)',
                opacity: pill.isActive ? 1 : 0.85,
                flexShrink: 0,
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
