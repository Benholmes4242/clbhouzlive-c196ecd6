import React from 'react';
import { Bell, AtSign, UserPlus, Building2, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityCounts } from '@/hooks/useActivityFeed';

interface AtAGlanceChipsProps {
  counts: ActivityCounts;
  onChipClick: (kind: 'new' | 'mentions' | 'follows' | 'clubs' | 'messages') => void;
  activeFilter?: string | null;
}

const CHIP_CONFIG = [
  { key: 'new' as const, label: 'New', icon: Bell, countKey: 'new' as const },
  { key: 'mentions' as const, label: 'Mentions', icon: AtSign, countKey: 'mentions' as const },
  { key: 'follows' as const, label: 'Follows', icon: UserPlus, countKey: 'follows' as const },
  { key: 'clubs' as const, label: 'Clubs', icon: Building2, countKey: 'clubs' as const },
  { key: 'messages' as const, label: 'Messages', icon: Mail, countKey: 'messages' as const },
];

export const AtAGlanceChips: React.FC<AtAGlanceChipsProps> = ({ counts, onChipClick, activeFilter }) => {
  const visibleChips = CHIP_CONFIG.filter(chip => counts[chip.countKey] > 0);

  if (visibleChips.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
      {visibleChips.map(chip => {
        const Icon = chip.icon;
        const count = counts[chip.countKey];
        const isActive = activeFilter === chip.key;
        const isNewChip = chip.key === 'new';
        
        return (
          <button
            key={chip.key}
            onClick={() => onChipClick(chip.key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-sq-pill px-3 py-1.5 text-xs font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border/60 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
            <span className={isActive ? "text-primary-foreground" : "text-foreground"}>{chip.label}</span>
            {/* Orange count bubble for New chip, regular count for others */}
            {isNewChip ? (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-sq-xs bg-orange-500 text-[11px] font-medium text-white px-1.5">
                {count}
              </span>
            ) : (
              <span className={cn(
                "text-[10px] font-bold",
                isActive ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
