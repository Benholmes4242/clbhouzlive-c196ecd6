/**
 * PredictionTracker - Main live tracking container
 * Renders: AccuracyHeadlineCard + PredictionScorecard + DarkHorseTracker
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { AccuracyHeadlineCard } from './AccuracyHeadlineCard';
import { PredictionScorecard } from './PredictionScorecard';
import { DarkHorseTracker } from './DarkHorseTracker';
import { CourseDNACard } from './CourseDNACard';
import { ClubhouseIntelligence } from './ClubhouseIntelligence';
import { UpNextPreview } from './UpNextPreview';
import type { PredictionTrackerData, NextTournamentPreview, CourseDNAItem } from './types';

interface PredictionTrackerProps {
  tracker: PredictionTrackerData;
  nextTournament: NextTournamentPreview | null;
  courseDNA: CourseDNAItem[];
  courseName: string;
  clubhouseIntelligence: {
    primaryText: string;
    expandedText?: string;
  };
}

export const PredictionTracker: React.FC<PredictionTrackerProps> = ({
  tracker,
  nextTournament,
  courseDNA,
  courseName,
  clubhouseIntelligence,
}) => {
  const [showCourseDNA, setShowCourseDNA] = useState(false);

  return (
    <div className="space-y-4">
      {/* Main predictions scorecard */}
      <PredictionScorecard predictions={tracker.predictions} />

      {/* Dark horses */}
      <DarkHorseTracker darkHorses={tracker.darkHorses} />

      {/* Course DNA toggle */}
      <button
        onClick={() => setShowCourseDNA(!showCourseDNA)}
        className="flex items-center gap-1 text-xs font-medium active:opacity-70 transition-opacity"
        style={{ color: '#78716C' }}
      >
        <span>{showCourseDNA ? 'Hide' : 'View'} Course DNA</span>
        <ChevronRight
          className="w-3 h-3 transition-transform"
          style={{ transform: showCourseDNA ? 'rotate(90deg)' : undefined }}
        />
      </button>

      <AnimatePresence>
        {showCourseDNA && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className="rounded-2xl bg-card border border-border overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
            >
              {courseDNA.length > 0 && (
                <CourseDNACard items={courseDNA} courseName={courseName} inline />
              )}
              <ClubhouseIntelligence insight={clubhouseIntelligence} inline />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Up Next preview */}
      {nextTournament && <UpNextPreview preview={nextTournament} />}
    </div>
  );
};
