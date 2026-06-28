/**
 * TourSwitcherAffordance — discreet tour-switch pill in the Tour Hub chrome
 * plus its "Select tour" bottom sheet.
 *
 * Wiring is the SAFE one-way path: tapping a tour calls selectTour(slug) on
 * TourSelectionContext, which OverviewHero reads to jump its own index.
 * Nothing flows back up from the hero.
 */

import React, { useState } from 'react';
import { ArrowLeftRight, Check, Trophy } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { getTourLogo } from '../utils/tourLogos';
import { useAllToursTickerData } from '../hooks/useOverviewModules';
import { useTourSelection } from '../context/TourSelectionContext';
import {
  AMBER,
  AMBER_TINT_04,
  FONT,
  GOLD,
  GOLD_DEEP,
  INK,
  INK_ALPHA_45,
  INK_TINT_07,
  STATUS_LIVE,
  SURFACE,
} from '../_shared/tokens';

// Canonical tour priority order — PGA → LPGA → DP World → Korn Ferry → Champions → LIV.
// Object insertion order is preserved by Object.entries below.
const TOUR_LABEL: Record<string, string> = {
  pga: 'PGA TOUR',
  lpga: 'LPGA',
  euro: 'DP WORLD TOUR',
  pgad: 'KORN FERRY',
  champ: 'CHAMPIONS',
  liv: 'LIV GOLF',
};

export interface TourSwitcherAffordanceProps {
  variant?: 'glass' | 'default';
}

export const TourSwitcherAffordance: React.FC<TourSwitcherAffordanceProps> = ({
  variant = 'default',
}) => {
  const { data } = useAllToursTickerData();
  const [open, setOpen] = useState(false);
  const { selectedTourSlug, selectTour, viewingTourSlug } = useTourSelection();

  // Pill + active-row reflect the tour CURRENTLY IN VIEW on the hero (updates on
  // random landing, swipe, dots, and taps). Fall back to the user's explicit
  // pick, then PGA before the hero has reported anything.
  const activeTourSlug = viewingTourSlug ?? selectedTourSlug ?? 'pga';

  const tourStatus = (slug: string): 'live' | 'results' | 'upcoming' | 'none' => {
    // Precedence mirrors deriveHeroState: live > results (≤72h) > upcoming > none.
    // The `completed` bucket is already 72h-bounded (RESULTS_WINDOW_HOURS) at the
    // cache layer, so presence here == the hero's results state.
    if (data?.live.some((c) => c.tourSlug === slug)) return 'live';
    if (data?.completed.some((c) => c.tourSlug === slug)) return 'results';
    if (data?.upcomingTourSlugs?.includes(slug)) return 'upcoming';
    return 'none';
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Switch tour"
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 2,
          padding: '0 14px 0 10px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: FONT,
          height: 36,
        }}
      >
        <span
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: AMBER,
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          Tour
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: '#0A0E14',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          {TOUR_LABEL[activeTourSlug] ?? 'PGA'}
          <ArrowLeftRight size={11} strokeWidth={2.2} color="#0A0E14" aria-hidden />
        </span>
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabelledBy="tour-switcher-sheet-title"
      >
        <SheetHeader
          eyebrow="SWITCH TOUR"
          title={<span id="tour-switcher-sheet-title">Select tour</span>}
          onClose={() => setOpen(false)}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {Object.entries(TOUR_LABEL).map(([slug, label]) => {
            const isActive = slug === activeTourSlug;
            const status = tourStatus(slug);
            const selectable = status !== 'none';

            return (
              <button
                key={slug}
                type="button"
                onClick={() => {
                  if (!selectable) return;
                  selectTour(slug);
                  setOpen(false);
                }}
                disabled={!selectable}
                aria-pressed={isActive}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: isActive ? AMBER_TINT_04 : 'transparent',
                  border: 'none',
                  borderBottom: `0.5px solid ${INK_TINT_07}`,
                  cursor: selectable ? 'pointer' : 'default',
                  opacity: selectable ? 1 : 0.4,
                  textAlign: 'left',
                  fontFamily: FONT,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={getTourLogo(slug)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: INK,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {label}
                  </div>
                </div>

                {status === 'live' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_LIVE, display: 'inline-block' }} />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: STATUS_LIVE }}>LIVE</span>
                  </span>
                ) : status === 'results' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Trophy size={12} strokeWidth={2.5} style={{ color: GOLD_DEEP }} aria-hidden />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: GOLD_DEEP }}>RESULTS</span>
                  </span>

                ) : status === 'upcoming' ? (
                  <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: INK_ALPHA_45 }}>
                    UPCOMING
                  </span>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: 'rgba(15,23,42,0.30)' }}>
                    NO EVENT
                  </span>
                )}

                {isActive && (
                  <Check size={16} strokeWidth={2.5} color={AMBER} />
                )}
              </button>
            );
          })}
        </div>

        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </BottomSheet>
    </>
  );
};

export default TourSwitcherAffordance;
