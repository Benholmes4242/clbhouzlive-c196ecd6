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
  { value: 'leaderboards', label: 'Rankings', shortLabel: 'Rankings' },
];

/**
 * TourHubTabs — Pinpoint main tab (typographic underline)
 */
export function TourHubTabs({ activeTab, onTabChange, className }: TourHubTabsProps) {
  return (
    <div className={cn('w-full px-4', className)}>
      <div style={{ borderBottom: '1px solid hsl(var(--border))', display: 'flex', gap: 16 }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '11px 2px 9px',
                fontSize: 16,
                whiteSpace: 'nowrap',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                letterSpacing: isActive ? '-0.025em' : '0',
                position: 'relative',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.18s',
              }}
            >
              {tab.shortLabel}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2.5,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #D97706, #F7931E)',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
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
    <div className={cn('w-full px-4', className)}>
      <div style={{ borderBottom: '1px solid hsl(var(--border))', display: 'flex', gap: 16 }}>
        {tournamentTabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '11px 2px 9px',
                fontSize: 16,
                whiteSpace: 'nowrap',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                letterSpacing: isActive ? '-0.025em' : '0',
                position: 'relative',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.18s',
              }}
            >
              {tab.label}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2.5,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #D97706, #F7931E)',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
