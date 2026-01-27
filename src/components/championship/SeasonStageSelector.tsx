import React from 'react';
import { cn } from '@/lib/utils';
import { Dumbbell, Trophy, Sun, Leaf, LucideIcon } from 'lucide-react';

interface Stage {
  id: string;
  label: string;
  icon: LucideIcon;
  daysRemaining?: number;
}

interface SeasonStageSelectorProps {
  stages?: Stage[];
  activeStageId: string;
  onStageSelect: (stageId: string) => void;
}

const DEFAULT_STAGES: Stage[] = [
  { id: 'pre-season', label: 'Pre-Season', icon: Dumbbell },
  { id: 'major', label: 'Major Season', icon: Trophy },
  { id: 'summer', label: 'Summer Season', icon: Sun },
  { id: 'off-season', label: 'Off-Season', icon: Leaf },
];

/**
 * SeasonStageSelector - Season navigation row
 * 
 * Features:
 * - Centered, evenly distributed
 * - No clipping - fits on phone or allows smooth horizontal scroll
 * - Active state: subtle outline + light fill
 * - SVG icons only (no emojis)
 */
export const SeasonStageSelector: React.FC<SeasonStageSelectorProps> = ({
  stages = DEFAULT_STAGES,
  activeStageId,
  onStageSelect,
}) => {
  return (
    <div className="flex items-center justify-center gap-2 px-4 overflow-x-auto scrollbar-hide">
      {stages.map((stage) => {
        const Icon = stage.icon;
        const isActive = stage.id === activeStageId;

        return (
          <button
            key={stage.id}
            onClick={() => onStageSelect(stage.id)}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
              "min-w-[72px] flex-shrink-0",
              isActive
                ? "bg-primary/10 border border-primary/30"
                : "bg-transparent hover:bg-muted/50"
            )}
          >
            <Icon className={cn(
              "w-5 h-5",
              isActive ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-xs font-medium",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {stage.label}
            </span>
            {isActive && stage.daysRemaining !== undefined && (
              <span className="text-[10px] font-bold text-primary">
                {stage.daysRemaining}d
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SeasonStageSelector;
