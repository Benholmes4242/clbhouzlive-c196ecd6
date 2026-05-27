import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Target, TrendingUp, Globe, Trophy } from 'lucide-react';
import { getTop100Club, getNextTop100Club, CLUB_STEPS } from '@/lib/top100Club';

interface Goal {
  id: string;
  type: 'milestone' | 'rival' | 'region' | 'rank';
  icon: typeof Target;
  label: string;
  progress: string;
  action?: () => void;
}

interface ClosestGoalsCarouselProps {
  totalPlayed: number;
  rivalName?: string;
  rivalDifference?: number;
  regionProgress?: { region: string; current: number; total: number };
}

export function ClosestGoalsCarousel({
  totalPlayed,
  rivalName,
  rivalDifference,
  regionProgress,
}: ClosestGoalsCarouselProps) {
  const navigate = useNavigate();

  const goals: Goal[] = [];

  // 1. Next milestone goal
  const nextClub = getNextTop100Club(totalPlayed);
  if (nextClub) {
    const coursesNeeded = nextClub.threshold - totalPlayed;
    goals.push({
      id: 'milestone',
      type: 'milestone',
      icon: Trophy,
      label: `${coursesNeeded} more to ${nextClub.tierName}`,
      progress: `${totalPlayed}/${nextClub.threshold}`,
      action: () => navigate('/courses?tab=top100'),
    });
  }

  // 2. Rival goal
  if (rivalName && rivalDifference && rivalDifference > 0) {
    goals.push({
      id: 'rival',
      type: 'rival',
      icon: TrendingUp,
      label: `Beat ${rivalName} in ${rivalDifference} courses`,
      progress: `${rivalDifference} behind`,
    });
  }

  // 3. Region goal
  if (regionProgress && regionProgress.current < regionProgress.total) {
    const remaining = regionProgress.total - regionProgress.current;
    goals.push({
      id: 'region',
      type: 'region',
      icon: Globe,
      label: `${remaining} more ${regionProgress.region} courses`,
      progress: `${regionProgress.current}/${regionProgress.total}`,
      action: () => navigate(`/top100/${regionProgress.region.toLowerCase()}`),
    });
  }

  // 4. Generic goals if we don't have enough
  if (goals.length < 2) {
    const currentClub = getTop100Club(totalPlayed);
    const currentIndex = CLUB_STEPS.findIndex(s => s.tierId === currentClub.tierId);
    
    // Add a second milestone if available
    if (currentIndex < CLUB_STEPS.length - 2) {
      const futureClub = CLUB_STEPS[currentIndex + 2];
      const coursesNeeded = futureClub.threshold - totalPlayed;
      goals.push({
        id: 'future-milestone',
        type: 'milestone',
        icon: Target,
        label: `${coursesNeeded} more to ${futureClub.tierName}`,
        progress: `Long-term goal`,
      });
    }
  }

  if (goals.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2.5">
        <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-[0.5px]">
          Closest goals
        </span>
      </div>
      
      <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {goals.slice(0, 4).map((goal, index) => {
          const Icon = goal.icon;
          
          return (
            <button
              key={goal.id}
              type="button"
              onClick={goal.action}
              disabled={!goal.action}
              className={cn(
                'flex-shrink-0 w-[180px] rounded-2xl border px-3 py-2.5 snap-start',
                'bg-card/95 border-border/60 hover:bg-muted/50 transition-all',
                'text-left disabled:hover:bg-card/95',
                'animate-in fade-in slide-in-from-right-4'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-tight text-foreground">
                    {goal.label}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {goal.progress}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
