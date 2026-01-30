/**
 * OverviewPageV3 - World-class Tour Hub Overview
 * Full-screen cinematic hero with scrollable content below
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HeroCarousel,
  TourSwitcher,
  ThisWeekView,
  WorldRankingsShowcase,
  SeasonDashboardV3,
  TourBreakdown,
} from '../overview-v3';
import { type TourId } from '../../hooks/useOverviewData';

export function OverviewPageV3() {
  const [selectedTour, setSelectedTour] = useState<TourId | 'all'>('all');

  return (
    <motion.div
      className="flex flex-col bg-[#F8FAFC]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* 1. Hero Carousel - Full-screen cinematic */}
      <HeroCarousel />

      {/* Content below hero - scroll target */}
      <div id="content-below-hero">
        {/* 2. Tour Switcher Pills */}
        <TourSwitcher 
          selectedTour={selectedTour} 
          onSelectTour={setSelectedTour} 
        />

        {/* 3. This Week in Golf */}
        <ThisWeekView filterTour={selectedTour} />

        {/* 4. World Rankings Showcase */}
        <WorldRankingsShowcase />

        {/* 5. Season Dashboard */}
        <SeasonDashboardV3 />

        {/* 6. Tour Breakdown */}
        <TourBreakdown />
      </div>
    </motion.div>
  );
}
