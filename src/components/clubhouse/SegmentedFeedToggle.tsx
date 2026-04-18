import React from 'react';
import type { ClubhouseTab } from './ClubhouseTabToggle';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface SegmentedFeedToggleProps {
  activeTab: ClubhouseTab;
  onTabChange: (tab: ClubhouseTab) => void;
  isBusinessActor?: boolean;
}

/**
 * SegmentedFeedToggle — amber-free segmented control for the Clubhouse feed filter.
 * Lives as the bottom row inside the identity pill. White thumb slides between
 * Suggested and Friends. Business actors see a static "Suggested" label with no
 * switcher since they have no Friends feed.
 */
export const SegmentedFeedToggle: React.FC<SegmentedFeedToggleProps> = ({
  activeTab,
  onTabChange,
  isBusinessActor = false,
}) => {
  // Business actors see a static label, no switcher
  if (isBusinessActor) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 27,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '-0.005em',
          color: 'rgba(255, 255, 255, 0.92)',
        }}
      >
        Suggested
      </div>
    );
  }

  const isFriends = activeTab === 'friends';

  const handleChange = (tab: ClubhouseTab) => {
    onTabChange(tab);
    analyticsEvents.track('feed_tab_switch', { tab: tab === 'foryou' ? 'suggested' : 'friends' });
  };

  return (
    <div
      role="tablist"
      aria-label="Feed filter"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 999,
        padding: 3,
      }}
    >
      {/* Animated white thumb */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 3,
          bottom: 3,
          left: 3,
          width: 'calc(50% - 3px)',
          background: '#FFFFFF',
          borderRadius: 999,
          transform: isFriends ? 'translateX(100%)' : 'translateX(0)',
          transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 0,
        }}
      />

      {/* Suggested */}
      <button
        type="button"
        role="tab"
        aria-selected={!isFriends}
        onClick={() => handleChange('foryou')}
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          padding: '5px 12px',
          border: 'none',
          background: 'transparent',
          fontFamily: 'inherit',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '-0.005em',
          color: !isFriends ? '#0b0f14' : 'rgba(255, 255, 255, 0.5)',
          transition: 'color 0.18s',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Suggested
      </button>

      {/* Friends */}
      <button
        type="button"
        role="tab"
        aria-selected={isFriends}
        onClick={() => handleChange('friends')}
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          padding: '5px 12px',
          border: 'none',
          background: 'transparent',
          fontFamily: 'inherit',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '-0.005em',
          color: isFriends ? '#0b0f14' : 'rgba(255, 255, 255, 0.5)',
          transition: 'color 0.18s',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Friends
      </button>
    </div>
  );
};

export default SegmentedFeedToggle;
