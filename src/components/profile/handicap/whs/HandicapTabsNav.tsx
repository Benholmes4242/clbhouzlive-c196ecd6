import React from 'react';
import SegmentedControl from '@/components/discover/SegmentedControl';
import type { HandicapSubtab } from './types';

interface Props {
  active: HandicapSubtab;
  onChange: (next: HandicapSubtab) => void;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'trends', label: 'Trends' },
  { id: 'friends', label: 'Friends' },
];

export const HandicapTabsNav: React.FC<Props> = ({ active, onChange }) => {
  return (
    <div className="[&_[role=tablist]]:!border-b-0">
      <SegmentedControl
        tabs={TABS}
        activeTab={active}
        onTabChange={(id) => onChange(id as HandicapSubtab)}
      />
    </div>
  );
};

export default HandicapTabsNav;
