/**
 * SkillTrees - Horizontal Swipe Skill Leaderboards
 * 
 * Design: Horizontal tabs with clean player rows, no cards
 * Per redesign brief: Minimal decoration, data-focused layout
 */

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  useSkillTreeLeaders, 
  SKILL_ATTRIBUTES, 
  type SkillAttributeKey,
  type SkillLeader,
} from '../../hooks/usePlayerSkillTree';
import { cn } from '@/lib/utils';

// Attribute tabs
const SKILL_TABS: { key: SkillAttributeKey; label: string; icon: string }[] = [
  { key: 'power', label: 'Power', icon: '💪' },
  { key: 'precision', label: 'Precision', icon: '🎯' },
  { key: 'scoring', label: 'Scoring', icon: '⭐' },
  { key: 'recovery', label: 'Scrambling', icon: '🛡️' },
];

/** Level bar - compact 10-block version */
const LevelBar = memo(({ level, color }: { level: number; color: string }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 10 }).map((_, i) => (
      <div
        key={i}
        className={cn(
          "w-2 h-3 rounded-[1px]",
          i < level ? color : "bg-slate-200"
        )}
      />
    ))}
  </div>
));

LevelBar.displayName = 'LevelBar';

/** Leader row */
const LeaderRow = memo(({ 
  leader, 
  index,
  onTap,
}: { 
  leader: SkillLeader; 
  index: number;
  onTap: () => void;
}) => {
  const config = SKILL_ATTRIBUTES[leader.attribute.key];
  const isTop3 = leader.rank <= 3;

  return (
    <motion.button
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.15 }}
      onClick={onTap}
    >
      {/* Rank */}
      <div className={cn(
        "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0",
        isTop3 
          ? "bg-slate-900 text-white" 
          : "bg-slate-100 text-slate-600"
      )}>
        {leader.rank}
      </div>

      {/* Player Photo */}
      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-slate-100">
        {leader.photoUrl ? (
          <img
            src={leader.photoUrl}
            alt={leader.playerName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-semibold">
            {leader.playerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}
      </div>

      {/* Player Info + Level */}
      <div className="flex-1 min-w-0 text-left">
        <span className="font-semibold text-sm text-slate-900 truncate block">
          {leader.playerName}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <LevelBar level={leader.attribute.level} color="bg-slate-700" />
          <span className="text-[10px] text-slate-500 font-medium">
            Lv.{leader.attribute.level}
          </span>
        </div>
      </div>

      {/* Raw Value */}
      <div className="text-right flex-shrink-0">
        <span className="text-sm font-bold text-slate-900 font-mono">
          {leader.attribute.rawValue?.toFixed(leader.attribute.key === 'consistency' ? 2 : 1)}
        </span>
        <span className="block text-[10px] text-slate-400">
          {config.unit}
        </span>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
    </motion.button>
  );
});

LeaderRow.displayName = 'LeaderRow';

/** Loading skeleton */
const SkillTreesSkeleton = () => (
  <div className="divide-y divide-slate-100">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3">
        <div className="w-6 h-6 rounded-md bg-slate-100 animate-pulse" />
        <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="w-12 h-4 bg-slate-100 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

export function SkillTrees() {
  const navigate = useNavigate();
  const [selectedSkill, setSelectedSkill] = useState<SkillAttributeKey>('power');
  
  const { data, isLoading, error } = useSkillTreeLeaders(selectedSkill, 5);

  const handlePlayerTap = (playerId: string) => {
    navigate(`/tourhub/player/${playerId}`);
  };

  return (
    <section className="py-8">
      {/* Header */}
      <div className="px-4 mb-4">
        <h2 className="text-xl font-bold text-slate-900">Skill Trees</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">Who dominates each skill?</p>
      </div>

      {/* Skill Tabs - Horizontal scroll */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {SKILL_TABS.map(({ key, label, icon }) => {
          const isSelected = selectedSkill === key;
          
          return (
            <button
              key={key}
              onClick={() => setSelectedSkill(key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[40px]",
                isSelected 
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Leaders List */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <SkillTreesSkeleton />
        ) : error ? (
          <div className="py-12 text-center text-red-500 text-sm">
            Failed to load skill leaders
          </div>
        ) : !data?.length ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No data available
          </div>
        ) : (
          <motion.div
            key={selectedSkill}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="divide-y divide-slate-100"
          >
            {data.map((leader, index) => (
              <LeaderRow
                key={leader.playerId}
                leader={leader}
                index={index}
                onTap={() => handlePlayerTap(leader.playerId)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Bottom divider */}
      <div className="h-px bg-slate-100 mt-4" />
    </section>
  );
}

export default SkillTrees;
