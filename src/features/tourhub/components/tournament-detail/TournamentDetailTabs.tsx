/**
 * TournamentDetailTabs - Secondary pill-style tabs
 * TD-05: role="tablist" and role="tab" with aria-selected
 */

import { cn } from '@/lib/utils';

export type TournamentTab = 'overview' | 'leaderboard' | 'summary' | 'tee-times' | 'hole-stats';

interface TabConfig {
  value: TournamentTab;
  label: string;
}

const COMPLETED_TABS: TabConfig[] = [
  { value: 'summary', label: 'Summary' },
  { value: 'leaderboard', label: 'Leaderboard' },
  { value: 'tee-times', label: 'Tee Times' },
  { value: 'hole-stats', label: 'Holes' },
];

const DEFAULT_TABS: TabConfig[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'leaderboard', label: 'Leaderboard' },
  { value: 'tee-times', label: 'Tee Times' },
  { value: 'hole-stats', label: 'Holes' },
];

interface TournamentDetailTabsProps {
  activeTab: TournamentTab;
  onTabChange: (tab: TournamentTab) => void;
  className?: string;
  tournamentStatus?: string;
}

export function TournamentDetailTabs({ activeTab, onTabChange, className, tournamentStatus }: TournamentDetailTabsProps) {
  const isCompleted = tournamentStatus === 'closed';
  const visibleTabs = isCompleted ? COMPLETED_TABS : DEFAULT_TABS;

  return (
    <div className={cn("sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 py-3 -mx-4 px-4", className)}>
      <div 
        className="flex gap-1.5"
        role="tablist"
        aria-label="Tournament Sections"
      >
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "px-3 py-1.5 text-[13px] font-semibold transition-all active:scale-[0.95]",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
              style={{
                borderRadius: 20,
                backgroundColor: isActive ? '#475569' : 'transparent',
                color: isActive ? '#fff' : undefined,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}