/**
 * PredictionsModule - "Who's Taking This?" AI-powered predictions
 * 
 * Apple-Grade UI Transformation:
 * - Hero #1 pick with dark card, gold accents
 * - Side-by-side podium for #2-3
 * - Clean contenders list (no colored borders)
 * - Course DNA with monochromatic bars sorted by importance
 * - Cohesive color palette (no rainbow)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNextTournamentPredictions, type PlayerPrediction, type DarkHorse, type CourseProfile } from '../../hooks/useTournamentPredictions';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import CountryFlag from '@/components/ui/country-flag';

// Spring animation configs
const springDefault = { type: "spring" as const, stiffness: 400, damping: 30 };
const springGentle = { type: "spring" as const, stiffness: 300, damping: 25, mass: 1.2 };

// Sorted course stats by weight for Course DNA
const sortStatsByWeight = (weights: Record<string, number>) => {
  const statLabels: Record<string, string> = {
    distance: 'Distance',
    accuracy: 'Accuracy',
    scrambling: 'Scrambling',
    putting: 'Putting',
    sgTotal: 'SG: Total',
  };
  
  return Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .map(([key, weight]) => ({
      key,
      label: statLabels[key] || key,
      weight,
      importance: weight >= 0.35 ? 'Critical' : weight >= 0.25 ? 'Important' : weight >= 0.15 ? 'Moderate' : 'Minor',
    }));
};

// Course DNA Card - Refined with monochromatic bars
const CourseDNACard = ({ 
  courseProfile, 
  venueName, 
  par, 
  yardage 
}: { 
  courseProfile: CourseProfile;
  venueName: string;
  par: number;
  yardage: number;
}) => {
  const sortedStats = sortStatsByWeight(courseProfile.statWeights);
  
  return (
    <div className="mx-4 mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Course DNA
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xl">{courseProfile.icon}</span>
            <span className="text-[15px] font-bold text-slate-900">
              {courseProfile.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-semibold text-slate-700">{venueName}</p>
          <p className="text-[12px] text-slate-400">Par {par} • {yardage.toLocaleString()} yds</p>
        </div>
      </div>
      
      <p className="text-[13px] text-slate-500 mb-4">{courseProfile.description}</p>
      
      <div className="space-y-2.5">
        {sortedStats.map((stat) => (
          <div key={stat.key} className="flex items-center gap-3">
            <span className="text-[13px] text-slate-600 w-20">{stat.label}</span>
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full rounded-full bg-slate-900"
                initial={{ width: 0 }}
                animate={{ width: `${stat.weight * 100 * 2.5}%` }}
                transition={{ ...springGentle, delay: 0.2 }}
              />
            </div>
            <span className="text-[11px] text-slate-400 w-16 text-right">{stat.importance}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Hero #1 Pick - Premium dark card with gold accents
const HeroPick = ({ 
  prediction, 
  onTap 
}: { 
  prediction: PlayerPrediction;
  onTap: () => void;
}) => (
  <motion.button
    onClick={onTap}
    className="w-full p-5 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-left shadow-lg"
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ ...springDefault, delay: 0.1 }}
  >
    <div className="flex items-center gap-2 mb-4">
      <span className="text-2xl">🥇</span>
      <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
        Top Pick
      </span>
    </div>
    
    <div className="flex items-center gap-4 mb-5">
      {/* Player photo with gold ring */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full overflow-hidden ring-[3px] ring-amber-400 ring-offset-2 ring-offset-slate-900 shadow-xl">
          {prediction.photoUrl ? (
            <img 
              src={prediction.photoUrl} 
              alt={prediction.playerName} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-400 text-lg font-bold">
              {prediction.playerName.split(' ').map(n => n[0]).join('')}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-[22px] font-bold text-white tracking-tight truncate">
            {prediction.playerName}
          </h3>
          <CountryFlag country={prediction.country} size="md" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[15px] text-slate-400">World #{prediction.worldRank}</span>
          {prediction.momentum > 0 && (
            <span className="flex items-center gap-0.5 text-[13px] text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              +{prediction.momentum}
            </span>
          )}
        </div>
      </div>
      
      <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
    </div>
    
    {/* Win Probability */}
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[12px] text-slate-400">Win Probability</span>
        <span className="text-[24px] font-bold text-white font-mono tracking-tight">
          {prediction.winProbability}%
        </span>
      </div>
      <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(prediction.winProbability * 2.5, 100)}%` }}
          transition={{ ...springGentle, delay: 0.3 }}
        />
      </div>
    </div>
    
    {/* Why They Win - Reasons */}
    {prediction.reasons.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {prediction.reasons.slice(0, 3).map((reason, i) => (
          <div 
            key={i} 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-700/50 text-[11px] text-slate-300"
          >
            <span>{reason.icon}</span>
            <span>{reason.text.length > 25 ? reason.text.slice(0, 25) + '...' : reason.text}</span>
          </div>
        ))}
      </div>
    )}
  </motion.button>
);

// Podium Card for #2 and #3
const PodiumCard = ({ 
  prediction, 
  rank,
  onTap 
}: { 
  prediction: PlayerPrediction;
  rank: 2 | 3;
  onTap: () => void;
}) => {
  const medal = rank === 2 ? '🥈' : '🥉';
  
  return (
    <motion.button
      onClick={onTap}
      className="flex-1 p-4 rounded-2xl bg-white border border-black/[0.06] shadow-sm text-left"
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springDefault, delay: rank === 2 ? 0.15 : 0.2 }}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-lg">{medal}</span>
        <span className="text-[11px] font-semibold text-slate-400">#{rank}</span>
      </div>
      
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
          {prediction.photoUrl ? (
            <img 
              src={prediction.photoUrl} 
              alt={prediction.playerName} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">
              {prediction.playerName.split(' ').map(n => n[0]).join('')}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-semibold text-slate-900 truncate">
            {prediction.playerName}
          </h4>
          <p className="text-[12px] text-slate-500">World #{prediction.worldRank}</p>
        </div>
      </div>
      
      {/* Probability */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] text-slate-400">Probability</span>
          <span className="text-[15px] font-bold text-slate-900 font-mono">
            {prediction.winProbability}%
          </span>
        </div>
        <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(prediction.winProbability * 2.5, 100)}%` }}
            transition={{ ...springGentle, delay: 0.4 }}
          />
        </div>
      </div>
      
      {/* Top 2 reasons */}
      {prediction.reasons.length > 0 && (
        <div className="space-y-1">
          {prediction.reasons.slice(0, 2).map((reason, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>{reason.icon}</span>
              <span className="truncate">{reason.text}</span>
            </div>
          ))}
        </div>
      )}
    </motion.button>
  );
};

// Contender Row - Clean, minimal
const ContenderRow = ({ 
  prediction, 
  rank,
  index,
  onTap 
}: { 
  prediction: PlayerPrediction;
  rank: number;
  index: number;
  onTap: () => void;
}) => (
  <motion.button
    onClick={onTap}
    className="w-full flex items-center gap-3 py-3 px-3 rounded-xl bg-white border border-black/[0.06] text-left"
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ ...springDefault, delay: 0.3 + index * 0.05 }}
  >
    <span className="w-6 text-center text-[13px] font-bold text-slate-400">#{rank}</span>
    
    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
      {prediction.photoUrl ? (
        <img 
          src={prediction.photoUrl} 
          alt={prediction.playerName} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
          {prediction.playerName.split(' ').map(n => n[0]).join('')}
        </div>
      )}
    </div>
    
    <div className="flex-1 min-w-0">
      <p className="text-[15px] font-semibold text-slate-900 truncate">{prediction.playerName}</p>
      <p className="text-[12px] text-slate-500">World #{prediction.worldRank}</p>
    </div>
    
    <span className="text-[15px] font-bold text-emerald-600 font-mono">
      {prediction.winProbability}%
    </span>
    
    <ChevronRight className="w-4 h-4 text-slate-300" />
  </motion.button>
);

// Dark Horse Card - Refined
const DarkHorseCard = ({ 
  darkHorse,
  index,
  onTap 
}: { 
  darkHorse: DarkHorse;
  index: number;
  onTap: () => void;
}) => (
  <motion.button
    onClick={onTap}
    className="flex-shrink-0 w-[160px] p-3 rounded-2xl bg-white border border-black/[0.06] text-left"
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ ...springDefault, delay: 0.4 + index * 0.05 }}
  >
    <div className="flex items-center justify-center mb-3">
      <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100">
        {darkHorse.player.photoUrl ? (
          <img 
            src={darkHorse.player.photoUrl} 
            alt={darkHorse.player.playerName} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">
            {darkHorse.player.playerName.split(' ').map(n => n[0]).join('')}
          </div>
        )}
      </div>
    </div>
    
    <p className="text-[14px] font-semibold text-slate-900 text-center truncate mb-0.5">
      {darkHorse.player.playerName.split(' ').pop()}
    </p>
    <p className="text-[11px] text-slate-400 text-center mb-2">
      #{darkHorse.player.worldRank}
    </p>
    
    <div className="flex items-center justify-center gap-1 text-[11px] text-purple-600 font-medium">
      <span>{darkHorse.icon}</span>
      <span className="truncate">{darkHorse.reason}</span>
    </div>
  </motion.button>
);

// Loading skeleton
const PredictionsSkeleton = () => (
  <section className="py-6 border-t border-slate-100">
    <div className="px-4">
      <div className="h-6 w-32 bg-slate-100 rounded animate-pulse mb-2" />
      <div className="h-8 w-56 bg-slate-100 rounded animate-pulse mb-6" />
      <div className="h-32 bg-slate-100 rounded-2xl animate-pulse mb-4" />
      <div className="h-48 bg-slate-100 rounded-2xl animate-pulse mb-4" />
      <div className="flex gap-3 mb-4">
        <div className="flex-1 h-40 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="flex-1 h-40 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    </div>
  </section>
);

// Main component
export const PredictionsModule = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useNextTournamentPredictions();
  const [showAll, setShowAll] = useState(false);
  
  if (isLoading) {
    return <PredictionsSkeleton />;
  }
  
  if (!data) {
    return null; // No upcoming tournament
  }
  
  const { tournament, courseProfile, predictions, darkHorses } = data;
  const heroPick = predictions[0];
  const podiumPicks = predictions.slice(1, 3);
  const contenders = predictions.slice(3, showAll ? 10 : 6);
  
  const handlePlayerTap = (playerId: string) => {
    navigate(`/tourhub/player/${playerId}`);
  };
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <section className="py-6 border-t border-slate-100">
      {/* Compact Header */}
      <div className="px-4 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🔮</span>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.02em]">
            AI Predictions
          </p>
        </div>
        <h2 className="text-[28px] font-bold text-slate-900 tracking-tight mb-1">
          Who's Taking This?
        </h2>
        <p className="text-[13px] text-slate-500">
          {tournament.name} • {formatDate(tournament.startDate)}
        </p>
      </div>
      
      {/* Course DNA */}
      <CourseDNACard 
        courseProfile={courseProfile}
        venueName={tournament.venueName}
        par={tournament.par}
        yardage={tournament.yardage}
      />
      
      {/* Hero #1 Pick */}
      {heroPick && (
        <div className="px-4 mb-4">
          <HeroPick 
            prediction={heroPick}
            onTap={() => handlePlayerTap(heroPick.playerId)}
          />
        </div>
      )}
      
      {/* Podium #2-3 */}
      {podiumPicks.length === 2 && (
        <div className="px-4 mb-5 flex gap-3">
          <PodiumCard 
            prediction={podiumPicks[0]}
            rank={2}
            onTap={() => handlePlayerTap(podiumPicks[0].playerId)}
          />
          <PodiumCard 
            prediction={podiumPicks[1]}
            rank={3}
            onTap={() => handlePlayerTap(podiumPicks[1].playerId)}
          />
        </div>
      )}
      
      {/* Contenders */}
      {contenders.length > 0 && (
        <div className="px-4 mb-5">
          <h3 className="text-[13px] font-semibold text-slate-400 uppercase tracking-[0.02em] mb-3">
            Contenders
          </h3>
          <div className="space-y-2">
            {contenders.map((prediction, index) => (
              <ContenderRow
                key={prediction.playerId}
                prediction={prediction}
                rank={index + 4}
                index={index}
                onTap={() => handlePlayerTap(prediction.playerId)}
              />
            ))}
          </div>
          
          {!showAll && predictions.length > 6 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full mt-3 py-3 text-[15px] font-semibold text-emerald-600 bg-emerald-50 rounded-xl active:bg-emerald-100 active:scale-[0.98] transition-all"
            >
              Show More Picks
            </button>
          )}
        </div>
      )}
      
      {/* Dark Horses */}
      {darkHorses.length > 0 && (
        <div className="mb-5">
          <div className="px-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🐴</span>
              <h3 className="text-[13px] font-semibold text-slate-400 uppercase tracking-[0.02em]">
                Dark Horses
              </h3>
            </div>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Players outperforming their ranking
            </p>
          </div>
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
            {darkHorses.map((dh, index) => (
              <DarkHorseCard
                key={dh.player.playerId}
                darkHorse={dh}
                index={index}
                onTap={() => handlePlayerTap(dh.player.playerId)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Disclaimer */}
      <div className="mx-4 p-3 rounded-xl bg-slate-50">
        <p className="text-[11px] text-slate-400 text-center">
          Predictions based on statistical analysis of player performance data. 
          For entertainment purposes only.
        </p>
      </div>
    </section>
  );
};

export default PredictionsModule;
