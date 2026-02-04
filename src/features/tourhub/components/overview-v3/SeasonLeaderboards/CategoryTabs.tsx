/**
 * CategoryTabs - Redesigned category filter pills
 * 
 * Features:
 * - Lighter unselected state (gray/4)
 * - Selected state with green tint (#2D7A3A)
 * - Smooth 200ms transitions
 * - Horizontal scroll with auto-center
 * - Accessibility: role="tablist"
 */

import { useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import type { CategoryId } from './types';

interface CategoryConfig {
  id: CategoryId;
  name: string;
  icon: string;
}

interface CategoryTabsProps {
  categories: CategoryConfig[];
  activeCategory: CategoryId;
  onCategoryChange: (id: CategoryId) => void;
}

export const CategoryTabs = memo(function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const activeEl = activeRef.current;
      const scrollLeft =
        activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeCategory]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto py-1 scrollbar-hide -mx-4 px-4"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      role="tablist"
      aria-label="Statistical categories"
    >
      {categories.map((category) => {
        const isActive = category.id === activeCategory;

        return (
          <button
            key={category.id}
            ref={isActive ? activeRef : null}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-full",
              "font-medium text-[14px] whitespace-nowrap transition-all duration-200",
              "flex-shrink-0 border",
              isActive
                ? "bg-[rgba(45,122,58,0.08)] border-[rgba(45,122,58,0.3)] text-[#2D7A3A]"
                : "bg-black/[0.04] border-transparent text-[#666] hover:bg-black/[0.06] active:bg-black/[0.08]"
            )}
            role="tab"
            aria-selected={isActive}
            aria-label={`${category.name} category`}
          >
            <span className={cn("text-base", isActive ? "opacity-100" : "opacity-70")}>
              {category.icon}
            </span>
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
});
