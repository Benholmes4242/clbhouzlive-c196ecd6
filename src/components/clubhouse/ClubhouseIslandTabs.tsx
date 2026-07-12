/**
 * ClubhouseIslandTabs — segmented Suggested/Friends toggle rendered inside
 * the ChromeIsland's LEFT capsule slot. Wired to the same activeTab /
 * onTabChange contract the retired ClubhouseTopBar consumed.
 *
 * Presentational only. State (activeTab, business-actor detection) lives
 * in the page so the slot node stays a stable derived element.
 */
import React from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';

export type ClubhouseTab = 'foryou' | 'friends';

export interface ClubhouseIslandTabsProps {
  activeTab: ClubhouseTab;
  onTabChange: (tab: ClubhouseTab) => void;
  /** Business actor sees Suggested only (mirrors ClubhouseTabToggle). */
  isBusinessActor?: boolean;
}

const PILL_ACTIVE_BG = 'rgba(255,255,255,0.92)';
const PILL_ACTIVE_INK = '#0F172A';
const PILL_INACTIVE_INK = 'rgba(255,255,255,0.75)';

const pillBase: React.CSSProperties = {
  fontFamily: 'Geist, system-ui, sans-serif',
  fontWeight: 700,
  fontSize: 11.5,
  padding: '6px 13px',
  borderRadius: 999,
  border: 'none',
  cursor: 'pointer',
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
  transition: 'all .15s',
};

export const ClubhouseIslandTabs: React.FC<ClubhouseIslandTabsProps> = ({
  activeTab,
  onTabChange,
  isBusinessActor = false,
}) => {
  if (isBusinessActor) {
    return (
      <div
        role="tablist"
        aria-label="Feed filter"
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        <span
          style={{
            ...pillBase,
            background: PILL_ACTIVE_BG,
            color: PILL_ACTIVE_INK,
            cursor: 'default',
          }}
        >
          Suggested
        </span>
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Feed filter"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
    >
      {(['foryou', 'friends'] as const).map((id) => {
        const label = id === 'foryou' ? 'Suggested' : 'Friends';
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              if (id === activeTab) return;
              onTabChange(id);
              analyticsEvents.track('feed_tab_switch', {
                tab: id === 'foryou' ? 'suggested' : 'friends',
              });
            }}
            style={{
              ...pillBase,
              background: isActive ? PILL_ACTIVE_BG : 'transparent',
              color: isActive ? PILL_ACTIVE_INK : PILL_INACTIVE_INK,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default ClubhouseIslandTabs;
