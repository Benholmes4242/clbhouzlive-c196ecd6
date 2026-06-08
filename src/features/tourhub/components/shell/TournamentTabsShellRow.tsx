import { memo } from 'react';
import type { TournamentTab } from '../tournament-detail';

import { FONT } from '../../_shared/tokens';

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
    <>
      <style>{`[data-tournament-tabs]::-webkit-scrollbar { display: none; }`}</style>
      <div
        data-tournament-tabs
        role="tablist"
        aria-label="Tournament Sections"
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 16px',
          background: '#F8FAFC',
          borderBottom: `0.5px solid rgba(15,23,42,0.08)`,
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          fontFamily: FONT,
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
                flex: '0 0 auto',
                height: 44,
                padding: '0 4px',
                fontSize: 14,
                fontWeight: isActive ? 700 : 600,
                color: isActive ? SURFACE : WHITE_ALPHA_55,
                background: 'transparent',
                border: 'none',
                letterSpacing: '-0.005em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  paddingBottom: 4,
                  borderBottom: `1.5px solid ${isActive ? SURFACE : 'transparent'}`,
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export const TournamentTabsShellRow = memo(TournamentTabsShellRowInner);
export default TournamentTabsShellRow;
