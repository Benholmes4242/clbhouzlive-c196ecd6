import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MedalIcon from '@/components/ui/medal-icon';

interface MilestoneAchievementsProps {
  completedCount: number;
  className?: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  requiredCourses: number;
  type: '20-club' | '50-club' | '100-club' | '200-club' | '300-club';
  tier: 'bronze' | 'silver' | 'gold' | 'emerald' | 'purple';
}

const MILESTONES: Milestone[] = [
  {
    id: 'the-20-club',
    name: 'The 20 Club',
    description: 'Awarded for completing 20 Top 100 courses',
    requiredCourses: 20,
    type: '20-club',
    tier: 'bronze'
  },
  {
    id: 'the-50-club', 
    name: 'The 50 Club',
    description: 'Awarded for completing 50 Top 100 courses',
    requiredCourses: 50,
    type: '50-club',
    tier: 'silver'
  },
  {
    id: 'century-club',
    name: 'The Century Club',
    description: 'Awarded for completing 100 Top 100 courses',
    requiredCourses: 100,
    type: '100-club',
    tier: 'gold'
  },
  {
    id: 'clubhouse-elite',
    name: 'Clubhouse Elite',
    description: 'Awarded for completing 200 Top 100 courses',
    requiredCourses: 200,
    type: '200-club',
    tier: 'emerald'
  },
  {
    id: 'club-collector',
    name: 'Club Collector',
    description: 'Awarded for completing 300 Top 100 courses',
    requiredCourses: 300,
    type: '300-club',
    tier: 'purple'
  }
];

const MilestoneAchievements: React.FC<MilestoneAchievementsProps> = ({
  completedCount,
  className
}) => {
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  const getBadgeGlow = (tier: string, isEarned: boolean) => {
    if (!isEarned) return '';
    
    const glowMap = {
      bronze: 'drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]',
      silver: 'drop-shadow-[0_0_12px_rgba(156,163,175,0.6)]',
      gold: 'drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]',
      emerald: 'drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]',
      purple: 'drop-shadow-[0_0_12px_rgba(147,51,234,0.6)]'
    };
    
    return glowMap[tier as keyof typeof glowMap] || '';
  };

  const getTooltipContent = (milestone: Milestone, isEarned: boolean) => (
    <div className="text-center max-w-xs">
      <h4 className="font-semibold text-sm mb-1">{milestone.name}</h4>
      <p className="text-xs text-muted-foreground mb-2">{milestone.description}</p>
      {isEarned ? (
        <p className="text-xs text-green-400 font-medium">✓ Earned</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {milestone.requiredCourses - completedCount} more courses needed
        </p>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <div className={cn('space-y-4', className)}>
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Milestone Achievements</h3>
          <span className="text-sm text-muted-foreground">
            {MILESTONES.filter(m => completedCount >= m.requiredCourses).length}/{MILESTONES.length} earned
          </span>
        </div>

        {/* Badge Collection */}
        <div className="flex items-center gap-6 overflow-x-auto py-4 px-2 scrollbar-hide">
          {MILESTONES.map((milestone) => {
            const isEarned = completedCount >= milestone.requiredCourses;
            const isHovered = hoveredBadge === milestone.id;
            
            return (
              <Tooltip key={milestone.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'relative flex-shrink-0 cursor-pointer transition-all duration-300 ease-out',
                      isHovered ? 'scale-110' : 'hover:scale-105'
                    )}
                    onMouseEnter={() => setHoveredBadge(milestone.id)}
                    onMouseLeave={() => setHoveredBadge(null)}
                  >
                    {/* Badge Container */}
                    <div
                      className={cn(
                        'relative p-2 rounded-full transition-all duration-300',
                        isEarned ? 'bg-background/80 border-2 border-primary/20' : 'bg-muted/50 border border-border',
                        getBadgeGlow(milestone.tier, isEarned)
                      )}
                    >
                      <MedalIcon
                        type={milestone.type}
                        size="xl"
                        className={cn(
                          'transition-all duration-300',
                          isEarned ? 'opacity-100' : 'opacity-40 grayscale'
                        )}
                      />
                      
                      {/* Locked Overlay for unearned badges */}
                      {!isEarned && (
                        <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-muted-foreground rounded-sm"></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress Ring for Next Badge */}
                    {!isEarned && milestone.id === MILESTONES.find(m => completedCount < m.requiredCourses)?.id && (
                      <div className="absolute inset-0 -rotate-90">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-muted"
                            opacity="0.3"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="text-primary"
                            strokeDasharray={`${(completedCount / milestone.requiredCourses) * 289.027} 289.027`}
                            style={{
                              transition: 'stroke-dasharray 0.5s ease-in-out'
                            }}
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="border border-border bg-popover/95 backdrop-blur-sm"
                  sideOffset={8}
                >
                  {getTooltipContent(milestone, isEarned)}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Progress Summary */}
        <div className="text-center text-sm text-muted-foreground">
          {completedCount} of 300 courses played
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MilestoneAchievements;