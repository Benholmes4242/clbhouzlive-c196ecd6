/**
 * FilterBar - Video category filter pills for videos2 feature
 * 
 * Now uses unified CategoryPills component with full category definitions.
 * Maintains backward compatibility with VideoFilter type mapping.
 */
import React from 'react';
import { CategoryPills } from '@/components/shared/CategoryPills';

type FilterBarProps = {
  active: string;
  onChange: (filter: string) => void;
};

export function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <CategoryPills
      selectedCategory={active}
      onCategoryChange={onChange}
      showIcons={true}
    />
  );
}