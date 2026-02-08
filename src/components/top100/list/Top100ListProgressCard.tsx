import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Trophy, ChevronRight } from 'lucide-react';
import { getListMilestoneState } from '@/lib/listMilestoneSystem';
import { getRegionTheme } from '@/lib/regionTheme';
import { AnimatedNumber } from '@/components/ui/motion';

interface Top100ListProgressCardProps {
  playedCount: number;
  totalCount: number;
  listSlug: string;
  listDisplayName: string;
  userId?: string;
}

/**
 * Progress card shown below hero with next milestone info and motivational copy.
 * Uses regional color theming for accent elements.
 * 
 * Polish applied:
 * - Tappable card → navigates to achievements
 * - Milestone icon
 * - Hover/press states
 * - Bold milestone number
 * - Semantic design tokens
 */
export const Top100ListProgressCard: React.FC<Top100ListProgressCardProps> = ({
  playedCount,
  listSlug,
}) => {
  const navigate = useNavigate();
  
  // Use unified milestone system
  const { nextMilestone, toGo, isComplete, statusCopy } = getListMilestoneState(playedCount);
  
  // Get regional theme for accent color
  const theme = getRegionTheme(listSlug);

  const handleClick = () => {
    navigate('/achievements');
  };

  // Spacing: Progress bar → Next milestone = 16px (M) - handled by mt-4
  if (isComplete) {
    return (
      <motion.button
        onClick={handleClick}
        className="mx-4 mt-4 w-[calc(100%-2rem)] text-left px-4 py-3.5 rounded-sq-md border transition-all duration-150 group"
        style={{
          background: `linear-gradient(135deg, rgba(var(--region-${listSlug === 'gb-i' ? 'gbi' : listSlug}), 0.08) 0%, transparent 100%)`,
          borderColor: theme.ringColor,
          borderWidth: '1px',
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${theme.ringColor}20` }}
            >
              <Trophy className="w-5 h-5" style={{ color: theme.ringColor }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Completed
              </p>
              <p className="text-xs mt-0.5" style={{ color: theme.ringColor }}>
                <AnimatedNumber value={100} minCh={1} /> of 100 played
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium italic whitespace-nowrap" style={{ color: theme.ringColor }}>
              {statusCopy}
            </p>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
          </div>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      className="mx-4 mt-4 w-[calc(100%-2rem)] text-left px-4 py-3.5 rounded-sq-md bg-card border border-border shadow-sm transition-all duration-150 group hover:border-border hover:shadow-md"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Target className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Next milestone: <span className="text-lg tabular-nums"><AnimatedNumber value={nextMilestone ?? 0} minCh={1} /></span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <AnimatedNumber value={toGo} minCh={1} delay={0.05} /> course{toGo !== 1 ? 's' : ''} to go
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground italic whitespace-nowrap">
            {statusCopy}
          </p>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
        </div>
      </div>
    </motion.button>
  );
};