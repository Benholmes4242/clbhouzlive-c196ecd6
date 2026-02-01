/**
 * SkillTreeModule - RPG-style Player Attribute System
 * 
 * Features:
 * - 5 attributes: Power, Precision, Scoring, Recovery, Consistency
 * - Level bars with 10 blocks and staggered animation
 * - Attribute tabs with top 10 leaders per attribute
 * - Apple-grade UI design
 */

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  useSkillTreeLeaders, 
  SKILL_ATTRIBUTES, 
  type SkillAttributeKey,
  type SkillLeader,
} from '../../hooks/usePlayerSkillTree';
import { cn } from '@/lib/utils';

// Spring physics
const springDefault = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
  mass: 1,
};

const springSnappy = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
  mass: 0.8,
};

// Attribute tabs configuration
const ATTRIBUTE_TABS: { key: SkillAttributeKey; label: string }[] = [
  { key: 'power', label: 'Power' },
  { key: 'precision', label: 'Precision' },
  { key: 'scoring', label: 'Scoring' },
  { key: 'recovery', label: 'Recovery' },
  { key: 'consistency', label: 'Consistency' },
];

/**
 * Level Bar Component - 10 blocks with staggered animation
 */
const LevelBar = memo(({ 
  level, 
  gradient,
  delay = 0,
}: { 
  level: number; 
  gradient: string;
  delay?: number;
}) => {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 10 }).map((_, index) => {
        const isFilled = index < level;
        return (
          <motion.div
            key={index}
            className={cn(
              "w-full h-5 rounded-sm",
              isFilled 
                ? `bg-gradient-to-r ${gradient}` 
                : "bg-slate-200"
            )}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ ...springSnappy, delay: delay + (index * 0.03) }}
            style={{ originY: 1 }}
          />
        );
      })}
    </div>
  );
});

LevelBar.displayName = 'LevelBar';

/**
 * Attribute Description Card
 */
const AttributeDescriptionCard = memo(({ 
  attribute 
}: { 
  attribute: SkillAttributeKey;
}) => {
  const config = SKILL_ATTRIBUTES[attribute];
  
  return (
    <div className="bg-slate-50 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{config.icon}</span>
        <span className={cn("font-semibold", config.color)}>{config.name}</span>
        <Info className="w-4 h-4 text-slate-400" />
      </div>
      <p className="text-sm text-slate-600">{config.description}</p>
    </div>
  );
});

AttributeDescriptionCard.displayName = 'AttributeDescriptionCard';

/**
 * Skill Leader Row Component
 */
const SkillLeaderRow = memo(({ 
  leader, 
  index,
  onTap,
}: { 
  leader: SkillLeader; 
  index: number;
  onTap: () => void;
}) => {
  const config = SKILL_ATTRIBUTES[leader.attribute.key];

  return (
    <motion.button
      className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 
                 active:scale-[0.98] active:opacity-90 transition-transform duration-100
                 border-b border-slate-100 last:border-b-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springDefault, delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
    >
      {/* Rank Badge */}
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
        leader.rank <= 3 
          ? `bg-gradient-to-r ${config.gradient} text-white` 
          : "bg-slate-100 text-slate-600"
      )}>
        {leader.rank}
      </div>

      {/* Player Photo */}
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-200">
        {leader.photoUrl ? (
          <img
            src={leader.photoUrl}
            alt={leader.playerName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-semibold">
            {leader.playerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}
      </div>

      {/* Player Info + Level Bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-slate-900 truncate text-sm">
            {leader.playerName}
          </span>
          {leader.country && (
            <span className="text-xs text-slate-400 uppercase">
              {leader.country.slice(0, 3)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 max-w-[100px]">
            <LevelBar 
              level={leader.attribute.level} 
              gradient={config.gradient}
              delay={index * 0.05}
            />
          </div>
          <span className={cn("text-xs font-semibold", config.color)}>
            Lv.{leader.attribute.level}
          </span>
        </div>
      </div>

      {/* Raw Value */}
      <div className="text-right flex-shrink-0">
        <div className={cn("text-sm font-bold", config.color)}>
          {leader.attribute.rawValue?.toFixed(leader.attribute.key === 'consistency' ? 2 : 1)}
        </div>
        <div className="text-xs text-slate-400">
          {SKILL_ATTRIBUTES[leader.attribute.key].unit}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
    </motion.button>
  );
});

SkillLeaderRow.displayName = 'SkillLeaderRow';

/**
 * Skeleton Loader
 */
function SkillTreeSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
            <div className="h-5 w-24 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="w-10 text-right space-y-1">
            <div className="h-4 w-10 bg-slate-100 rounded animate-pulse ml-auto" />
            <div className="h-3 w-6 bg-slate-100 rounded animate-pulse ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty State
 */
function SkillTreeEmpty({ attribute }: { attribute: SkillAttributeKey }) {
  const config = SKILL_ATTRIBUTES[attribute];
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">{config.icon}</div>
      <p className="text-base font-semibold text-slate-900">No data available</p>
      <p className="text-sm text-slate-500 mt-1">
        Statistics for {config.name} are not available
      </p>
    </div>
  );
}

/**
 * Main Skill Tree Module
 */
export function SkillTreeModule() {
  const navigate = useNavigate();
  const [selectedAttribute, setSelectedAttribute] = useState<SkillAttributeKey>('power');
  
  // Fetch leaders for selected attribute
  const { data, isLoading, error } = useSkillTreeLeaders(selectedAttribute, 10);

  const handlePlayerTap = (playerId: string) => {
    navigate(`/tourhub/player/${playerId}`);
  };

  const config = SKILL_ATTRIBUTES[selectedAttribute];

  return (
    <section className="py-6">
      {/* Header */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🌳</span>
          <h2 className="text-xl font-bold text-slate-900">Skill Trees</h2>
        </div>
        <p className="text-sm text-slate-500">PGA Tour • 2025 Season</p>
      </div>

      {/* Attribute Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {ATTRIBUTE_TABS.map(({ key, label }) => {
            const attrConfig = SKILL_ATTRIBUTES[key];
            const isSelected = selectedAttribute === key;
            
            return (
              <motion.button
                key={key}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium",
                  "whitespace-nowrap transition-colors duration-200 min-h-[44px]",
                  isSelected 
                    ? `bg-gradient-to-r ${attrConfig.gradient} text-white shadow-md`
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAttribute(key)}
              >
                <span>{attrConfig.icon}</span>
                <span>{label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Attribute Description */}
      <div className="px-4">
        <AttributeDescriptionCard attribute={selectedAttribute} />
      </div>

      {/* Leaders List */}
      <div className="bg-white rounded-2xl mx-4 overflow-hidden shadow-sm border border-slate-100">
        {isLoading ? (
          <SkillTreeSkeleton />
        ) : error ? (
          <div className="py-12 text-center text-red-500">
            Failed to load skill leaders
          </div>
        ) : !data?.length ? (
          <SkillTreeEmpty attribute={selectedAttribute} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedAttribute}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {data.map((leader, index) => (
                <SkillLeaderRow
                  key={leader.playerId}
                  leader={leader}
                  index={index}
                  onTap={() => handlePlayerTap(leader.playerId)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* View All Link */}
      {data && data.length > 0 && (
        <div className="px-4 mt-4">
          <motion.button
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                       bg-slate-100 text-slate-700 font-medium text-sm
                       hover:bg-slate-200 active:scale-[0.98] transition-all duration-200 min-h-[44px]"
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/tourhub/stats')}
          >
            <span>{config.icon}</span>
            <span>View All {config.name} Stats</span>
          </motion.button>
        </div>
      )}
    </section>
  );
}
