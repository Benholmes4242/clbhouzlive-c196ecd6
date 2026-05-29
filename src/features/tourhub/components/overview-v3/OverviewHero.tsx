/**
 * OverviewHero — self-contained hero carousel for the Tour Hub Overview tab.
 * Keeps the ORIGINAL HybridHero visuals but owns its index INTERNALLY.
 * No activeTournamentId flows up, no onActiveChange, no ?tour= coupling, no
 * tour selector. All three states (live/completed/upcoming) eligible to lead;
 * order shuffled once per data load so the landing tournament differs each visit.
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeroCarouselData, type HeroSlide } from '../../hooks/useHeroCarouselData';
import { HybridHero } from './HybridHero';

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

  const touchStartRef = useRef(0);
  const touchDeltaRef = useRef(0);
  const pausedRef = useRef(false);
  const autoRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    setActiveIndex(0);
  }, [idSignature]);

  const startAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    if (count <= 1) return;
    autoRef.current = setInterval(() => {
      if (!pausedRef.current) setActiveIndex((p) => (p + 1) % count);
    }, 7000);
  }, [count]);

  useEffect(() => {
    startAuto();
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [startAuto]);

  useEffect(() => {
    const onVis = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const goTo = useCallback((i: number) => setActiveIndex(i), []);

  const onTouchStart = (e: React.TouchEvent) => {
    pausedRef.current = true;
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
    window.setTimeout(() => {
      pausedRef.current = document.hidden;
    }, 5000);
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
