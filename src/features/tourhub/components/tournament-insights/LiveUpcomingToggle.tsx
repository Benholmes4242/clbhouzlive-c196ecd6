/**
 * LiveUpcomingToggle - Wrapper around shared SegmentedControl
 */

import React from 'react';
import SegmentedControl from './components/SegmentedControl';
import type { IntelligenceView } from './types';

interface LiveUpcomingToggleProps {
  activeView: IntelligenceView;
  onViewChange: (view: IntelligenceView) => void;
  hasUpcoming?: boolean;
  isLive?: boolean;
}

export const LiveUpcomingToggle: React.FC<LiveUpcomingToggleProps> = ({
  activeView,
  onViewChange,
  hasUpcoming = true,
  isLive = false,
}) => {
  return (
    <SegmentedControl
      options={[
        { label: isLive ? 'Live' : 'Current', value: 'live', showLiveDot: isLive },
        { label: 'Next Up', value: 'upcoming', hidden: !hasUpcoming },
      ]}
      value={activeView}
      onChange={(v) => onViewChange(v as IntelligenceView)}
    />
  );
};
