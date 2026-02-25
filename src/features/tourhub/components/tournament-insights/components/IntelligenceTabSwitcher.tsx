/**
 * IntelligenceTabSwitcher - Wrapper around shared SegmentedControl
 */

import React from 'react';
import SegmentedControl from './SegmentedControl';

type IntelligenceTab = 'courseDNA' | 'predictions';

interface IntelligenceTabSwitcherProps {
  activeTab: IntelligenceTab;
  onTabChange: (tab: IntelligenceTab) => void;
  picksFirst?: boolean;
}

const IntelligenceTabSwitcher: React.FC<IntelligenceTabSwitcherProps> = ({ activeTab, onTabChange, picksFirst = false }) => {
  const options = picksFirst
    ? [
        { label: 'Top 5 Picks', value: 'predictions' },
        { label: 'Course DNA', value: 'courseDNA' },
      ]
    : [
        { label: 'Course DNA', value: 'courseDNA' },
        { label: 'Top 5 Picks', value: 'predictions' },
      ];

  return (
    <SegmentedControl
      options={options}
      value={activeTab}
      onChange={(v) => onTabChange(v as IntelligenceTab)}
      className="mb-4"
    />
  );
};

export default IntelligenceTabSwitcher;
