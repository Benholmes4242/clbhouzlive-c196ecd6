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
  { id: 'major', label: 'Major', icon: Trophy },
  { id: 'summer', label: 'Summer', icon: Sun },
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
    <div className="flex w-full bg-muted/30 rounded-lg p-1">
      {stages.map((stage) => {
        const Icon = stage.icon;
        const isActive = stage.id === activeStageId;

        return (
          <button
            key={stage.id}
            onClick={() => onStageSelect(stage.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-md transition-all",
              isActive
                ? "bg-white shadow-sm"
                : "hover:bg-white/50"
            )}
          >
            <Icon className={cn(
              "w-4 h-4",
              isActive ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-[11px] font-medium",
              isActive ? "text-foreground" : "text-muted-foreground"
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
