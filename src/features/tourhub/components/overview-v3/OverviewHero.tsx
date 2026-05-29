/**
 * OverviewHero — self-contained hero for the Tour Hub Overview tab.
 *
 * Keeps the original HybridHero visuals and owns its index INTERNALLY.
 * Contract — do not reintroduce parent sync:
 *  - No activeTournamentId flows up, no onActiveChange, no ?tour= coupling,
 *    no tour selector. One owner = no loop.
 *  - All three states (live/completed/upcoming) are eligible to lead. On each
 *    data load the slide order is shuffled once and the FIRST slide is shown.
 *  - NO auto-rotation: the user lands on a random tournament and it stays
 *    fixed for the session. Slides change ONLY via swipe or dot tap.
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeroCarouselData, type HeroSlide } from '../../hooks/useHeroCarouselData';
import { HybridHero } from './HybridHero';
import { useTourSelection } from '../../context/TourSelectionContext';

function shuffle<T>(input: T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const NOOP = () => {};

interface OverviewHeroProps {
  height?: number;
}

export function OverviewHero({ height = 528 }: OverviewHeroProps) {
  const { data: rawSlides = [], isLoading } = useHeroCarouselData();

  const idSignature = useMemo(
    () => (Array.isArray(rawSlides) ? rawSlides.map((s) => s.tournament.id).join('|') : ''),
    [rawSlides],
  );

  const slides = useMemo<HeroSlide[]>(() => {
    if (!Array.isArray(rawSlides) || rawSlides.length === 0) return [];
    return shuffle(rawSlides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSignature]);

  const [activeIndex, setActiveIndex] = useState(0);
  const count = slides.length;

  // Manual tour switcher (one-way): jump to the first slide for the picked tour.
  const { selectedTourSlug, selectionNonce } = useTourSelection();
  useEffect(() => {
    if (!selectedTourSlug || count === 0) return;
    const idx = slides.findIndex((s) => s.tournament.tourSlug === selectedTourSlug);
    if (idx >= 0) setActiveIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionNonce]);

  const touchStartRef = useRef(0);
  const touchDeltaRef = useRef(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [idSignature]);

  const goTo = useCallback((i: number) => setActiveIndex(i), []);

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
          background: 'linear-gradient(135deg, rgba(15,23,42,0.06), rgba(15,23,42,0.02))',
        }}
        aria-busy={isLoading}
      />
    );
  }

  const active = slides[Math.min(activeIndex, count - 1)];

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
          <HybridHero slide={active} activeTournamentId={active.tournament.id} onSelectTour={NOOP} />
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 12 }}>
          {slides.map((s, i) => (
            <button
              key={s.tournament.id}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={i === activeIndex ? 'hero-dot-active' : 'hero-dot-inactive'}
              style={{ border: 'none', padding: 0, cursor: 'pointer' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default OverviewHero;
