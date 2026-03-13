/**
 * LeadersCategoryPicker — Matches PlayersTourFilter pill style.
 * No fade mask. Active: bg-card with shadow. Inactive: bg-muted.
 */

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { LeaderCategory } from './constants';

interface LeadersCategoryPickerProps {
  categories: LeaderCategory[];
  activeKey: string;
  onCategoryChange: (key: string) => void;
  leaderValue?: string;
}

export function LeadersCategoryPicker({
  categories,
  activeKey,
  onCategoryChange,
  leaderValue,
}: LeadersCategoryPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active pill into view on mount / category change
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeEl = container.querySelector(`[data-category="${activeKey}"]`) as HTMLElement;
    if (activeEl) {
      const containerRect = container.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      const scrollLeft = elRect.left - containerRect.left - containerRect.width / 2 + elRect.width / 2 + container.scrollLeft;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeKey]);

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
      role="group"
      aria-label="Filter by category"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      {categories.map((cat) => {
        const isActive = activeKey === cat.key;
        const Icon = cat.icon;

        return (
          <motion.button
            key={cat.key}
            data-category={cat.key}
            onClick={() => onCategoryChange(cat.key)}
            aria-pressed={isActive}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap',
              'text-xs font-semibold transition-colors duration-200',
              'min-h-[44px]',
              isActive
                ? 'bg-card text-foreground shadow-sm border border-border/40'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {cat.shortLabel}
          </motion.button>
        );
      })}
    </div>
  );
}
