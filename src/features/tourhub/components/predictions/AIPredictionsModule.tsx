/**
 * AIPredictionsModule - Main orchestrator for AI-powered tournament predictions
 * Redesigned with unified container for visual cohesion
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNextTournamentPredictions } from '../../hooks/useTournamentPredictions';
import { TournamentHeroCard } from './TournamentHeroCard';
import { TopPicksPodium } from './TopPicksPodium';
import { ContendersCarousel } from './ContendersCarousel';
import { DarkHorsesSection } from './DarkHorsesSection';
import { format, parseISO } from 'date-fns';

// Helper: Convert stat weight (0-0.4) to percentage (0-100)
const weightToPercent = (weight: number): number => Math.min(weight * 250, 100);

// Helper: Get importance label from weight
const getImportance = (weight: number): 'critical' | 'significant' | 'useful' => {
  if (weight >= 0.30) return 'critical';
  if (weight >= 0.20) return 'significant';
  return 'useful';
};

// Loading skeleton
const PredictionsSkeleton = () => (
  <section className="py-6">
    <div className="px-4 mb-4">
      <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mb-2" />
      <div className="h-7 w-56 bg-gray-100 rounded animate-pulse" />
    </div>
    <div className="mx-4 bg-gray-50 rounded-2xl p-4 space-y-4">
      <div className="h-[180px] bg-gray-100 rounded-2xl animate-pulse" />
      <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  </section>
);

export const AIPredictionsModule = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNextTournamentPredictions();

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showTooltip]);

  if (isLoading) {
    return <PredictionsSkeleton />;
  }

  if (!data) {
    return null; // No upcoming tournament
  }

  const { tournament, courseProfile, predictions, darkHorses } = data;

  // Format dates
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return dateStr;
    }
  };
  const dates = `${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}`;

  // Build skill requirements from courseProfile.statWeights
  const skills = [
    {
      skill: 'Accuracy',
      icon: '🎯',
      level: weightToPercent(courseProfile.statWeights.accuracy),
      importance: getImportance(courseProfile.statWeights.accuracy),
    },
    {
      skill: 'Scrambling',
      icon: '🛡️',
      level: weightToPercent(courseProfile.statWeights.scrambling),
      importance: getImportance(courseProfile.statWeights.scrambling),
    },
    {
      skill: 'Putting',
      icon: '🕳️',
      level: weightToPercent(courseProfile.statWeights.putting),
      importance: getImportance(courseProfile.statWeights.putting),
    },
    {
      skill: 'Distance',
      icon: '💪',
      level: weightToPercent(courseProfile.statWeights.distance),
      importance: getImportance(courseProfile.statWeights.distance),
    },
  ].sort((a, b) => b.level - a.level) as Array<{
    skill: string;
    icon: string;
    level: number;
    importance: 'critical' | 'significant' | 'useful';
  }>;

  // Top 3 picks with reasons for #1
  const topPicks = predictions.slice(0, 3).map((p, i) => ({
    rank: i + 1,
    playerId: p.playerId,
    playerName: p.playerName,
    photoUrl: p.photoUrl,
    pgaTourId: p.pgaTourId,
    country: p.country,
    worldRanking: p.worldRank,
    winProbability: Math.round(p.winProbability * 10) / 10,
    momentum: p.momentum,
    reasons: i === 0 ? p.reasons.map(r => r.text) : undefined, // Only #1 gets reasons
    topStat: p.reasons?.[0]?.text, // Use first reason as top stat for #2/#3
  }));

  // Contenders: positions 4-8
  const contenders = predictions.slice(3, 8).map((p, i) => ({
    rank: i + 4,
    playerId: p.playerId,
    playerName: p.playerName,
    photoUrl: p.photoUrl,
    pgaTourId: p.pgaTourId,
    winProbability: Math.round(p.winProbability * 10) / 10,
  }));

  // Dark horses - map from existing data
  const mappedDarkHorses = darkHorses.map(dh => ({
    playerId: dh.player.playerId,
    playerName: dh.player.playerName,
    photoUrl: dh.player.photoUrl,
    pgaTourId: dh.player.pgaTourId,
    worldRanking: dh.player.worldRank,
    reason: dh.reason,
    icon: dh.icon,
    hook: { label: dh.reason },
  }));

  return (
    <section className="py-6 border-t border-gray-100">
      {/* Section Header - outside container */}
      <motion.div 
        ref={tooltipRef}
        className="px-4 mb-3 relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Tournament Insights
        </p>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900">Top Contenders This Week</h2>
          
          {/* Tooltip trigger */}
          <button 
            className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <span className="text-xs text-gray-500 font-medium">i</span>
          </button>
        </div>

        {/* Full-width centered tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowTooltip(false)} 
              />
              
              {/* Tooltip - full width with margins */}
              <motion.div 
                className="absolute left-0 right-0 top-full mt-2 z-50"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    Built by Clubhouse Intelligence
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We use our proprietary artificial intelligence to analyse data from previous 
                    seasons alongside current form and performance statistics. This allows us to 
                    build a clear picture of the players best suited to contend in this week's 
                    PGA Tour event.
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main content container - unified background */}
      <div className="mx-4 bg-gray-50 rounded-2xl p-4 space-y-4">
        {/* Tournament Hero Card */}
        <TournamentHeroCard
          tournamentName={tournament.name}
          venue={tournament.venueName}
          venueCity={tournament.location?.split(',')[0]}
          dates={dates}
          purse={tournament.purseFormatted}
          par={tournament.par}
          yardage={tournament.yardage}
          archetype={courseProfile.archetype}
          archetypeLabel={courseProfile.label}
          archetypeDescription={courseProfile.description}
          skills={skills}
        />

        {/* Top Picks */}
        <TopPicksPodium picks={topPicks} />

        {/* Contenders */}
        <ContendersCarousel contenders={contenders} />

        {/* Dark Horses */}
        <DarkHorsesSection darkHorses={mappedDarkHorses} />
      </div>
    </section>
  );
};

export default AIPredictionsModule;
