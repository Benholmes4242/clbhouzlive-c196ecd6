import React from 'react';
import { Bell, AtSign, Users, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityCounts } from '@/hooks/useActivityFeed';

interface AtAGlanceChipsProps {
  counts: ActivityCounts;
  onChipClick: (kind: 'new' | 'mentions' | 'friends' | 'messages') => void;
  activeFilter?: string | null;
  sessionNewCount?: number | null;
}

const CHIP_CONFIG = [
  { key: 'new' as const, label: 'New', icon: Bell, countKey: 'new' as const },
  { key: 'mentions' as const, label: 'Mentions', icon: AtSign, countKey: 'mentions' as const },
  { key: 'friends' as const, label: 'Friends', icon: Users, countKey: 'friends' as const },
  { key: 'messages' as const, label: 'Messages', icon: Mail, countKey: 'messages' as const },
];

export const AtAGlanceChips: React.FC<AtAGlanceChipsProps> = ({ counts, onChipClick, activeFilter, sessionNewCount }) => {
  // Use session count for "new" chip if available (locked to initial visit count)
  const effectiveCounts = {
    ...counts,
    new: sessionNewCount !== null && sessionNewCount !== undefined ? sessionNewCount : counts.new,
  };
  const visibleChips = CHIP_CONFIG.filter(chip => effectiveCounts[chip.countKey] > 0);

  if (visibleChips.length === 0) return null;

  return (
    <div className="w-full flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
      {visibleChips.map(chip => {
        const Icon = chip.icon;
        const count = effectiveCounts[chip.countKey];
        const isActive = activeFilter === chip.key;
        const isNewChip = chip.key === 'new';
        
        return (
          <button
            key={chip.key}
            onClick={() => onChipClick(chip.key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.75rem] font-medium transition-all",
              isActive
                ? "bg-foreground text-background"
                : "bg-card border border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-background" : "text-muted-foreground")} />
            <span className={isActive ? "text-background" : "text-foreground"}>{chip.label}</span>
            {/* Count bubble */}
            {count > 0 && (
              <span className={cn(
                "ml-1 px-1.5 py-0.5 rounded-full text-[0.625rem] font-semibold",
                isNewChip 
                  ? "bg-primary text-primary-foreground" 
                  : isActive 
                    ? "bg-background/20 text-background"
                    : "bg-muted text-muted-foreground"
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
