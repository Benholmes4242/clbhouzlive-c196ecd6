/**
 * CategoryTabs - Redesigned Category Filter Pills
 * 
 * Features:
 * - Solid green active state with white text
 * - SVG icons (no emojis)
 * - Focus-visible outlines
 * - Horizontal scroll with snap
 */

import { useRef, useEffect, memo } from 'react';
import { CATEGORY_ICONS, type CategoryId } from './StatCategoryIcons';

interface CategoryConfig {
  id: CategoryId;
  name: string;
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
      className="flex overflow-x-auto px-4 py-1 scrollbar-hide -mx-4"
      style={{ 
        gap: '6px',
        scrollbarWidth: 'none', 
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
      role="tablist"
      aria-label="Statistical categories"
    >
      {categories.map((category) => {
        const isActive = category.id === activeCategory;
        const IconComponent = CATEGORY_ICONS[category.id];

        return (
          <button
            key={category.id}
            ref={isActive ? activeRef : null}
            onClick={() => onCategoryChange(category.id)}
            role="tab"
            aria-selected={isActive}
            aria-label={`${category.name} category`}
            className="flex items-center rounded-full whitespace-nowrap transition-all duration-200 flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#165A32] focus-visible:outline-offset-2"
            style={{
              padding: '7px 13px',
              gap: '5px',
              fontSize: '12.5px',
              fontWeight: isActive ? 700 : 500,
              background: isActive ? '#165A32' : '#FFFFFF',
              border: isActive ? '1.5px solid #165A32' : '1px solid rgba(0,0,0,0.09)',
              color: isActive ? '#FFFFFF' : 'rgba(11,18,32,0.65)',
              boxShadow: isActive 
                ? '0 2px 8px rgba(22,90,50,0.15)' 
                : '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <IconComponent size={13} />
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
});
