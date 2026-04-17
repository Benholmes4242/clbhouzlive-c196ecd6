import React from 'react';
import { PillTabs, PillOption } from '@/components/ui/PillTabs';

export type SortOption = 'recent' | 'highest' | 'helpful';

interface SortFilterBarProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onFilterClick?: () => void;
}

export const SortFilterBar: React.FC<SortFilterBarProps> = ({
  sortBy,
  onSortChange,
  onFilterClick,
}) => {
  const sortOptions: PillOption[] = [
    { id: 'recent', label: 'Most recent' },
    { id: 'highest', label: 'Highest rated' },
    { id: 'helpful', label: 'Most helpful' },
  ];

  return (
    <section className="px-4 py-3 bg-slate-50">
      <PillTabs
        className="justify-center"
        options={sortOptions}
        activeId={sortBy}
        onChange={(id) => onSortChange(id as SortOption)}
      />
    </section>
  );
};
