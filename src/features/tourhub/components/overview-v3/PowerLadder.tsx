/**
 * PowerLadder - Vertical Leaderboard with Sticky Segments
 * 
 * Design: Flat list with segment tabs (Elite/Champions/Contenders)
 * Per redesign brief: No card wrapper, editorial table layout
 */

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  usePowerLadder, 
  TIER_CONFIG, 
  type PowerTier, 
  type PowerLadderPlayer,
} from '../../hooks/usePowerLadder';
import { cn } from '@/lib/utils';

// Segment tabs configuration - simplified to 3 tiers per brief
const SEGMENT_TABS: { tier: PowerTier; label: string; range: string }[] = [
  { tier: 'elite', label: 'Elite', range: '#1-10' },
  { tier: 'champions', label: 'Champions', range: '#11-50' },
  { tier: 'contenders', label: 'Contenders', range: '#51-100' },
];

/** Movement indicator */
const MovementIndicator = memo(({ 
  direction, 
  magnitude 
}: { 
  direction: 'up' | 'down' | 'flat'; 
  magnitude: number;
}) => {
  if (direction === 'flat' || magnitude === 0) {
    return (
      <span className="text-slate-300 text-xs font-medium">—</span>
    );
  }

  const isUp = direction === 'up';
  return (
    <span className={cn(
      "text-xs font-semibold",
      isUp ? "text-emerald-600" : "text-red-500"
    )}>
      {isUp ? '↑' : '↓'}{magnitude}
    </span>
  );
});

MovementIndicator.displayName = 'MovementIndicator';

/** Player row */
const PlayerRow = memo(({ 
  player, 
  index,
  onTap,
}: { 
  player: PowerLadderPlayer; 
  index: number;
  onTap: () => void;
}) => {
  const isTop3 = player.rank <= 3;
  const config = TIER_CONFIG[player.tier];

  return (
    <motion.button
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.15 }}
      onClick={onTap}
    >
      {/* Rank */}
      <div className={cn(
        "w-8 text-center text-sm font-bold",
        isTop3 && player.rank === 1 && "text-amber-500",
        isTop3 && player.rank === 2 && "text-slate-400",
        isTop3 && player.rank === 3 && "text-amber-600",
        !isTop3 && "text-slate-600"
      )}>
        {player.rank}
      </div>

      {/* Movement */}
      <div className="w-8 text-center">
        <MovementIndicator 
          direction={player.movementDirection} 
          magnitude={player.movementMagnitude} 
        />
      </div>

      {/* Player Photo */}
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-100">
        {player.player.photoUrl ? (
          <img
            src={player.player.photoUrl}
            alt={player.player.fullName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
            {player.player.firstName.charAt(0)}{player.player.lastName.charAt(0)}
          </div>
        )}
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0 text-left">
        <span className="font-semibold text-[15px] text-slate-900 truncate block">
          {player.player.fullName}
        </span>
        <span className="text-xs text-slate-500">
          {player.player.country?.slice(0, 3).toUpperCase()}
        </span>
      </div>

      {/* Points */}
      <div className="text-right flex-shrink-0">
        <span className="text-sm font-bold text-slate-700 font-mono">
          {player.avgPoints.toFixed(2)}
        </span>
        <span className="text-[10px] text-slate-400 ml-1">pts</span>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
    </motion.button>
  );
});

PlayerRow.displayName = 'PlayerRow';

/** Loading skeleton */
const PowerLadderSkeleton = () => (
  <div className="divide-y divide-slate-100">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-8 h-4 bg-slate-100 rounded animate-pulse" />
        <div className="w-8 h-4 bg-slate-100 rounded animate-pulse" />
        <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-12 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="w-14 h-4 bg-slate-100 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

export function PowerLadder() {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<PowerTier>('elite');
  
  const { data, isLoading, error } = usePowerLadder({ tier: selectedTier, limit: 10 });

  const handlePlayerTap = (playerId: string) => {
    navigate(`/tourhub/player/${playerId}`);
  };

  return (
    <section className="py-8">
      {/* Header */}
      <div className="px-4 mb-4">
        <h2 className="text-xl font-bold text-slate-900">Power Ladder</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">Official World Golf Ranking</p>
      </div>

      {/* Segment Tabs - Sticky style */}
      <div className="px-4 mb-4">
        <div className="inline-flex p-1 bg-slate-100 rounded-lg">
          {SEGMENT_TABS.map(({ tier, label }) => {
            const isSelected = selectedTier === tier;
            
            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all min-h-[40px]",
                  isSelected 
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center gap-3 px-4 py-2 text-[10px] uppercase tracking-wide text-slate-400 font-semibold border-b border-slate-200">
        <div className="w-8 text-center">Rank</div>
        <div className="w-8 text-center">+/-</div>
        <div className="w-10" /> {/* Photo spacer */}
        <div className="flex-1">Player</div>
        <div className="w-14 text-right">Avg Pts</div>
        <div className="w-4" /> {/* Chevron spacer */}
      </div>

      {/* Player List */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <PowerLadderSkeleton />
        ) : error ? (
          <div className="py-12 text-center text-red-500 text-sm">
            Failed to load rankings
          </div>
        ) : !data?.players.length ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No players in this tier
          </div>
        ) : (
          <motion.div
            key={selectedTier}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="divide-y divide-slate-100"
          >
            {data.players.map((player, index) => (
              <PlayerRow
                key={player.id}
                player={player}
                index={index}
                onTap={() => handlePlayerTap(player.player.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* View All Link */}
      {data && data.players.length > 0 && (
        <div className="px-4 mt-4">
          <button
            onClick={() => navigate('/leaderboards?tab=rankings')}
            className="w-full py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1"
          >
            View Full Rankings
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Bottom divider */}
      <div className="h-px bg-slate-100 mt-4" />
    </section>
  );
}

export default PowerLadder;
