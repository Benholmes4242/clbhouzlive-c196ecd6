/**
 * TopPicksPodium - #1 tall card on left, #2/#3 compact stacked on right
 * #1 uses portrait layout, #2/#3 use compact horizontal layout with key stats
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import CountryFlag from '@/components/ui/country-flag';

interface TopPick {
  rank: number;
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  pgaTourId: string | null;
  country: string;
  worldRanking: number;
  winProbability: number;
  momentum?: number;
  reasons?: string[];
  topStat?: string;
}

interface TopPicksPodiumProps {
  picks: TopPick[];
}

const MEDAL_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

// Featured card (#1) - portrait layout with photo on top
const FeaturedCard = ({ pick }: { pick: TopPick }) => {
  const navigate = useNavigate();
  const photoUrl = resolvePhotoUrl(pick.photoUrl, pick.pgaTourId);

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/player/${pick.playerId}`)}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-left flex flex-col flex-1"
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {/* Photo area */}
      <div className="relative h-28 bg-gradient-to-b from-amber-50 to-yellow-100 flex-shrink-0">
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={pick.playerName} 
            className="w-full h-full object-cover object-top" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xl font-bold">
            {pick.playerName.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        
        {/* Rank badge */}
        <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md">
          <span className="text-sm">🥇</span>
        </div>
      </div>

      {/* Content below photo */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h4 className="font-bold text-slate-900 text-sm truncate">{pick.playerName}</h4>
          <CountryFlag country={pick.country} size="sm" />
        </div>
        
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <span>World #{pick.worldRanking}</span>
          {pick.momentum && pick.momentum > 0 && (
            <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
              <TrendingUp className="w-3 h-3" />
              +{pick.momentum}
            </span>
          )}
        </div>

        {/* Win probability bar */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pick.winProbability * 3, 100)}%` }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
          </div>
          <span className="text-sm font-bold text-emerald-600">{pick.winProbability}%</span>
        </div>

        {/* Reasons - limited to 2 max */}
        {pick.reasons && pick.reasons.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Why he wins
            </p>
            <div className="space-y-1">
              {pick.reasons.slice(0, 2).map((reason, i) => (
                <p key={i} className="text-xs text-slate-600 flex items-start gap-1">
                  <span className="text-amber-500">•</span>
                  <span className="line-clamp-1">{reason}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
};

// Compact card (#2, #3) - smaller with better head cropping and key stat
const CompactCard = ({ pick }: { pick: TopPick }) => {
  const navigate = useNavigate();
  const photoUrl = resolvePhotoUrl(pick.photoUrl, pick.pgaTourId);

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/player/${pick.playerId}`)}
      className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-left flex flex-col"
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: pick.rank * 0.1 }}
    >
      {/* Photo area - reduced height with better object positioning */}
      <div className={cn(
        "relative h-16 flex-shrink-0 overflow-hidden",
        pick.rank === 2 ? "bg-gradient-to-br from-slate-100 to-slate-200" : "bg-gradient-to-br from-orange-50 to-amber-100"
      )}>
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={pick.playerName} 
            className="w-full h-full object-cover object-top"
            style={{ objectPosition: 'center 20%' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg font-bold">
            {pick.playerName.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        {/* Rank badge */}
        <div className={cn(
          "absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs shadow",
          pick.rank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-400" : "bg-gradient-to-br from-orange-400 to-amber-500"
        )}>
          {MEDAL_EMOJI[pick.rank]}
        </div>
      </div>

      {/* Content below photo - with key stat */}
      <div className="p-2.5 flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <h4 className="font-semibold text-slate-900 text-xs truncate">{pick.playerName}</h4>
          </div>
          <CountryFlag country={pick.country} size="sm" />
        </div>
        
        {/* Win probability bar + percentage */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pick.winProbability * 3, 100)}%` }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
          </div>
          <span className="text-xs font-bold text-emerald-600">{pick.winProbability}%</span>
        </div>

        {/* Key stat */}
        {pick.topStat && (
          <p className="text-[10px] text-gray-500 mt-1.5 truncate">
            {pick.topStat}
          </p>
        )}
      </div>
    </motion.button>
  );
};

export const TopPicksPodium = ({ picks }: TopPicksPodiumProps) => {
  if (!picks || picks.length === 0) return null;

  const first = picks[0];
  const second = picks[1];
  const third = picks[2];

  return (
    <div className="px-4">
      {/* Section header */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
        Top Picks
      </h3>

      {/* Layout: #1 tall on left (~55%), #2/#3 stacked on right (~45%) */}
      <div className="flex gap-3 items-stretch">
        {/* #1 - Featured portrait card */}
        {first && <FeaturedCard pick={first} />}

        {/* #2 and #3 - Compact stacked cards */}
        <div className="flex flex-col gap-2 w-[45%]">
          {second && <CompactCard pick={second} />}
          {third && <CompactCard pick={third} />}
        </div>
      </div>
    </div>
  );
};
