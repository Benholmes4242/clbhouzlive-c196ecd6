import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type TourHubTab = 
  | 'overview' 
  | 'schedule' 
  | 'players' 
  | 'leaderboards';

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
];

export function TourHubTabs({ activeTab, onTabChange, className }: TourHubTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TourHubTab)}>
      <div className={cn("w-full max-w-full", className)}>
        {/* Pill toggle style - matching design system */}
        <TabsList 
          className="flex flex-wrap h-auto items-center justify-start gap-0 p-1 rounded-xl overflow-hidden border-0"
          style={{ background: '#e2e8f0' }}
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="px-3 py-2 text-sm font-medium whitespace-nowrap min-h-[40px] rounded-none border-0 data-[state=active]:bg-white data-[state=active]:text-[#1e293b] data-[state=active]:shadow-sm data-[state=active]:m-1 data-[state=active]:rounded-lg data-[state=active]:border data-[state=active]:border-[#e2e8f0] data-[state=inactive]:text-[#64748b] data-[state=inactive]:hover:text-[#1e293b] data-[state=inactive]:hover:bg-white/50 data-[state=inactive]:bg-transparent transition-all duration-200"
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
      <div className={cn("w-full max-w-full", className)}>
        {/* Segmented control - matching design system */}
        <TabsList 
          className="flex items-stretch h-auto gap-0 p-1 rounded-xl overflow-hidden border-0 w-full"
          style={{ background: '#e2e8f0' }}
        >
          {tournamentTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 py-2.5 text-[13px] font-semibold whitespace-nowrap min-h-[44px] rounded-none border-0 data-[state=active]:bg-white data-[state=active]:text-[#1e293b] data-[state=active]:shadow-sm data-[state=active]:m-1 data-[state=active]:rounded-lg data-[state=active]:border data-[state=active]:border-[#e2e8f0] data-[state=inactive]:text-[#64748b] data-[state=inactive]:hover:text-[#1e293b] data-[state=inactive]:hover:bg-white/50 data-[state=inactive]:bg-transparent transition-all duration-200"
            >
              <span className="text-sm hidden sm:inline mr-1">{tab.icon}</span>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
