/**
 * TopPicksPodium - Compact display for top 3 predictions
 * #1 gets portrait treatment, #2 and #3 are stacked compact rows
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
const MEDAL_COLORS: Record<number, string> = {
  1: 'from-amber-50 to-yellow-50 border-amber-200 shadow-amber-100/50',
  2: 'from-slate-50 to-slate-100 border-slate-200 shadow-slate-100/50',
  3: 'from-orange-50 to-amber-50 border-orange-200 shadow-orange-100/50',
};

// Featured #1 card
const FeaturedPick = ({ pick }: { pick: TopPick }) => {
  const navigate = useNavigate();
  const photoUrl = resolvePhotoUrl(pick.photoUrl, pick.pgaTourId);

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/player/${pick.playerId}`)}
      className={cn(
        "w-full p-4 rounded-2xl text-left transition-all",
        "bg-gradient-to-br border shadow-lg",
        MEDAL_COLORS[1]
      )}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="flex items-start gap-3">
        {/* Medal */}
        <div className="text-2xl">{MEDAL_EMOJI[1]}</div>

        {/* Photo */}
        <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-amber-300 ring-offset-2 ring-offset-amber-50 shadow-md flex-shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt={pick.playerName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
              {pick.playerName.split(' ').map(n => n[0]).join('')}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-slate-900 truncate">{pick.playerName}</h3>
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

          {/* Win probability */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pick.winProbability * 3, 100)}%` }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
            </div>
            <span className="text-sm font-bold text-amber-600">{pick.winProbability}%</span>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-amber-300 flex-shrink-0 mt-5" />
      </div>

      {/* Reasons (only for #1) */}
      {pick.reasons && pick.reasons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-100">
          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5">
            Why {pick.playerName.split(' ').pop()} wins
          </p>
          <div className="space-y-1">
            {pick.reasons.slice(0, 2).map((reason, i) => (
              <p key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                <span className="text-amber-500">•</span>
                <span>{reason}</span>
              </p>
            ))}
          </div>
        </div>
      )}
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
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
        "bg-gradient-to-br border shadow-sm hover:shadow-md",
        MEDAL_COLORS[pick.rank]
      )}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <span className="text-lg">{MEDAL_EMOJI[pick.rank]}</span>

      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
        {photoUrl ? (
          <img src={photoUrl} alt={pick.playerName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
            {pick.playerName.split(' ').map(n => n[0]).join('')}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-slate-900 truncate text-sm">{pick.playerName}</p>
          <CountryFlag country={pick.country} size="sm" />
        </div>
        <p className="text-xs text-slate-500">World #{pick.worldRanking}</p>
      </div>

      <div className="text-right">
        <p className="text-sm font-bold text-emerald-600">{pick.winProbability}%</p>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-300" />
    </motion.button>
  );
};

export const TopPicksPodium = ({ picks }: TopPicksPodiumProps) => {
  if (!picks || picks.length === 0) return null;

  const [first, ...rest] = picks;

  return (
    <div className="px-4 space-y-3">
      {/* Section header */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Top Picks
      </h3>

      {/* Featured #1 */}
      {first && <FeaturedPick pick={first} />}

      {/* #2 and #3 stacked */}
      <div className="space-y-2">
        {rest.slice(0, 2).map((pick, i) => (
          <CompactPick key={pick.playerId} pick={pick} delay={0.2 + i * 0.1} />
        ))}
      </div>
    </div>
  );
};
