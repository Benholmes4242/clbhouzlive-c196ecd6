/**
 * CompactActiveTarget - Hero CTA card for next target
 * Single unified card with tight layout, progress bar, and docked CTA
 * 35% height reduction from previous NextTargetCard
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Compass, ChevronRight, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MILESTONE_TIER_META } from '@/config/achievements';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';

interface CompactActiveTargetProps {
  totalPlayed: number;
  nextMilestone?: {
    name: string;
    threshold: number;
  };
  suggestedRegion?: string;
}

export const CompactActiveTarget: React.FC<CompactActiveTargetProps> = ({
  totalPlayed,
  nextMilestone,
  suggestedRegion,
}) => {
  const navigate = useNavigate();
  
  if (!nextMilestone) return null;
  
  const remaining = nextMilestone.threshold - totalPlayed;
  const progressPercent = (totalPlayed / nextMilestone.threshold) * 100;
  const tierColor = getRingColorForThreshold(nextMilestone.threshold);
  const tierMeta = MILESTONE_TIER_META.find(m => m.threshold === nextMilestone.threshold);

  return (
    <motion.div
      className="bg-white rounded-xl border border-slate-200/70 p-3 shadow-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
      }}
    >
      {/* Top row: Target info + remaining count */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ 
              background: `${tierColor}12`,
              border: `1px solid ${tierColor}25`,
            }}
          >
            <Target className="w-3 h-3" style={{ color: tierColor }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">
              Next: {nextMilestone.name}
            </p>
            {tierMeta && (
              <p className="text-[10px] font-medium" style={{ color: tierColor, opacity: 0.8 }}>
                {tierMeta.tierName}
              </p>
            )}
          </div>
        </div>
        <span 
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ 
            background: `${tierColor}10`,
            color: tierColor,
          }}
        >
          {remaining} to go
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 rounded-full overflow-hidden mb-2"
        style={{ background: 'var(--quest-track)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${tierColor}90, ${tierColor})`,
            boxShadow: `0 0 6px ${tierColor}30`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progressPercent, 100)}%` }}
          transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Suggestions row + CTA */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {suggestedRegion && (
            <div 
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium truncate"
              style={{ 
                background: 'var(--quest-chip-bg)',
                color: 'var(--quest-text-secondary)',
              }}
            >
              <Compass className="w-3 h-3 flex-shrink-0 text-slate-400" />
              <span className="truncate">{suggestedRegion}</span>
            </div>
          )}
        </div>

        {/* CTA button - docked right */}
        <button
          onClick={() => navigate('/top100')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: tierColor,
            color: '#FFFFFF',
            boxShadow: `0 2px 6px ${tierColor}30`,
          }}
        >
          <span>Explore</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

export default CompactActiveTarget;
