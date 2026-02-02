// src/features/tourhub/components/overview-v3/SeasonLeaderboards/CategoryTabs.tsx

import { useRef, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
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
      className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide -mx-4"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {categories.map((category) => {
        const isActive = category.id === activeCategory;

        return (
          <button
            key={category.id}
            ref={isActive ? activeRef : null}
            onClick={() => onCategoryChange(category.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 rounded-full
              font-medium text-sm whitespace-nowrap transition-colors duration-200
              flex-shrink-0
              ${
                isActive
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
              }
            `}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>

            {isActive && (
              <motion.div
                layoutId="categoryIndicator"
                className="absolute inset-0 bg-gray-900 rounded-full -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
});
