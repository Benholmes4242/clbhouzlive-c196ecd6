/**
 * TournamentDetailTabs - Pill-style tabs with sticky positioning
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
  const isLive = tournamentStatus === 'inprogress';
  const isCompleted = tournamentStatus === 'closed';

  const visibleTabs = isCompleted ? COMPLETED_TABS : DEFAULT_TABS;

  return (
    <div className={cn("sticky top-0 z-20 bg-background/95 backdrop-blur-md py-3", className)}>
      <div 
        className="flex gap-1"
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
                "relative flex-1 flex items-center justify-center gap-1 rounded-lg py-2.5 text-[13px] font-semibold",
                "min-h-[44px] transition-all duration-200 active:scale-[0.95]",
                isActive 
                  ? "bg-foreground text-background shadow-sm" 
                  : "bg-transparent text-muted-foreground"
              )}
            >
              {tab.label}
              
              {/* LIVE dot on Leaderboard tab */}
              {isLive && tab.value === 'leaderboard' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
