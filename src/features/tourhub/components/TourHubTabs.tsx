import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type TourHubTab = 
  | 'overview' 
  | 'schedule' 
  | 'players' 
  | 'player-stats'
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
  { value: 'player-stats', label: 'Player Statistics', shortLabel: 'Stats' },
  { value: 'leaderboards', label: 'Leaderboards', shortLabel: 'Leaders' },
  { value: 'summary', label: 'Tournament Summary', shortLabel: 'Summary' },
  { value: 'tee-times', label: 'Tee Times', shortLabel: 'Tee Times' },
  { value: 'hole-stats', label: 'Hole Statistics', shortLabel: 'Holes' },
];

export function TourHubTabs({ activeTab, onTabChange, className }: TourHubTabsProps) {
  return (
    <div className={cn("w-full max-w-full overflow-x-auto scrollbar-hide", className)}>
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TourHubTab)}>
        <TabsList className="inline-flex h-11 items-center justify-start gap-1 bg-muted/50 p-1 rounded-lg w-max">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-none px-3 sm:px-4 py-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

// Tournament detail tabs (subset)
export type TournamentDetailTab = 'overview' | 'leaderboard' | 'summary' | 'tee-times' | 'hole-stats';

interface TournamentDetailTabsProps {
  activeTab: TournamentDetailTab;
  onTabChange: (tab: TournamentDetailTab) => void;
  className?: string;
}

const tournamentTabs: { value: TournamentDetailTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'leaderboard', label: 'Leaderboard' },
  { value: 'summary', label: 'Summary' },
  { value: 'tee-times', label: 'Tee Times' },
  { value: 'hole-stats', label: 'Hole Stats' },
];

export function TournamentDetailTabs({ activeTab, onTabChange, className }: TournamentDetailTabsProps) {
  return (
    <div className={cn("w-full max-w-full overflow-x-auto scrollbar-hide", className)}>
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TournamentDetailTab)}>
        <TabsList className="inline-flex h-10 items-center justify-start gap-1 bg-muted/50 p-1 rounded-lg w-max">
          {tournamentTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-none px-3 sm:px-4 py-1.5 text-sm font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
