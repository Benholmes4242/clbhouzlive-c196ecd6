/**
 * ScheduleHeroCarousel - Unified swipeable hero carousel for all Schedule tabs
 *
 * Generalized from LiveHeroCarousel to support live, completed, upcoming, and all variants.
 * Each slide renders a ScheduleHeroCard with the appropriate layout.
 *
 * Features:
 * - AnimatePresence fade transitions between slides
 * - Horizontal swipe (50px threshold)
 * - Auto-advance every 7s, pause on touch, resume after 5s
 * - Pagination dots inside the card area (hero-dot-active / hero-dot-inactive)
 * - No dots or auto-advance for single slides
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import type { TourTournament } from '../../hooks/useTourHubData';
import type { TournamentLeaderWinner } from '../../hooks/useTournamentLeadersWinners';
import { ScheduleHeroCard } from './ScheduleHeroCard';
import { openTourNav } from '../../contexts/TourNavContext';
import '@/styles/hero-glass.css';

type HeroItemType = 'live' | 'upcoming' | 'recent';

export interface ScheduleHeroItem {
  tournament: TourTournament;
  type: HeroItemType;
}

interface ScheduleHeroCarouselProps {
  items: ScheduleHeroItem[];
  leadersMap?: Map<string, TournamentLeaderWinner>;
  height?: string;
}

export function ScheduleHeroCarousel({ items, leadersMap, height }: ScheduleHeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartRef = useRef(0);
  const touchDeltaRef = useRef(0);
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval>>();
  const pausedRef = useRef(false);

  const count = items.length;

  // Reset index when items change
  useEffect(() => {
    setActiveIndex(0);
  }, [count]);

  // Auto-advance every 7s
  const startAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    if (count <= 1) return;
    autoAdvanceRef.current = setInterval(() => {
      if (!pausedRef.current) {
        setActiveIndex(prev => (prev + 1) % count);
      }
    }, 7000);
  }, [count]);

  useEffect(() => {
    startAutoAdvance();
    return () => { if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current); };
  }, [startAutoAdvance]);

  const handleTouchStart = (e: React.TouchEvent) => {
    pausedRef.current = true;
    touchStartRef.current = e.touches[0].clientX;
    touchDeltaRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaRef.current = e.touches[0].clientX - touchStartRef.current;
  };

  const handleTouchEnd = () => {
    const delta = touchDeltaRef.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0 && activeIndex < count - 1) setActiveIndex(prev => prev + 1);
      if (delta > 0 && activeIndex > 0) setActiveIndex(prev => prev - 1);
    }
    // Resume auto-advance after 5s
    pausedRef.current = false;
    startAutoAdvance();
  };

  if (count === 0) return null;

  const currentItem = items[Math.min(activeIndex, count - 1)];

  if (count === 1) {
    return (
      <div className="relative">
        <button 
          className="absolute z-20 flex items-center justify-center"
          style={{ top: '56px', left: '16px', width: '44px', height: '44px' }}
          onClick={openTourNav}
          aria-label="Open tour menu"
        >
          <Menu 
            className="w-[22px] h-[22px]" 
            strokeWidth={2}
            style={{ color: '#FFFFFF', filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5))' }}
          />
        </button>
        <ScheduleHeroCard
          tournament={currentItem.tournament}
          type={currentItem.type}
          leaderWinner={leadersMap?.get(currentItem.tournament.id)}
          currentIndex={0}
          totalSlides={1}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        className="absolute z-20 flex items-center justify-center"
        style={{ top: '56px', left: '16px', width: '44px', height: '44px' }}
        onClick={openTourNav}
        aria-label="Open tour menu"
      >
        <Menu 
          className="w-[22px] h-[22px]" 
          strokeWidth={2}
          style={{ color: '#FFFFFF', filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5))' }}
        />
      </button>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ScheduleHeroCard
              tournament={currentItem.tournament}
              type={currentItem.type}
              leaderWinner={leadersMap?.get(currentItem.tournament.id)}
              currentIndex={activeIndex}
              totalSlides={count}
              onDotClick={(i) => { setActiveIndex(i); pausedRef.current = false; startAutoAdvance(); }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
