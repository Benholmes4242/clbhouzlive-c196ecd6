/**
 * PredictionsSection - "Who's Taking This?" AI Predictions
 * 
 * Design: Flat section with accordion rows, no cards
 * Per redesign brief: Expandable rows with dark horse tiles
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNextTournamentPredictions, type PlayerPrediction, type DarkHorse } from '../../hooks/useTournamentPredictions';
import { ChevronDown, ChevronRight, TrendingUp, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import CountryFlag from '@/components/ui/country-flag';

/** Expandable prediction row */
const PredictionRow = ({ 
  prediction, 
  rank,
  isExpanded,
  onToggle,
  onPlayerTap,
}: { 
  prediction: PlayerPrediction; 
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
  onPlayerTap: () => void;
}) => {
  // Rank 1 gets amber accent, others get emerald
  const isTopPick = rank === 1;
  const barColor = isTopPick ? 'bg-amber-500' : 'bg-emerald-500';
  
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      {/* Main Row */}
      <button
        onClick={onToggle}
        className="w-full py-4 flex items-center gap-4 text-left px-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
      >
        {/* Rank */}
        <span className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
          isTopPick 
            ? "bg-amber-500 text-white" 
            : "bg-slate-100 text-slate-600"
        )}>
          {rank}
        </span>
        
        {/* Player Photo */}
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-100">
          {prediction.photoUrl ? (
            <img 
              src={prediction.photoUrl} 
              alt={prediction.playerName} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
              {prediction.playerName.split(' ').map(n => n[0]).join('')}
            </div>
          )}
        </div>
        
        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[15px] text-slate-900 truncate">
              {prediction.playerName}
            </span>
            <CountryFlag country={prediction.country} size="sm" />
          </div>
          
          {/* Probability Bar - Thin */}
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
              <div 
                className={cn("h-full rounded-full", barColor)}
                style={{ width: `${Math.min(prediction.winProbability * 2.5, 100)}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Win Probability */}
        <span className="text-sm font-bold text-slate-700 font-mono flex-shrink-0">
          {prediction.winProbability}%
        </span>
        
        {/* Expand Chevron */}
        <ChevronDown className={cn(
          "w-4 h-4 text-slate-300 transition-transform flex-shrink-0",
          isExpanded && "rotate-180"
        )} />
      </button>
      
      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-[72px]">
              {/* Why they win */}
              {prediction.reasons.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-500 mb-2">
                    Why {prediction.playerName.split(' ').pop()} wins:
                  </p>
                  <div className="space-y-1.5">
                    {prediction.reasons.map((reason, i) => (
                      <div key={i} className="flex items-center gap-2 text-[13px] text-slate-600">
                        <span>{reason.icon}</span>
                        <span>{reason.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Additional info */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>World #{prediction.worldRank}</span>
                {prediction.momentum > 0 && (
                  <span className="flex items-center gap-0.5 text-emerald-600">
                    <TrendingUp className="w-3 h-3" />
                    +{prediction.momentum} this month
                  </span>
                )}
              </div>
              
              {/* View Profile Link */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayerTap();
                }}
                className="mt-3 text-sm font-medium text-emerald-600 flex items-center gap-1"
              >
                View Profile
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Dark horse tile */
const DarkHorseTile = ({ 
  darkHorse,
  onTap 
}: { 
  darkHorse: DarkHorse;
  onTap: () => void;
}) => (
  <button
    onClick={onTap}
    className="flex-shrink-0 bg-slate-50 rounded-lg p-3 w-[180px] text-left hover:bg-slate-100 transition-colors"
  >
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
        {darkHorse.player.photoUrl ? (
          <img 
            src={darkHorse.player.photoUrl} 
            alt={darkHorse.player.playerName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
            {darkHorse.player.playerName.split(' ').map(n => n[0]).join('')}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-slate-900 truncate">
          {darkHorse.player.playerName}
        </p>
        <p className="text-[11px] text-slate-500">#{darkHorse.player.worldRank}</p>
      </div>
    </div>
    <p className="text-[12px] text-slate-600 line-clamp-2">{darkHorse.reason}</p>
  </button>
);

/** Loading skeleton */
const PredictionsSkeleton = () => (
  <section className="py-8">
    <div className="px-4 mb-4">
      <div className="h-6 w-48 bg-slate-100 rounded animate-pulse mb-2" />
      <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
    </div>
    <div className="divide-y divide-slate-100">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="px-4 py-4 flex items-center gap-4">
          <div className="w-6 h-6 rounded-lg bg-slate-100 animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
            <div className="h-1.5 w-24 bg-slate-100 rounded-full animate-pulse" />
          </div>
          <div className="h-4 w-8 bg-slate-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  </section>
);

export function PredictionsSection() {
  const navigate = useNavigate();
  const { data, isLoading } = useNextTournamentPredictions();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  if (isLoading) {
    return <PredictionsSkeleton />;
  }
  
  if (!data) {
    return null;
  }
  
  const { tournament, predictions, darkHorses } = data;
  const displayPredictions = predictions.slice(0, 10);
  
  const handleToggle = (playerId: string) => {
    setExpandedId(expandedId === playerId ? null : playerId);
  };
  
  const handlePlayerTap = (playerId: string) => {
    navigate(`/tourhub/player/${playerId}`);
  };
  
  return (
    <section className="py-8">
      {/* Header */}
      <div className="px-4 mb-4">
        <h2 className="text-xl font-bold text-slate-900">Who's Taking This?</h2>
        <div className="flex items-center gap-2 mt-1 text-[13px] text-slate-500">
          <span>{tournament.name}</span>
          <span>•</span>
          <span>
            {new Date(tournament.startDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{tournament.venueName}</span>
          </div>
        </div>
      </div>
      
      {/* Prediction Rows */}
      <div className="divide-y divide-slate-100">
        {displayPredictions.map((prediction, index) => (
          <PredictionRow
            key={prediction.playerId}
            prediction={prediction}
            rank={index + 1}
            isExpanded={expandedId === prediction.playerId}
            onToggle={() => handleToggle(prediction.playerId)}
            onPlayerTap={() => handlePlayerTap(prediction.playerId)}
          />
        ))}
      </div>
      
      {/* Dark Horses */}
      {darkHorses.length > 0 && (
        <div className="mt-6">
          <h3 className="px-4 text-sm font-bold text-slate-700 mb-3">Dark Horses</h3>
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
            {darkHorses.slice(0, 4).map((dh) => (
              <DarkHorseTile
                key={dh.player.playerId}
                darkHorse={dh}
                onTap={() => handlePlayerTap(dh.player.playerId)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Disclaimer */}
      <p className="px-4 mt-6 text-[11px] text-slate-400 text-center">
        Predictions based on statistical analysis. For entertainment purposes only.
      </p>
      
      {/* Bottom divider */}
      <div className="h-px bg-slate-100 mt-6" />
    </section>
  );
}

export default PredictionsSection;
