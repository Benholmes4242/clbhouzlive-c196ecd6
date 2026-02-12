/**
 * CategoryTabs - Redesigned Category Filter Pills
 * 
 * Features:
 * - Category accent colors for active state
 * - Edge fade gradients to prevent clipping
 * - SVG icons (no emojis)
 * - Focus-visible outlines
 * - Horizontal scroll with snap
 */

import { useRef, useEffect, useState, memo } from 'react';
import { CATEGORY_ICONS, type CategoryId } from './StatCategoryIcons';
import { CATEGORY_ACCENT_COLORS } from './constants';

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
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  // Handle scroll to update fade visibility
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftFade(scrollLeft > 8);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 8);
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const activeEl = activeRef.current;
      const scrollLeft =
        activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeCategory]);

  const accentColors = CATEGORY_ACCENT_COLORS[activeCategory];

  return (
    <div className="relative">
      {/* Left fade */}
      <div 
        className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none transition-opacity duration-200"
        style={{ 
          width: '32px',
          background: 'linear-gradient(to right, #f8fafc 0%, transparent 100%)',
          opacity: showLeftFade ? 1 : 0,
        }}
      />
      
      {/* Right fade */}
      <div 
        className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none transition-opacity duration-200"
        style={{ 
          width: '32px',
          background: 'linear-gradient(to left, #f8fafc 0%, transparent 100%)',
          opacity: showRightFade ? 1 : 0,
        }}
      />

      <div
        ref={scrollRef}
        className="flex overflow-x-auto py-1 scrollbar-hide"
        style={{ 
          gap: '8px',
          padding: '0 16px',
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
          const categoryAccent = CATEGORY_ACCENT_COLORS[category.id];

          return (
            <button
              key={category.id}
              ref={isActive ? activeRef : null}
              onClick={() => onCategoryChange(category.id)}
              role="tab"
              aria-selected={isActive}
              aria-label={`${category.name} category`}
              className="flex items-center whitespace-nowrap flex-shrink-0 active:scale-95 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                padding: '8px 14px',
                gap: '6px',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 500,
                borderRadius: '10px',
                background: isActive ? categoryAccent.primary : '#FFFFFF',
                border: isActive 
                  ? `1px solid ${categoryAccent.primary}` 
                  : '1px solid rgba(0, 0, 0, 0.08)',
                color: isActive ? '#FFFFFF' : 'rgba(0, 0, 0, 0.45)',
                boxShadow: isActive 
                  ? `0 2px 8px ${categoryAccent.shadow}` 
                  : 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                outlineColor: categoryAccent.primary,
              }}
            >
              <IconComponent size={14} />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
