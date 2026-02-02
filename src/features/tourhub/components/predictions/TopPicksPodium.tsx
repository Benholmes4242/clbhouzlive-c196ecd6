/**
 * TopPicksPodium - #1 tall card on left, #2/#3 stacked on right
 * All cards use the same internal layout (photo + info below)
 * Only #1 shows "Why he wins" reasons
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
}

interface TopPicksPodiumProps {
  picks: TopPick[];
}

const MEDAL_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const MEDAL_GRADIENTS: Record<number, string> = {
  1: 'from-amber-50 to-yellow-100',
  2: 'from-slate-50 to-slate-100',
  3: 'from-orange-50 to-amber-100',
};

// Portrait card - same internal layout for all picks
const PortraitCard = ({ 
  pick, 
  showReasons,
  photoHeight = 'h-28',
  className = ''
}: { 
  pick: TopPick; 
  showReasons: boolean;
  photoHeight?: string;
  className?: string;
}) => {
  const navigate = useNavigate();
  const photoUrl = resolvePhotoUrl(pick.photoUrl, pick.pgaTourId);

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/player/${pick.playerId}`)}
      className={cn(
        "bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-left flex flex-col",
        className
      )}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: pick.rank * 0.1 }}
    >
      {/* Photo area with gradient background */}
      <div className={cn(
        "relative bg-gradient-to-b flex-shrink-0",
        photoHeight,
        MEDAL_GRADIENTS[pick.rank] || 'from-gray-50 to-gray-100'
      )}>
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
        <div className={cn(
          "absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md",
          pick.rank === 1 ? "bg-gradient-to-br from-amber-400 to-yellow-500" :
          pick.rank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-400" :
          "bg-gradient-to-br from-orange-400 to-amber-500"
        )}>
          <span className="text-sm">{MEDAL_EMOJI[pick.rank]}</span>
        </div>
      </div>

      {/* Content below photo */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Name + Flag */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <h4 className="font-bold text-slate-900 text-sm truncate">{pick.playerName}</h4>
          <CountryFlag country={pick.country} size="sm" />
        </div>
        
        {/* World rank + Momentum */}
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

        {/* Reasons - only for #1 */}
        {showReasons && pick.reasons && pick.reasons.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
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
        {/* #1 - Tall portrait card */}
        {first && (
          <PortraitCard 
            pick={first} 
            showReasons={true}
            photoHeight="h-28"
            className="flex-1"
          />
        )}

        {/* #2 and #3 - Stacked vertically */}
        <div className="flex flex-col gap-2 w-[45%]">
          {second && (
            <PortraitCard 
              pick={second} 
              showReasons={false}
              photoHeight="h-16"
              className="flex-1"
            />
          )}
          {third && (
            <PortraitCard 
              pick={third} 
              showReasons={false}
              photoHeight="h-16"
              className="flex-1"
            />
          )}
        </div>
      </div>
    </div>
  );
};
