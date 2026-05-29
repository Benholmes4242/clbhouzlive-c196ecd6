/**
 * TourSwitcherAffordance — discreet tour-switch pill in the Tour Hub chrome
 * plus its "Select tour" bottom sheet.
 *
 * Wiring is the SAFE one-way path: tapping a tour calls selectTour(slug) on
 * TourSelectionContext, which OverviewHero reads to jump its own index.
 * Nothing flows back up from the hero.
 */

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { getTourLogo } from '../utils/tourLogos';
import { useAllToursTickerData } from '../hooks/useOverviewModules';
import { useTourSelection } from '../context/TourSelectionContext';

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
  const { selectedTourSlug, selectTour } = useTourSelection();

  // Pill reflects the manually-selected tour, defaulting to PGA before any pick.
  const activeTourSlug = selectedTourSlug ?? 'pga';

  // A tour is selectable only if it has a live or completed event (a hero
  // slide exists for it). Upcoming-only / no-event tours render disabled.
  const hasEvent = (slug: string): boolean => {
    const live = data?.live.some((c) => c.tourSlug === slug) ?? false;
    const completed = data?.completed.some((c) => c.tourSlug === slug) ?? false;
    return live || completed;
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
          color: 'rgba(255,255,255,0.55)',
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
            const liveCount = data?.live.filter((c) => c.tourSlug === slug).length ?? 0;
            const selectable = hasEvent(slug);

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
                  background: isActive ? 'rgba(247,147,30,0.04)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #F7931E' : '3px solid transparent',
                  borderBottom: '0.5px solid rgba(15,23,42,0.07)',
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

                {liveCount > 0 ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 7px',
                      background: 'rgba(239,68,68,0.1)',
                      borderRadius: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#EF4444',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        color: '#EF4444',
                        letterSpacing: '0.12em',
                      }}
                    >
                      LIVE
                    </span>
                  </div>
                ) : (
                  !selectable && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: '#94A3B8',
                        letterSpacing: '0.12em',
                      }}
                    >
                      NO EVENT
                    </span>
                  )
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
