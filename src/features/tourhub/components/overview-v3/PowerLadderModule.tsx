/**
 * PowerLadderModule - Gamified World Rankings with Tier System
 * 
 * Features:
 * - 4 tiers: Elite (#1-5), Champions (#6-20), Contenders (#21-75), Chasers (#76-200)
 * - Movement badges showing rank changes
 * - Momentum bars showing recent performance trends
 * - Staggered animations on load
 * - Apple-grade UI design
 */

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, TrendingUp, TrendingDown, Minus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  usePowerLadder, 
  TIER_CONFIG, 
  type PowerTier, 
  type PowerLadderPlayer,
} from '../../hooks/usePowerLadder';
import { cn } from '@/lib/utils';

// Spring physics for animations
const springDefault = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
  mass: 1,
};

const springGentle = {
  type: "spring" as const,
  stiffness: 300,
  damping: 25,
  mass: 1.2,
};

const springSnappy = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
  mass: 0.8,
};

// Tier tabs configuration
const TIER_TABS: { tier: PowerTier; label: string }[] = [
  { tier: 'elite', label: 'Elite' },
  { tier: 'champions', label: 'Champions' },
  { tier: 'contenders', label: 'Contenders' },
  { tier: 'chasers', label: 'Chasers' },
];

/**
 * Movement Badge Component
 */
const MovementBadge = memo(({ 
  direction, 
  magnitude 
}: { 
  direction: 'up' | 'down' | 'flat'; 
  magnitude: number;
}) => {
  if (direction === 'flat' || magnitude === 0) {
    return (
      <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-slate-100 text-slate-500">
        <Minus className="w-3 h-3" />
        <span className="text-xs font-medium">—</span>
      </div>
    );
  }

  const isUp = direction === 'up';
  return (
    <div className={cn(
      "flex items-center gap-0.5 px-2 py-1 rounded-full",
      isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    )}>
      {isUp ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      <span className="text-xs font-semibold">
        {isUp ? '+' : '-'}{magnitude}
      </span>
    </div>
  );
});

MovementBadge.displayName = 'MovementBadge';

/**
 * Momentum Bar Component
 */
const MomentumBar = memo(({ 
  score, 
  tier,
  delay = 0,
}: { 
  score: number; 
  tier: PowerTier;
  delay?: number;
}) => {
  const config = TIER_CONFIG[tier];
  
  return (
    <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
      <motion.div
        className={cn("h-full rounded-full", config.bgClass)}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ ...springGentle, delay: delay + 0.3 }}
      />
    </div>
  );
});

MomentumBar.displayName = 'MomentumBar';

/**
 * Rank Badge Component
 */
const RankBadge = memo(({ 
  rank, 
  tier 
}: { 
  rank: number; 
  tier: PowerTier;
}) => {
  const config = TIER_CONFIG[tier];
  const isTop3 = rank <= 3;
  
  return (
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
      isTop3 
        ? cn(config.bgClass, "text-white shadow-lg", config.shadow)
        : "bg-slate-100 text-slate-700"
    )}>
      {rank}
    </div>
  );
});

RankBadge.displayName = 'RankBadge';

/**
 * Player Row Component
 */
const PlayerRow = memo(({ 
  player, 
  index,
  onTap,
}: { 
  player: PowerLadderPlayer; 
  index: number;
  onTap: () => void;
}) => {
  const config = TIER_CONFIG[player.tier];

  return (
    <motion.button
      className="w-full flex items-center gap-3 px-4 h-[76px] bg-white hover:bg-slate-50 
                 active:scale-[0.98] active:opacity-90 transition-transform duration-100
                 border-b border-slate-100 last:border-b-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springDefault, delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
    >
      {/* Rank Badge */}
      <RankBadge rank={player.rank} tier={player.tier} />

      {/* Player Photo */}
      <div className={cn(
        "w-12 h-12 rounded-full overflow-hidden ring-2 ring-offset-2 flex-shrink-0",
        player.rank <= 3 ? config.bgClass.replace('bg-gradient-to-r', 'ring') : "ring-slate-200"
      )}>
        {player.player.photoUrl ? (
          <img
            src={player.player.photoUrl}
            alt={player.player.fullName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold">
            {player.player.firstName.charAt(0)}{player.player.lastName.charAt(0)}
          </div>
        )}
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 truncate">
            {player.player.fullName}
          </span>
          {player.player.country && (
            <span className="text-xs text-slate-500 uppercase truncate">
              {player.player.country.slice(0, 3)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("text-xs font-medium", config.textClass)}>
            {player.avgPoints.toFixed(2)} pts
          </span>
          <MomentumBar score={player.momentumScore} tier={player.tier} delay={index * 0.05} />
        </div>
      </div>

      {/* Movement Badge */}
      <MovementBadge 
        direction={player.movementDirection} 
        magnitude={player.movementMagnitude} 
      />

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
    </motion.button>
  );
});

PlayerRow.displayName = 'PlayerRow';

/**
 * Skeleton Loader
 */
function PowerLadderSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 h-[76px] border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
          <div className="w-12 h-12 rounded-full bg-slate-100 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="w-12 h-6 bg-slate-100 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty State
 */
function PowerLadderEmpty({ tier }: { tier: PowerTier }) {
  const config = TIER_CONFIG[tier];
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">{config.icon}</div>
      <p className="text-base font-semibold text-slate-900">No players found</p>
      <p className="text-sm text-slate-500 mt-1">
        No players in the {config.label} tier
      </p>
    </div>
  );
}

/**
 * Main Power Ladder Module
 */
export function PowerLadderModule() {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<PowerTier>('elite');
  
  // Fetch data for selected tier with limit of 10
  const { data, isLoading, error } = usePowerLadder({ tier: selectedTier, limit: 10 });

  const handlePlayerTap = (playerId: string) => {
    navigate(`/tourhub/player/${playerId}`);
  };

  const handleViewAll = () => {
    // Navigate to full rankings with tier filter
    navigate('/leaderboards?tab=rankings&tier=' + selectedTier);
  };

  return (
    <section className="py-6">
      {/* Header */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🪜</span>
          <h2 className="text-xl font-bold text-slate-900">Power Ladder</h2>
        </div>
        <p className="text-sm text-slate-500">Who's climbing the ranks this week?</p>
      </div>

      {/* Tier Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {TIER_TABS.map(({ tier, label }) => {
            const config = TIER_CONFIG[tier];
            const isSelected = selectedTier === tier;
            
            return (
              <motion.button
                key={tier}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium",
                  "whitespace-nowrap transition-colors duration-200 min-h-[44px]",
                  isSelected 
                    ? cn(config.bgClass, "text-white shadow-md", config.shadow)
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTier(tier)}
              >
                <span>{config.icon}</span>
                <span>{label}</span>
                {data?.tierCounts && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                  )}>
                    {data.tierCounts[tier]}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Player List */}
      <div className="bg-white rounded-2xl mx-4 overflow-hidden shadow-sm border border-slate-100">
        {isLoading ? (
          <PowerLadderSkeleton />
        ) : error ? (
          <div className="py-12 text-center text-red-500">
            Failed to load rankings
          </div>
        ) : !data?.players.length ? (
          <PowerLadderEmpty tier={selectedTier} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTier}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
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
          </AnimatePresence>
        )}
      </div>

      {/* View All Button */}
      {data && data.players.length > 0 && (
        <div className="px-4 mt-4">
          <motion.button
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                       bg-slate-100 text-slate-700 font-medium text-sm
                       hover:bg-slate-200 active:scale-[0.98] transition-all duration-200 min-h-[44px]"
            whileTap={{ scale: 0.98 }}
            onClick={handleViewAll}
          >
            <Users className="w-4 h-4" />
            <span>View All {TIER_CONFIG[selectedTier].label}</span>
            <span className="text-slate-500">({data.tierCounts[selectedTier]})</span>
          </motion.button>
        </div>
      )}
    </section>
  );
}
