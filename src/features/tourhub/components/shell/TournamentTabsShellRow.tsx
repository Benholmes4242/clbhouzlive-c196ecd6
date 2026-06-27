import { memo } from 'react';
import type { TournamentTab } from '../tournament-detail';

import { FONT } from '../../_shared/tokens';

interface TabDef {
  value: TournamentTab;
  label: string;
}

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
  /** Transparent variant for floating over a full-bleed hero. White tabs + subtle scrim. */
  overlay?: boolean;
}

function TournamentTabsShellRowInner({ activeTab, onChange, overlay = false }: Props) {
  return (
    <>
      <style>{`[data-tournament-tabs]::-webkit-scrollbar { display: none; }`}</style>
      <div style={{ position: 'relative' }}>
        {overlay && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(15,23,42,0.35), rgba(15,23,42,0))',
              pointerEvents: 'none',
            }}
          />
        )}
        <div
          data-tournament-tabs
          role="tablist"
          aria-label="Tournament Sections"
          style={{
            position: 'relative',
            display: 'flex',
            gap: 8,
            padding: '0 16px',
            background: overlay ? 'transparent' : '#F8FAFC',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            fontFamily: FONT,
            transition: 'background 0.2s ease',
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            const activeColor = overlay ? '#FFFFFF' : '#0A0E14';
            const inactiveColor = overlay ? 'rgba(255,255,255,0.7)' : '#64748B';
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
                  color: isActive ? activeColor : inactiveColor,
                  background: 'transparent',
                  border: 'none',
                  letterSpacing: '-0.005em',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'color 0.2s ease',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    paddingBottom: 4,
                    borderBottom: `1.5px solid ${isActive ? activeColor : 'transparent'}`,
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export const TournamentTabsShellRow = memo(TournamentTabsShellRowInner);
export default TournamentTabsShellRow;
