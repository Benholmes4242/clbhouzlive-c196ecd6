import { memo } from 'react';
import type { TournamentTab } from '../tournament-detail';

interface TabDef {
  value: TournamentTab;
  label: string;
}

const LIVE_TABS: TabDef[] = [
  { value: 'overview',    label: 'Overview' },
  { value: 'leaderboard', label: 'Leaderboard' },
  { value: 'tee-times',   label: 'Tee Times' },
  { value: 'hole-stats',  label: 'Holes' },
];

const COMPLETED_TABS: TabDef[] = [
  { value: 'summary',     label: 'Summary' },
  { value: 'leaderboard', label: 'Leaderboard' },
  { value: 'tee-times',   label: 'Tee Times' },
  { value: 'hole-stats',  label: 'Holes' },
];

interface Props {
  activeTab: TournamentTab;
  isCompleted: boolean;
  onChange: (tab: TournamentTab) => void;
}

/**
 * Tour Hub detail/subpage variant — Row 1 of <ShellSlot> for Tournament Detail.
 * 4-tab equal-width underline strip. Tabs vary by tournament status (live vs completed).
 */
function TournamentTabsShellRowInner({ activeTab, isCompleted, onChange }: Props) {
  const tabs = isCompleted ? COMPLETED_TABS : LIVE_TABS;
  return (
    <div
      role="tablist"
      aria-label="Tournament Sections"
      style={{
        display: 'flex',
        background: '#F8FAFC',
        borderBottom: '0.5px solid rgba(15,23,42,0.08)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className="active:opacity-70 transition-opacity"
            style={{
              flex: 1,
              padding: '12px 0',
              fontSize: '12px',
              fontWeight: isActive ? 800 : 600,
              color: isActive ? '#0F172A' : '#94A3B8',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid #F7931E' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap' as const,
              textAlign: 'center' as const,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export const TournamentTabsShellRow = memo(TournamentTabsShellRowInner);
export default TournamentTabsShellRow;
