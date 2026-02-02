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

// Rank badge component with colored circles instead of emojis
const RankBadge = ({ rank, size = 'md' }: { rank: 1 | 2 | 3; size?: 'sm' | 'md' }) => {
  const config = {
    1: 'bg-gradient-to-br from-amber-400 to-yellow-500',
    2: 'bg-gradient-to-br from-slate-300 to-slate-400',
    3: 'bg-gradient-to-br from-orange-400 to-amber-500',
  };
  
  const sizeClasses = size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-xs';
  
  return (
    <div className={cn("rounded-full flex items-center justify-center shadow-sm", config[rank], sizeClasses)}>
      <span className="font-bold text-white drop-shadow-sm">{rank}</span>
    </div>
  );
};

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
      {/* Photo area - increased height */}
      <div className="relative h-36 bg-gray-50 flex-shrink-0">
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
        <div className="absolute top-2 left-2">
          <RankBadge rank={1} />
        </div>
      </div>

      {/* Content below photo */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Top meta - proper spacing */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="font-bold text-slate-900 text-base leading-normal truncate">{pick.playerName}</h4>
            <p className="text-xs text-slate-500 leading-normal">World #{pick.worldRanking}</p>
          </div>
          <CountryFlag country={pick.country} size="sm" />
        </div>

        {/* Win probability bar */}
        <div className="flex items-center gap-2 mb-3">
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

        {/* Why He Wins - more breathing room */}
        {pick.reasons && pick.reasons.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 leading-normal">
              Why he wins
            </p>
            <div className="space-y-1">
              {pick.reasons.slice(0, 3).map((reason, i) => (
                <p key={i} className="text-xs text-slate-600 leading-normal">
                  <span className="text-amber-500">•</span> {reason}
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
      {/* Photo area - reduced height */}
      <div className="relative h-16 flex-shrink-0 overflow-hidden bg-gray-50">
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={pick.playerName} 
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center 15%' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg font-bold">
            {pick.playerName.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        {/* Rank badge */}
        <div className="absolute top-1.5 left-1.5">
          <RankBadge rank={pick.rank as 2 | 3} size="sm" />
        </div>
      </div>

      {/* Content below photo - fixed compact height */}
      <div className="px-2 py-1.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-900 text-sm leading-tight truncate">{pick.playerName}</h4>
          <CountryFlag country={pick.country} size="sm" />
        </div>
        
        {/* Win probability bar + percentage */}
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
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
          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight truncate">
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
