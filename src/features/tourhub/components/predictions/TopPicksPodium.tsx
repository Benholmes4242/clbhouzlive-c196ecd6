/**
 * TopPicksPodium - Side-by-side layout for top 3 predictions
 * #1 gets tall portrait treatment (~55% width), #2/#3 stacked on right (~45%)
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp } from 'lucide-react';
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

// Featured #1 - Tall portrait card
const FeaturedPick = ({ pick }: { pick: TopPick }) => {
  const navigate = useNavigate();
  const photoUrl = resolvePhotoUrl(pick.photoUrl, pick.pgaTourId);

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/player/${pick.playerId}`)}
      className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-left"
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {/* Photo area */}
      <div className="relative h-28 bg-gradient-to-b from-amber-50 to-amber-100">
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={pick.playerName} 
            className="w-full h-full object-cover object-top" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
            {pick.playerName.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        
        {/* Gold rank badge */}
        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
          <span className="text-lg">{MEDAL_EMOJI[1]}</span>
        </div>
        
        {/* Probability badge */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
          <span className="text-xs font-bold text-white">{pick.winProbability}%</span>
        </div>
      </div>

      {/* Content below photo */}
      <div className="p-3">
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
        <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pick.winProbability * 3, 100)}%` }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        </div>

        {/* Reasons */}
        {pick.reasons && pick.reasons.length > 0 && (
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Why he wins
            </p>
            <div className="space-y-0.5">
              {pick.reasons.slice(0, 2).map((reason, i) => (
                <p key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                  <span className="text-amber-500 mt-0.5">•</span>
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

// Compact row for #2 and #3
const CompactPick = ({ pick, delay }: { pick: TopPick; delay: number }) => {
  const navigate = useNavigate();
  const photoUrl = resolvePhotoUrl(pick.photoUrl, pick.pgaTourId);

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/player/${pick.playerId}`)}
      className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-gray-200 shadow-sm text-left w-full"
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {/* Medal + Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100">
          {photoUrl ? (
            <img src={photoUrl} alt={pick.playerName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
              {pick.playerName.split(' ').map(n => n[0]).join('')}
            </div>
          )}
        </div>
        <div className="absolute -top-1 -left-1 text-sm">{MEDAL_EMOJI[pick.rank]}</div>
      </div>

      {/* Name + World rank */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{pick.playerName}</p>
        <p className="text-[11px] text-slate-500">World #{pick.worldRanking}</p>
      </div>

      {/* Probability */}
      <span className="text-sm font-bold text-emerald-600">{pick.winProbability}%</span>
      
      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
    </motion.button>
  );
};

export const TopPicksPodium = ({ picks }: TopPicksPodiumProps) => {
  if (!picks || picks.length === 0) return null;

  const [first, ...rest] = picks;

  return (
    <div className="px-4">
      {/* Section header */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
        Top Picks
      </h3>

      {/* Side-by-side layout */}
      <div className="flex gap-3">
        {/* LEFT: #1 Pick - Tall portrait card (~55% width) */}
        {first && <FeaturedPick pick={first} />}

        {/* RIGHT: #2 and #3 - Stacked vertically (~45% width) */}
        <div className="flex flex-col gap-2 w-[45%]">
          {rest.slice(0, 2).map((pick, i) => (
            <CompactPick key={pick.playerId} pick={pick} delay={0.2 + i * 0.1} />
          ))}
        </div>
      </div>
    </div>
  );
};
