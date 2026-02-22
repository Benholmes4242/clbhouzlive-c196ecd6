/**
 * PredictionsModule - "Who's Taking This?" AI-powered predictions
 * 
 * Displays tournament winner predictions based on course fit and player stats.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNextTournamentPredictions, type PlayerPrediction, type DarkHorse, type CourseProfile } from '../../hooks/useTournamentPredictions';
import { getR2HeadshotUrlMultiTour } from '@/utils/playerHeadshot';
import { ChevronRight, TrendingUp, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, type Transition } from 'framer-motion';
import CountryFlag from '@/components/ui/country-flag';

// Spring animation configs - use inline to avoid type issues


// Course archetype styles
const ARCHETYPE_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  bomber: { bg: 'bg-red-50', text: 'text-red-600', icon: '💪' },
  precision: { bg: 'bg-blue-50', text: 'text-blue-600', icon: '🎯' },
  scrambler: { bg: 'bg-green-50', text: 'text-green-600', icon: '🛡️' },
  balanced: { bg: 'bg-purple-50', text: 'text-purple-600', icon: '⚖️' },
  major: { bg: 'bg-amber-50', text: 'text-amber-600', icon: '🏆' },
};

// Win probability bar
const ProbabilityBar = ({ probability, rank }: { probability: number; rank: number }) => {
  const barColors: Record<number, string> = {
    1: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    2: 'bg-gradient-to-r from-slate-400 to-slate-500',
    3: 'bg-gradient-to-r from-amber-600 to-orange-600',
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-500">Win Probability</span>
        <span className="text-sm font-bold text-slate-900">{probability}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            barColors[rank] || 'bg-emerald-500'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(probability * 2.5, 100)}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
        />
      </div>
    </div>
  );
};

// Reason chip
const ReasonChip = ({ reason }: { reason: { icon: string; text: string } }) => (
  <div className="flex items-center gap-1.5 text-xs text-slate-600">
    <span>{reason.icon}</span>
    <span>{reason.text}</span>
  </div>
);

// Course stat weight bar
const StatWeightBar = ({ label, weight, icon }: { label: string; weight: number; icon: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm w-24 truncate">{icon} {label}</span>
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <div 
        className={cn(
          "h-full rounded-full",
          weight >= 0.35 ? "bg-red-500" :
          weight >= 0.25 ? "bg-amber-500" :
          weight >= 0.15 ? "bg-blue-500" :
          "bg-slate-300"
        )}
        style={{ width: `${weight * 100 * 2.5}%` }}
      />
    </div>
    <span className="text-xs text-slate-500 w-16 text-right">
      {weight >= 0.35 ? 'Critical' : weight >= 0.25 ? 'Important' : weight >= 0.15 ? 'Moderate' : 'Minor'}
    </span>
  </div>
);

// Top pick card (expanded)
const TopPickCard = ({ 
  prediction, 
  rank,
  onTap 
}: { 
  prediction: PlayerPrediction; 
  rank: number;
  onTap: () => void;
}) => {
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const medalColors: Record<number, string> = {
    1: 'from-amber-50 to-yellow-50 border-amber-200',
    2: 'from-slate-50 to-slate-100 border-slate-200',
    3: 'from-orange-50 to-amber-50 border-orange-200',
  };
  
  return (
    <motion.button
      onClick={onTap}
      className={cn(
        "w-full p-4 rounded-2xl text-left transition-all",
        "bg-gradient-to-br border shadow-sm",
        medalColors[rank] || 'from-white to-slate-50 border-slate-100'
      )}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring" as const, stiffness: 400, damping: 30, delay: rank * 0.1 }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl">{medals[rank] || `#${rank}`}</div>
        
        <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-offset-2 ring-white shadow-md flex-shrink-0">
          {(() => {
            const photoUrl = getR2HeadshotUrlMultiTour(prediction.playerName);
            return photoUrl ? (
              <img src={photoUrl} alt={prediction.playerName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                {prediction.playerName.split(' ').map(n => n[0]).join('')}
              </div>
            );
          })()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 truncate">{prediction.playerName}</h3>
            <CountryFlag country={prediction.country} size="sm" />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">World #{prediction.worldRank}</span>
            {prediction.momentum > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-medium">
                <TrendingUp className="w-3 h-3" />
                +{prediction.momentum}
              </span>
            )}
          </div>
        </div>
        
        <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
      </div>
      
      {/* Probability bar */}
      <ProbabilityBar probability={prediction.winProbability} rank={rank} />
      
      {/* Reasons */}
      {prediction.reasons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-700 mb-2">Why {prediction.playerName.split(' ').pop()} wins:</p>
          <div className="space-y-1">
            {prediction.reasons.map((reason, i) => (
              <ReasonChip key={i} reason={reason} />
            ))}
          </div>
        </div>
      )}
      
      {/* Concern (if any) */}
      {prediction.concerns.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
          <span>⚠️</span>
          <span>Watch for: {prediction.concerns[0]}</span>
        </div>
      )}
    </motion.button>
  );
};

// Compact pick row
const CompactPickRow = ({ 
  prediction, 
  rank,
  onTap 
}: { 
  prediction: PlayerPrediction; 
  rank: number;
  onTap: () => void;
}) => (
  <motion.button
    onClick={onTap}
    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all"
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ type: "spring" as const, stiffness: 400, damping: 30, delay: 0.3 + rank * 0.05 }}
  >
    <span className="w-6 text-center text-sm font-bold text-slate-400">#{rank}</span>
    
    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
      {(() => {
        const photoUrl = getR2HeadshotUrlMultiTour(prediction.playerName);
        return photoUrl ? (
          <img src={photoUrl} alt={prediction.playerName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
            {prediction.playerName.split(' ').map(n => n[0]).join('')}
          </div>
        );
      })()}
    </div>
    
    <div className="flex-1 min-w-0 text-left">
      <p className="font-semibold text-slate-900 truncate">{prediction.playerName}</p>
      <p className="text-xs text-slate-500">World #{prediction.worldRank}</p>
    </div>
    
    <div className="text-right">
      <p className="text-sm font-bold text-emerald-600">{prediction.winProbability}%</p>
    </div>
    
    <ChevronRight className="w-4 h-4 text-slate-300" />
  </motion.button>
);

// Dark horse card
const DarkHorseCard = ({ 
  darkHorse,
  onTap 
}: { 
  darkHorse: DarkHorse;
  onTap: () => void;
}) => (
  <motion.button
    onClick={onTap}
    className="flex-shrink-0 w-[200px] p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100"
    whileTap={{ scale: 0.98 }}
  >
    <div className="flex items-center gap-2 mb-2">
      <span className="text-lg">{darkHorse.icon}</span>
      <span className="text-xs font-semibold text-purple-600">DARK HORSE</span>
    </div>
    
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex-shrink-0">
        {(() => {
          const photoUrl = getR2HeadshotUrlMultiTour(darkHorse.player.playerName);
          return photoUrl ? (
            <img src={photoUrl} alt={darkHorse.player.playerName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs font-bold">
              {darkHorse.player.playerName.split(' ').map(n => n[0]).join('')}
            </div>
          );
        })()}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="font-semibold text-slate-900 text-sm truncate">{darkHorse.player.playerName}</p>
        <p className="text-xs text-slate-500">#{darkHorse.player.worldRank}</p>
      </div>
    </div>
    
    <p className="text-xs text-purple-600 mt-2 truncate">{darkHorse.reason}</p>
  </motion.button>
);

// Course Profile Section
const CourseProfileSection = ({ courseProfile }: { courseProfile: CourseProfile }) => {
  const archetypeStyle = ARCHETYPE_STYLES[courseProfile.archetype] || ARCHETYPE_STYLES.balanced;
  
  return (
    <div className={cn("mx-4 mb-5 p-4 rounded-2xl", archetypeStyle.bg)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{archetypeStyle.icon}</span>
        <span className={cn("text-sm font-bold uppercase", archetypeStyle.text)}>
          {courseProfile.label}
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-4">{courseProfile.description}</p>
      
      <p className="text-xs font-semibold text-slate-500 mb-2">WHAT IT TAKES TO WIN HERE</p>
      <div className="space-y-2">
        <StatWeightBar label="Distance" weight={courseProfile.statWeights.distance} icon="💪" />
        <StatWeightBar label="Accuracy" weight={courseProfile.statWeights.accuracy} icon="🎯" />
        <StatWeightBar label="Scrambling" weight={courseProfile.statWeights.scrambling} icon="🛡️" />
        <StatWeightBar label="Putting" weight={courseProfile.statWeights.putting} icon="🕳️" />
      </div>
    </div>
  );
};

// Loading skeleton
const PredictionsSkeleton = () => (
  <section className="py-6 border-t border-slate-100">
    <div className="px-4">
      <div className="h-8 w-48 bg-slate-100 rounded animate-pulse mb-4" />
      <div className="h-40 bg-slate-100 rounded-2xl animate-pulse mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
        ))}
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
  const top3 = predictions.slice(0, 3);
  const rest = predictions.slice(3, showAll ? 10 : 5);
  
  const handlePlayerTap = (playerId: string) => {
    navigate(`/tourhub/player/${playerId}`);
  };
  
  return (
    <section className="py-6 border-t border-slate-100">
      {/* Header */}
      <div className="px-4 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🔮</span>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            AI Predictions
          </p>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Who's Taking This?</h2>
      </div>
      
      {/* Tournament Card */}
      <div className="mx-4 mb-5 p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">
            {new Date(tournament.startDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })} - {new Date(tournament.endDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>
        
        <h3 className="text-lg font-bold mb-1">{tournament.name}</h3>
        
        <div className="flex items-center gap-1.5 text-sm text-slate-300 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{tournament.venueName}</span>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>{tournament.purseFormatted}</span>
          <span>•</span>
          <span>Par {tournament.par}</span>
          <span>•</span>
          <span>{tournament.yardage.toLocaleString()} yds</span>
        </div>
      </div>
      
      {/* Course Profile */}
      <CourseProfileSection courseProfile={courseProfile} />
      
      {/* Top 3 Picks */}
      <div className="px-4 mb-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3">TOP PICKS</h3>
        <div className="space-y-3">
          {top3.map((prediction, index) => (
            <TopPickCard
              key={prediction.playerId}
              prediction={prediction}
              rank={index + 1}
              onTap={() => handlePlayerTap(prediction.playerId)}
            />
          ))}
        </div>
      </div>
      
      {/* Rest of top 10 */}
      {rest.length > 0 && (
        <div className="px-4 mb-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">CONTENDERS</h3>
          <div className="space-y-2">
            {rest.map((prediction, index) => (
              <CompactPickRow
                key={prediction.playerId}
                prediction={prediction}
                rank={index + 4}
                onTap={() => handlePlayerTap(prediction.playerId)}
              />
            ))}
          </div>
          
          {!showAll && predictions.length > 5 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full mt-3 py-2.5 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl active:scale-[0.98] transition-transform"
            >
              Show More Picks
            </button>
          )}
        </div>
      )}
      
      {/* Dark Horses */}
      {darkHorses.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3 px-4">🐴 DARK HORSES</h3>
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
            {darkHorses.map((dh) => (
              <DarkHorseCard
                key={dh.player.playerId}
                darkHorse={dh}
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
