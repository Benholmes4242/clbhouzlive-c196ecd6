/**
 * TopPicksPodium - Uniform portrait cards for top 3 predictions
 * All 3 cards use the same layout (photo + info below)
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

// Unified portrait card - same layout for all 3 picks
const PortraitCard = ({ pick, showReasons }: { pick: TopPick; showReasons: boolean }) => {
  const navigate = useNavigate();
  const photoUrl = resolvePhotoUrl(pick.photoUrl, pick.pgaTourId);

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/player/${pick.playerId}`)}
      className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-left flex flex-col min-w-0"
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: pick.rank * 0.1 }}
    >
      {/* Photo area with gradient background */}
      <div className={cn(
        "relative h-24 bg-gradient-to-b flex-shrink-0",
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
      <div className="p-2.5 flex-1 flex flex-col">
        {/* Name + Flag */}
        <div className="flex items-center gap-1 mb-0.5">
          <h4 className="font-bold text-slate-900 text-xs truncate">{pick.playerName}</h4>
          <CountryFlag country={pick.country} size="sm" />
        </div>
        
        {/* World rank + Momentum */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1.5">
          <span>World #{pick.worldRanking}</span>
          {pick.momentum && pick.momentum > 0 && (
            <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
              <TrendingUp className="w-2.5 h-2.5" />
              +{pick.momentum}
            </span>
          )}
        </div>

        {/* Win probability bar */}
        <div className="flex items-center gap-1.5">
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

        {/* Reasons - only for #1 */}
        {showReasons && pick.reasons && pick.reasons.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Why he wins
            </p>
            <div className="space-y-0.5">
              {pick.reasons.slice(0, 2).map((reason, i) => (
                <p key={i} className="text-[10px] text-slate-600 flex items-start gap-1">
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

  return (
    <div className="px-4">
      {/* Section header */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
        Top Picks
      </h3>

      {/* 3-column layout - all cards same style */}
      <div className="flex gap-2 items-stretch">
        {picks.slice(0, 3).map((pick, i) => (
          <PortraitCard 
            key={pick.playerId} 
            pick={pick} 
            showReasons={i === 0} // Only #1 gets reasons
          />
        ))}
      </div>
    </div>
  );
};
