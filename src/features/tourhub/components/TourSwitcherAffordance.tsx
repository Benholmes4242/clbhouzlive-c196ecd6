/**
 * TourSwitcherAffordance — discreet tour-switch pill in the Tour Hub chrome
 * plus its "Select tour" bottom sheet.
 *
 * Wiring is the SAFE one-way path: tapping a tour calls selectTour(slug) on
 * TourSelectionContext, which OverviewHero reads to jump its own index.
 * Nothing flows back up from the hero.
 */

import React, { useState } from 'react';
import { ArrowLeftRight, Check } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { getTourLogo } from '../utils/tourLogos';
import { useAllToursTickerData } from '../hooks/useOverviewModules';
import { useTourSelection } from '../context/TourSelectionContext';
import {
  AMBER,
  AMBER_TINT_04,
  FONT,
  INK,
  INK_ALPHA_45,
  INK_TINT_07,
  STATUS_LIVE,
  SURFACE,
} from '../_shared/tokens';

const TOUR_LABEL: Record<string, string> = {
  pga: 'PGA',
  euro: 'DPWT',
  liv: 'LIV',
  lpga: 'LPGA',
  pgad: 'KORN FERRY',
  champ: 'CHAMPIONS',
};

export const TourSwitcherAffordance: React.FC = () => {
  const { data } = useAllToursTickerData();
  const [open, setOpen] = useState(false);
  const { selectedTourSlug, selectTour, viewingTourSlug } = useTourSelection();

  // Pill + active-row reflect the tour CURRENTLY IN VIEW on the hero (updates on
  // random landing, swipe, dots, and taps). Fall back to the user's explicit
  // pick, then PGA before the hero has reported anything.
  const activeTourSlug = viewingTourSlug ?? selectedTourSlug ?? 'pga';

  const tourStatus = (slug: string): 'live' | 'upcoming' | 'none' => {
    if (data?.live.some((c) => c.tourSlug === slug)) return 'live';
    const completed = data?.completed.some((c) => c.tourSlug === slug) ?? false;
    const upcoming = data?.upcoming.some((c) => c.tourSlug === slug) ?? false;
    return completed || upcoming ? 'upcoming' : 'none';
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
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '0 14px 0 10px',
          background: 'transparent',
          border: 'none',
          color: WHITE_ALPHA_55,
          cursor: 'pointer',
          fontFamily: 'Geist, system-ui, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          height: 36,
        }}
      >
        <span>{TOUR_LABEL[activeTourSlug] ?? 'PGA'}</span>
        <span aria-hidden style={{ fontSize: 12, opacity: 0.7 }}>↔</span>
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
                  borderLeft: isActive ? '3px solid #F7931E' : '3px solid transparent',
                  borderBottom: `0.5px solid ${INK_TINT_07}`,
                  cursor: selectable ? 'pointer' : 'default',
                  opacity: selectable ? 1 : 0.4,
                  textAlign: 'left',
                  fontFamily: 'Geist, system-ui, sans-serif',
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
                      color: '#0F172A',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {label}
                  </div>
                </div>

                {status === 'live' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: '#10B981' }}>LIVE</span>
                  </span>
                ) : status === 'upcoming' ? (
                  <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: 'rgba(15,23,42,0.45)' }}>
                    UPCOMING
                  </span>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: 'rgba(15,23,42,0.30)' }}>
                    NO EVENT
                  </span>
                )}

                {isActive && (
                  <Check size={16} strokeWidth={2.5} color="#F7931E" />
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
