/**
 * AIPredictionsModule - Main orchestrator for AI-powered tournament predictions
 * Redesigned for ~40% reduced vertical sprawl with premium aesthetic
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNextTournamentPredictions } from '../../hooks/useTournamentPredictions';
import { TournamentHeroCard } from './TournamentHeroCard';
import { TopPicksPodium } from './TopPicksPodium';
import { ContendersCarousel } from './ContendersCarousel';
import { DarkHorsesSection } from './DarkHorsesSection';
import { format, parseISO } from 'date-fns';
import { Info } from 'lucide-react';
// Helper: Convert stat weight (0-0.4) to percentage (0-100)
const weightToPercent = (weight: number): number => Math.min(weight * 250, 100);

// Helper: Get importance label from weight
const getImportance = (weight: number): 'critical' | 'moderate' | 'minor' => {
  if (weight >= 0.30) return 'critical';
  if (weight >= 0.20) return 'moderate';
  return 'minor';
};

// Loading skeleton
const PredictionsSkeleton = () => (
  <section className="py-6">
    <div className="px-4 mb-4">
      <div className="h-6 w-32 bg-slate-100 rounded animate-pulse mb-2" />
      <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
    </div>
    <div className="mx-4 h-[200px] bg-slate-100 rounded-2xl animate-pulse mb-4" />
    <div className="mx-4 space-y-3">
      <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
      <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
      <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
    </div>
  </section>
);

export const AIPredictionsModule = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { data, isLoading } = useNextTournamentPredictions();

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
    importance: 'critical' | 'moderate' | 'minor';
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
  }));

  return (
    <section className="py-6 border-t border-slate-100">
      {/* Header */}
      <motion.div 
        className="px-4 mb-4 relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">
          Tournament Insights
        </p>
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-bold text-gray-900">Top Contenders This Week</h2>
          <button 
            className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center"
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <Info className="w-2.5 h-2.5 text-gray-500" />
          </button>
        </div>
        
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div 
              className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-xl shadow-lg border border-gray-200 z-10"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-xs text-gray-600 leading-relaxed">
                Our AI analyses historical performance, course fit, current form, and 
                statistical trends to predict tournament contenders.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tournament Hero Card - full bleed with venue image */}
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

      {/* Top Picks Podium */}
      <div className="mt-5">
        <TopPicksPodium picks={topPicks} />
      </div>

      {/* Contenders Carousel */}
      <ContendersCarousel contenders={contenders} />

      {/* Dark Horses */}
      <DarkHorsesSection darkHorses={mappedDarkHorses} />

      {/* Clubhouse Intelligence Branding */}
      <motion.div 
        className="mt-4 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-1.5">
            Built by Clubhouse Intelligence
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            We use our proprietary artificial intelligence to analyse data from previous 
            seasons alongside current form and performance statistics. This allows us to 
            build a clear picture of the players best suited to contend in this week's 
            PGA Tour event.
          </p>
        </div>
      </motion.div>
    </section>
  );
};

export default AIPredictionsModule;
