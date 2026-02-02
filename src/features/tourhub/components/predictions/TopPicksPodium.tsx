/**
 * TopPicksPodium - #1 tall card on left, #2/#3 compact stacked on right
 * Uses colored circle badges instead of emojis, tighter spacing
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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

// Rank badge component - colored circles instead of emojis
const RankBadge = ({ rank, size = 'md' }: { rank: number; size?: 'sm' | 'md' }) => {
  const bgColors: Record<number, string> = {
    1: 'bg-amber-400',
    2: 'bg-gray-300',
    3: 'bg-orange-400',
  };
  
  const sizeClasses = size === 'sm' 
    ? 'w-5 h-5 text-[10px]' 
    : 'w-6 h-6 text-xs';

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center shadow-sm",
      bgColors[rank] || 'bg-gray-200',
      sizeClasses
    )}>
      <span className="font-bold text-white">{rank}</span>
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
      {/* Photo area */}
      <div className="relative h-28 bg-gradient-to-b from-amber-50 to-yellow-100 flex-shrink-0">
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={pick.playerName} 
            className="w-full h-full object-cover object-top" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">
            {pick.playerName.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        
        {/* Rank badge */}
        <div className="absolute top-2 left-2">
          <RankBadge rank={1} />
        </div>
      </div>

      {/* Content below photo - tightened spacing */}
      <div className="p-3 flex-1 flex flex-col space-y-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-gray-900 text-sm truncate">{pick.playerName}</h4>
            <CountryFlag country={pick.country} size="sm" />
          </div>
          <p className="text-sm text-gray-500">World #{pick.worldRanking}</p>
        </div>

        {/* Win probability bar */}
        <div className="flex items-center gap-2">
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

        {/* Reasons - compact */}
        {pick.reasons && pick.reasons.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Why he wins:</p>
            <ul className="space-y-0.5">
              {pick.reasons.slice(0, 2).map((reason, i) => (
                <li key={i} className="text-xs text-gray-600">• {reason}</li>
              ))}
            </ul>
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
        pick.rank === 2 ? "bg-gradient-to-br from-gray-100 to-gray-200" : "bg-gradient-to-br from-orange-50 to-amber-100"
      )}>
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={pick.playerName} 
            className="w-full h-full object-cover object-top"
            style={{ objectPosition: 'center 20%' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
            {pick.playerName.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        {/* Rank badge */}
        <div className="absolute top-1.5 left-1.5">
          <RankBadge rank={pick.rank} size="sm" />
        </div>
      </div>

      {/* Content below photo - with key stat */}
      <div className="p-2.5 flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-gray-900 text-xs truncate">{pick.playerName}</h4>
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
    <div>
      {/* Section header */}
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
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
