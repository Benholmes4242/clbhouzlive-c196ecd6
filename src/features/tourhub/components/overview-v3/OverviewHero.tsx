/**
 * OverviewHero — self-contained hero for the Tour Hub Overview tab.
 * All states (live / results / upcoming / cancelled) route through HybridHero,
 * which derives the visual state internally via deriveHeroState and renders
 * the unified CinematicFrame capsule. Random landing, fixed (no auto-rotate),
 * swipe + dots, tour-switcher tap-jump.
 *
 * ALL hooks run unconditionally before any early return (React #310 safety).
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeroCarouselData, type HeroSlide } from '../../hooks/useHeroCarouselData';
import { HybridHero } from './HybridHero';
import { useTourSelection } from '../../context/TourSelectionContext';
import { INK_TINT_06 } from '../../_shared/tokens';

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
  topRightSlot?: React.ReactNode;
}

export function OverviewHero({ height = 528, topRightSlot }: OverviewHeroProps) {
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

  const { selectedTourSlug, selectionNonce, setViewingTourSlug } = useTourSelection();

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

  const viewingSlug = count > 0 ? slides[Math.min(activeIndex, count - 1)]?.tournament.tourSlug : undefined;
  useEffect(() => {
    if (viewingSlug) setViewingTourSlug(viewingSlug);
  }, [viewingSlug, setViewingTourSlug]);

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
      <div style={{ height, borderRadius: 20, background: `linear-gradient(135deg, ${INK_TINT_06}, rgba(15,23,42,0.02))` }} aria-busy={isLoading} />
    );
  }

  const active = slides[Math.min(activeIndex, count - 1)];

  return (
    <div style={{ position: 'relative', width: '100%' }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <AnimatePresence mode="wait">
        <motion.div key={active.tournament.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <HybridHero
            slide={active}
            activeTournamentId={active.tournament.id}
            onSelectTour={NOOP}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default OverviewHero;
