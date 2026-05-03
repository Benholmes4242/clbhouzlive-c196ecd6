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
    navigate('/profile');
  };

  // Spacing: Progress bar → Next milestone = 20px - handled by mt-5
  if (isComplete) {
    return (
      <motion.button
        onClick={handleClick}
        className="mx-4 mt-5 w-[calc(100%-2rem)] text-left px-4 py-3.5 rounded-2xl border transition-all duration-150 group"
        style={{
          background: `linear-gradient(135deg, rgba(var(--region-${listSlug === 'gb-i' ? 'gbi' : listSlug}), 0.08) 0%, transparent 100%)`,
          borderColor: theme.ringColor,
          borderWidth: '1px',
        }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
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
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
          </div>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      className="mx-4 mt-5 w-[calc(100%-2rem)] text-left px-4 py-3.5 rounded-2xl transition-all duration-150"
      style={{ 
        background: '#ffffff',
        border: '1px solid rgba(15,23,42,0.07)',
        borderLeftWidth: '3px',
        borderLeftColor: theme.ringColor,
      }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${theme.ringColor}1A` }}
          >
            <Target className="w-5 h-5" style={{ color: theme.ringColor }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Next milestone: <span className="text-xl font-bold tabular-nums" style={{ color: theme.ringColor }}><AnimatedNumber value={nextMilestone ?? 0} minCh={1} /></span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <AnimatedNumber value={toGo} minCh={1} delay={0.05} /> course{toGo !== 1 ? 's' : ''} to go
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-muted-foreground italic whitespace-nowrap">
            {statusCopy}
          </p>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
        </div>
      </div>
    </motion.button>
  );
};