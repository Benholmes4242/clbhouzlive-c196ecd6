import { memo } from 'react';
import type { TournamentTab } from '../tournament-detail';

interface TabDef {
  value: TournamentTab;
  label: string;
}

// Always show all five tabs. Tab content handles its own empty/loading state
// (e.g. Summary renders an empty state for in-progress tournaments; Overview
// renders a "tournament complete" view for closed ones).
const TABS: TabDef[] = [
  { value: 'overview',    label: 'Overview' },
  { value: 'leaderboard', label: 'Leaderboard' },
  { value: 'summary',     label: 'Summary' },
  { value: 'tee-times',   label: 'Tee Times' },
  { value: 'hole-stats',  label: 'Holes' },
];

interface Props {
  activeTab: TournamentTab;
  onChange: (tab: TournamentTab) => void;
}

/**
 * Tour Hub detail/subpage variant — Row 1 of <ShellSlot> for Tournament Detail.
 * 5-tab equal-width strip. Always shows all tabs unconditionally; tab content
 * owns its own empty/loading state per tournament status.
 */
function TournamentTabsShellRowInner({ activeTab, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Tournament Sections"
      style={{
        display: 'flex',
        background: 'var(--hcp-bg-0)',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      {TABS.map((tab) => {
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
              fontSize: 12,
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
