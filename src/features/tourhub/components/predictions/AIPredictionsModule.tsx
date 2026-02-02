/**
 * AIPredictionsModule - Main orchestrator for Claude AI-powered tournament predictions
 * Fetches from ai_predictions table with Claude-generated analysis
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIPredictions } from '../../hooks/useAIPredictions';
import { TournamentHeroCard } from './TournamentHeroCard';
import { TopPicksPodium } from './TopPicksPodium';
import { ContendersCarousel } from './ContendersCarousel';
import { DarkHorsesSection } from './DarkHorsesSection';
import { format, parseISO } from 'date-fns';
import { Info, Sparkles } from 'lucide-react';

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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, error } = useAIPredictions();

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

  if (error || !data) {
    return null; // No upcoming tournament or AI predictions
  }

  const { tournament, topContenders, darkHorses, courseAnalysis, isAIPowered, confidence } = data;

  // Format dates
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return dateStr;
    }
  };
  const dates = `${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}`;
  const purseFormatted = `$${(tournament.purse / 1000000).toFixed(1)}M`;

  // Build skill requirements from courseAnalysis.keyStats
  // AI returns keyStats as an array of skill names, we map them to importance levels
  const skills = (courseAnalysis?.keyStats || ['Accuracy', 'Scrambling', 'Putting', 'Distance'])
    .slice(0, 4)
    .map((stat: string, index: number) => {
      const importance = index === 0 ? 'critical' : index === 1 ? 'significant' : 'useful';
      const level = index === 0 ? 90 : index === 1 ? 70 : index === 2 ? 55 : 40;
      return {
        skill: stat,
        level,
        importance: importance as 'critical' | 'significant' | 'useful',
      };
    });

  // Ensure we have at least 4 skills
  const defaultSkills = ['Accuracy', 'Scrambling', 'Putting', 'Distance'];
  while (skills.length < 4) {
    const skill = defaultSkills[skills.length];
    skills.push({
      skill,
      level: 40,
      importance: 'useful' as const,
    });
  }

  // Use AI insight or fallback to winner profile
  const archetypeDescription = courseAnalysis?.insight || courseAnalysis?.winnerProfile || 'Analysis powered by Clubhouse Intelligence';

  // Top 3 picks with reasons for #1
  const topPicks = topContenders.slice(0, 3).map((p, i) => ({
    rank: i + 1,
    playerId: p.playerId,
    playerName: p.playerName,
    photoUrl: p.photoUrl,
    pgaTourId: p.pgaTourId,
    country: p.country,
    worldRanking: p.worldRanking,
    winProbability: Math.round(p.winProbability * 10) / 10,
    reasons: i === 0 ? p.reasons : undefined, // Only #1 gets reasons
    topStat: p.reasons?.[0], // Use first reason as top stat for #2/#3
  }));

  // Contenders: positions 4-8
  const contenders = topContenders.slice(3, 8).map((p, i) => ({
    rank: i + 4,
    playerId: p.playerId,
    playerName: p.playerName,
    photoUrl: p.photoUrl,
    pgaTourId: p.pgaTourId,
    winProbability: Math.round(p.winProbability * 10) / 10,
  }));

  // Dark horses - map from AI data
  const mappedDarkHorses = darkHorses.map(dh => ({
    playerId: dh.playerId,
    playerName: dh.playerName,
    photoUrl: dh.photoUrl,
    pgaTourId: dh.pgaTourId,
    worldRanking: dh.worldRanking,
    reason: dh.keyStat || dh.hook,
    icon: '🔥',
    hook: { label: dh.hook },
  }));

  return (
    <section className="py-6 border-t border-slate-100">
      {/* Header */}
      <motion.div 
        className="px-4 mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
            Tournament Insights
          </p>
          {isAIPowered && (
            <div className="flex items-center gap-1 text-xs text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              <span className="font-medium">AI</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-bold text-gray-900">Top Contenders This Week</h2>
          
          {/* Tooltip trigger and content container */}
          <div ref={tooltipRef} className="relative inline-flex items-center">
            <button 
              className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center"
              onClick={() => setShowTooltip(!showTooltip)}
            >
              <Info className="w-2.5 h-2.5 text-gray-500" />
            </button>
            
            {/* Apple-grade tooltip - right-aligned to stay in bounds */}
            <AnimatePresence>
              {showTooltip && (
                <motion.div 
                  className="absolute top-full right-0 mt-2 w-72 z-50"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Arrow pointer - positioned on the right side */}
                  <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white rotate-45 border-l border-t border-gray-200" />
                  
                  {/* Tooltip card */}
                  <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200/80 p-4">
                    <p className="text-xs font-semibold text-gray-900 mb-2">
                      Built by Clubhouse Intelligence
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      We use Claude AI to analyse player statistics, course history, and current form 
                      to generate predictions for this week's PGA Tour event.
                    </p>
                    {confidence && (
                      <p className="text-[10px] text-gray-400 mt-2">
                        Model confidence: {Math.round(confidence * 100)}%
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Tournament Hero Card - full bleed with venue image */}
      <TournamentHeroCard
        tournamentName={tournament.name}
        venue={tournament.venueName}
        venueCity={tournament.venueCity}
        dates={dates}
        purse={purseFormatted}
        par={tournament.par}
        yardage={tournament.yardage}
        archetype="ai"
        archetypeLabel={courseAnalysis?.difficulty || 'Moderate'}
        archetypeDescription={archetypeDescription}
        skills={skills}
      />

      {/* Top Picks Podium */}
      <div className="mt-4">
        <TopPicksPodium picks={topPicks} />
      </div>

      {/* Contenders Carousel */}
      <ContendersCarousel contenders={contenders} />

      {/* Dark Horses */}
      <DarkHorsesSection darkHorses={mappedDarkHorses} />
    </section>
  );
};

export default AIPredictionsModule;
