/**
 * CategoryTabs - Redesigned Category Filter Pills
 * 
 * Features:
 * - Lighter styling with branded green selection
 * - Smooth color transition on selection
 * - Horizontal scroll with snap
 * - Accessibility with proper ARIA roles
 */

import { useRef, useEffect, memo } from 'react';
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
      className="flex gap-2 overflow-x-auto px-4 py-1 scrollbar-hide -mx-4"
      style={{ 
        scrollbarWidth: 'none', 
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
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
            role="tab"
            aria-selected={isActive}
            aria-label={`${category.name} category`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full font-medium text-[14px] whitespace-nowrap transition-all duration-200 flex-shrink-0 border"
            style={{
              background: isActive ? 'rgba(45, 122, 58, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: isActive ? 'rgba(45, 122, 58, 0.3)' : 'transparent',
              color: isActive ? '#2D7A3A' : '#666',
            }}
          >
            <span 
              className="text-base transition-opacity duration-200"
              style={{ opacity: isActive ? 1 : 0.7 }}
            >
              {category.icon}
            </span>
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
});
