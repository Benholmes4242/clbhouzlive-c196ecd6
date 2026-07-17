/**
 * OverviewHero — Hero River. The carousel crosses ALL tours in the
 * editorial order returned by useHeroCarouselData (LIVE→majors→rest).
 * Swipe / chevrons change the tournament AND the tour. The picker becomes a
 * jump-to shortcut via selectionNonce. Display reporting is debounced 250ms
 * so a rapid multi-slide swipe doesn't fan out pulse/OTC/TI fetches per
 * intermediate slide.
 *
 * Strict one-way flows preserved: hero never reads viewing* back into its own
 * index. All hooks run unconditionally before any early return (React #310).
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useHeroCarouselData, type HeroSlide } from '../../hooks/useHeroCarouselData';
import { HybridHero } from './HybridHero';
import { useTourSelection } from '../../context/TourSelectionContext';
import { INK_TINT_06 } from '../../_shared/tokens';

const NOOP = () => {};

interface OverviewHeroProps {
  height?: number;
}

export function OverviewHero({ height = 528 }: OverviewHeroProps) {
  const { data: rawSlides = [], isLoading } = useHeroCarouselData();

  const {
    selectedTourSlug,
    selectedTournamentId,
    selectionNonce,
    setViewingTourSlug,
    setViewingTournamentId,
  } = useTourSelection();

  // Hero River: trust the hook's editorial order. No per-tour filter, no shuffle.
  const slides = rawSlides;
  const count = slides.length;

  const idSignature = useMemo(
    () => slides.map((s) => s.tournament.id).join('|'),
    [slides],
  );

  const [activeIndex, setActiveIndex] = useState(0);

  // Track the currently-viewed tournament id so we can restore position
  // across background data refreshes. The restore effect runs FIRST (declared
  // first) so it reads the pre-refresh id before the updater overwrites it.
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (count === 0) return;
    const prevId = prevIdRef.current;
    const nextIdx = prevId ? slides.findIndex((s) => s.tournament.id === prevId) : -1;
    setActiveIndex(nextIdx >= 0 ? nextIdx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSignature]);

  useEffect(() => {
    const id = slides[activeIndex]?.tournament.id;
    if (id) prevIdRef.current = id;
  }, [activeIndex, slides]);

  // COMMAND jump: picker → hero. Find the tournament in the river; else the
  // first slide of the selected tour; else index 0.
  useEffect(() => {
    if (count === 0) return;
    let idx = -1;
    if (selectedTournamentId) {
      idx = slides.findIndex((s) => s.tournament.id === selectedTournamentId);
    }
    if (idx < 0 && selectedTourSlug) {
      idx = slides.findIndex((s) => s.tournament.tourSlug === selectedTourSlug);
    }
    if (idx < 0) idx = 0;
    setActiveIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionNonce]);

  const touchStartRef = useRef(0);
  const touchDeltaRef = useRef(0);

  const activeSlide = count > 0 ? slides[Math.min(activeIndex, count - 1)] : undefined;
  const viewingSlug = activeSlide?.tournament.tourSlug;
  const viewingTid = activeSlide?.tournament.id ?? null;

  // DEBOUNCED display reporting (4G guard). One trailing-edge write 250ms after
  // the last swipe/jump — rapid multi-slide sweeps no longer fire pulse/OTC/TI
  // fetches per intermediate slide.
  useEffect(() => {
    const t = setTimeout(() => {
      if (viewingSlug) setViewingTourSlug(viewingSlug);
      setViewingTournamentId(viewingTid);
    }, 250);
    return () => clearTimeout(t);
  }, [viewingSlug, viewingTid, setViewingTourSlug, setViewingTournamentId]);

  const goPrev = useCallback(() => {
    if (count > 1) setActiveIndex((p) => (p - 1 + count) % count);
  }, [count]);
  const goNext = useCallback(() => {
    if (count > 1) setActiveIndex((p) => (p + 1) % count);
  }, [count]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
    touchDeltaRef.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchDeltaRef.current = e.touches[0].clientX - touchStartRef.current;
  };
  const onTouchEnd = () => {
    const d = touchDeltaRef.current;
    if (Math.abs(d) > 50 && count > 1) {
      setActiveIndex((p) => (d < 0 ? (p + 1) % count : (p - 1 + count) % count));
    }
  };

  if (isLoading || count === 0) {
    return (
      <div
        style={{
          height,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${INK_TINT_06}, rgba(15,23,42,0.02))`,
        }}
        aria-busy={isLoading}
      />
    );
  }

  const active = slides[Math.min(activeIndex, count - 1)];
  const showChevrons = count > 1;
  const showCounter = count > 8;

  const chevronBase: React.CSSProperties = {
    position: 'absolute',
    top: '38%',
    zIndex: 20,
    width: 34,
    height: 34,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.16)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    border: '0.5px solid rgba(255,255,255,0.22)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    cursor: 'pointer',
    padding: 0,
  };

  return (
    <div
      style={{ position: 'relative', width: '100%' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={active.tournament.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <HybridHero
            slide={active}
            activeTournamentId={active.tournament.id}
            onSelectTour={NOOP}
          />
        </motion.div>
      </AnimatePresence>

      {showChevrons && (
        <>
          <button
            type="button"
            aria-label="Previous tournament"
            onClick={goPrev}
            style={{ ...chevronBase, left: 8 }}
          >
            <ChevronLeft size={20} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            aria-label="Next tournament"
            onClick={goNext}
            style={{ ...chevronBase, right: 8 }}
          >
            <ChevronRight size={20} strokeWidth={2.25} />
          </button>
        </>
      )}

      {/* Dots / counter row */}
      {count > 1 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            zIndex: 15,
            pointerEvents: 'none',
          }}
        >
          {showCounter ? (
            <div
              style={{
                fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: '#fff',
                background: 'rgba(10,14,20,0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                padding: '4px 9px',
                borderRadius: 999,
                fontVariantNumeric: 'tabular-nums',
                pointerEvents: 'auto',
              }}
            >
              {activeIndex + 1} / {count}
            </div>
          ) : (
            slides.map((_, i) => (
              <span
                key={i}
                aria-hidden
                style={{
                  width: i === activeIndex ? 16 : 5,
                  height: 5,
                  borderRadius: 999,
                  background: i === activeIndex ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                  transition: 'width 200ms ease, background 200ms ease',
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default OverviewHero;
