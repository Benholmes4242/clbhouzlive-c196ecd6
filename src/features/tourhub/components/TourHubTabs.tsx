import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type TourHubTab = 
  | 'overview' 
  | 'schedule' 
  | 'players' 
  | 'leaderboards' 
  | 'summary' 
  | 'tee-times' 
  | 'hole-stats';

interface TourHubTabsProps {
  activeTab: TourHubTab;
  onTabChange: (tab: TourHubTab) => void;
  className?: string;
}

const tabs: { value: TourHubTab; label: string; shortLabel: string }[] = [
  { value: 'overview', label: 'Overview', shortLabel: 'Overview' },
  { value: 'schedule', label: 'Schedule', shortLabel: 'Schedule' },
  { value: 'players', label: 'Players', shortLabel: 'Players' },
  { value: 'leaderboards', label: 'Leaderboards', shortLabel: 'Leaders' },
  { value: 'summary', label: 'Tournament Summary', shortLabel: 'Summary' },
  { value: 'tee-times', label: 'Tee Times', shortLabel: 'Tee Times' },
  { value: 'hole-stats', label: 'Hole Statistics', shortLabel: 'Holes' },
];

export function TourHubTabs({ activeTab, onTabChange, className }: TourHubTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TourHubTab)}>
      <div className={cn("w-full max-w-full", className)}>
        {/* 2-row wrapped grid - no horizontal scroll */}
        <TabsList className="flex flex-wrap h-auto items-center justify-start gap-2 bg-transparent p-0 border-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="relative px-3 py-2 text-sm font-medium whitespace-nowrap bg-transparent border-0 shadow-none rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out data-[state=active]:after:w-full data-[state=inactive]:after:w-0 data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-[0.85]"
            >
              {tab.shortLabel}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}

// Tournament detail tabs (subset) with icons
export type TournamentDetailTab = 'overview' | 'leaderboard' | 'summary' | 'tee-times' | 'hole-stats';

interface TournamentDetailTabsProps {
  activeTab: TournamentDetailTab;
  onTabChange: (tab: TournamentDetailTab) => void;
  className?: string;
}

const tournamentTabs: { value: TournamentDetailTab; label: string; icon: string }[] = [
  { value: 'overview', label: 'Overview', icon: '📋' },
  { value: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { value: 'summary', label: 'Summary', icon: '📄' },
  { value: 'tee-times', label: 'Tee Times', icon: '⏰' },
  { value: 'hole-stats', label: 'Hole Stats', icon: '⛳' },
];

export function TournamentDetailTabs({ activeTab, onTabChange, className }: TournamentDetailTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TournamentDetailTab)}>
      <div className={cn("w-full max-w-full overflow-x-auto whitespace-nowrap overscroll-x-contain scrollbar-hide", className)}>
        <TabsList className="inline-flex h-11 items-center justify-start gap-1 bg-muted/50 p-1 rounded-xl w-max">
          {tournamentTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-none px-3 sm:px-4 py-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-all gap-1.5 items-center"
            >
              <span className="text-sm hidden sm:inline">{tab.icon}</span>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
