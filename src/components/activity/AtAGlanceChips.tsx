import React from 'react';
import { Bell, AtSign, UserPlus, Building2, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityCounts } from '@/hooks/useActivityFeed';

interface AtAGlanceChipsProps {
  counts: ActivityCounts;
  onChipClick: (kind: 'new' | 'mentions' | 'follows' | 'clubs' | 'messages') => void;
}

const CHIP_CONFIG = [
  { key: 'new' as const, label: 'New', icon: Bell, countKey: 'new' as const },
  { key: 'mentions' as const, label: 'Mentions', icon: AtSign, countKey: 'mentions' as const },
  { key: 'follows' as const, label: 'Follows', icon: UserPlus, countKey: 'follows' as const },
  { key: 'clubs' as const, label: 'Clubs', icon: Building2, countKey: 'clubs' as const },
  { key: 'messages' as const, label: 'Messages', icon: Mail, countKey: 'messages' as const },
];

export const AtAGlanceChips: React.FC<AtAGlanceChipsProps> = ({ counts, onChipClick }) => {
  const visibleChips = CHIP_CONFIG.filter(chip => counts[chip.countKey] > 0);

  if (visibleChips.length === 0) return null;

  return (
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {visibleChips.map(chip => {
        const Icon = chip.icon;
        const count = counts[chip.countKey];
        
        return (
          <button
            key={chip.key}
            onClick={() => onChipClick(chip.key)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-sq-pill",
              "border border-border/60 bg-background/80 backdrop-blur-sm",
              "px-3 py-1.5 text-xs font-medium",
              "shadow-sm hover:bg-background hover:shadow-md",
              "transition-all duration-200 active:scale-[0.98]"
            )}
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-foreground">{chip.label}</span>
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold min-w-[18px] text-center",
              chip.key === 'new' 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
