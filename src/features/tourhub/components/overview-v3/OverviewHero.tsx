/**
 * OverviewHero — self-contained hero for the Tour Hub Overview tab (two-state model).
 *   - 'live'      → HybridHero (unchanged)
 *   - 'recapNext' → HybridRecapNext (next event headline + results recap w/ top 3)
 * Owns its index internally. Tour switcher writes a slug via context; we read it
 * and jump our own index. Random landing, fixed (no auto-rotate), swipe + dots.
 */
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeroSlidesHybrid, type HybridHeroSlide } from '../../hooks/useHeroSlidesHybrid';
import { useTournamentLeadersWinners } from '../../hooks/useTournamentLeadersWinners';
import type { HeroSlide } from '../../hooks/useHeroCarouselData';
import { HybridHero } from './HybridHero';
import { HybridRecapNext } from './HybridRecapNext';
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
  const { slides: rawSlides, isLoading } = useHeroSlidesHybrid();

  const idSignature = useMemo(
    () => (Array.isArray(rawSlides) ? rawSlides.map((s) => s.id).join('|') : ''),
    [rawSlides],
  );

  const slides = useMemo<HybridHeroSlide[]>(() => {
    if (!Array.isArray(rawSlides) || rawSlides.length === 0) return [];
    return shuffle(rawSlides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSignature]);

  const completedIds = useMemo(
    () => slides.filter((s) => s.kind === 'recapNext' && s.completed).map((s) => s.completed!.id),
    [slides],
  );
  const { data: leadersMap } = useTournamentLeadersWinners(completedIds);

  const [activeIndex, setActiveIndex] = useState(0);
  const count = slides.length;

  const { selectedTourSlug, selectionNonce } = useTourSelection();
  useEffect(() => {
    if (!selectedTourSlug || count === 0) return;
    const idx = slides.findIndex((s) => s.tourSlug === selectedTourSlug);
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
      <div style={{ height, borderRadius: 20, background: 'linear-gradient(135deg, rgba(15,23,42,0.06), rgba(15,23,42,0.02))' }} aria-busy={isLoading} />
    );
  }

  const active = slides[Math.min(activeIndex, count - 1)];

  return (
    <div style={{ position: 'relative', width: '100%' }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <AnimatePresence mode="wait">
        <motion.div key={active.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {active.kind === 'live' && active.live ? (
            <HybridHero
              slide={{ tournament: active.live, type: 'live' } as HeroSlide}
              activeTournamentId={active.live.id}
              onSelectTour={NOOP}
            />
          ) : (
            <HybridRecapNext
              tourName={(active.upcoming ?? active.completed)?.tourName ?? ''}
              completed={active.completed}
              upcoming={active.upcoming}
              completedLeaders={active.completed ? leadersMap?.get(active.completed.id) : undefined}
              height={height}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 12 }}>
          {slides.map((s, i) => (
            <button key={s.id} aria-label={`Go to slide ${i + 1}`} onClick={() => goTo(i)} className={i === activeIndex ? 'hero-dot-active' : 'hero-dot-inactive'} style={{ border: 'none', padding: 0, cursor: 'pointer' }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default OverviewHero;
