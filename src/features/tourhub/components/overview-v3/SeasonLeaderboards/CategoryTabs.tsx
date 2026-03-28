/**
 * CategoryTabs - Category Filter Pills with emoji labels
 * 
 * Features:
 * - Category accent colors for active state
 * - Edge fade gradients to prevent clipping
 * - Emoji + gamified names (no SVG icons)
 * - Focus-visible outlines
 * - Horizontal scroll with snap
 */

import { useRef, useEffect, useState, memo } from 'react';
import type { CategoryId } from './StatCategoryIcons';
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

  return (
    <div className="relative">
      {/* Left fade */}
      <div 
        className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none transition-opacity duration-200"
        style={{ 
          width: '32px',
          background: 'linear-gradient(to right, hsl(var(--background)) 0%, transparent 100%)',
          opacity: showLeftFade ? 1 : 0,
        }}
      />
      
      {/* Right fade */}
      <div 
        className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none transition-opacity duration-200"
        style={{ 
          width: '32px',
          background: 'linear-gradient(to left, hsl(var(--background)) 0%, transparent 100%)',
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
                padding: '6px 12px',
                gap: '6px',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 500,
                borderRadius: 8,
                background: isActive ? 'hsl(var(--foreground))' : 'transparent',
                border: isActive 
                  ? 'none' 
                  : '1px solid hsl(var(--border))',
                color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
                boxShadow: 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                outlineColor: 'hsl(var(--ring))',
              }}
            >
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
