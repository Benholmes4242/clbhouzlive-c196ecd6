import React from 'react';
import { PillTabs, type PillOption } from '@/components/ui/PillTabs';

export type FeedFilter = 'all' | 'trending' | 'new_for_you';

interface FeedFilterChipsProps {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

const FILTER_OPTIONS: PillOption[] = [
  { id: 'all', label: 'All' },
  { id: 'trending', label: 'Trending' },
  { id: 'new_for_you', label: 'New for you' },
];

const FeedFilterChips: React.FC<FeedFilterChipsProps> = ({ activeFilter, onFilterChange }) => {
  return (
    <PillTabs
      options={FILTER_OPTIONS}
      activeId={activeFilter}
      onChange={(id) => onFilterChange(id as FeedFilter)}
    />
  );
};

export default FeedFilterChips;
