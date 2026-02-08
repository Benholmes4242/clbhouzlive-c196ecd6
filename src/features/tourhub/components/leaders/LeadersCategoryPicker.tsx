/**
 * LeadersCategoryPicker — Single scrollable row with section dividers.
 * Active pill shows leader value inline. Fade edges with mask-image.
 */

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { LeaderCategory } from './constants';

interface LeadersCategoryPickerProps {
  categories: LeaderCategory[];
  activeKey: string;
  onCategoryChange: (key: string) => void;
  leaderValue?: string;
}

function CategoryChip({
  category,
  isActive,
  onClick,
  leaderValue,
}: {
  category: LeaderCategory;
  isActive: boolean;
  onClick: () => void;
  leaderValue?: string;
}) {
  const Icon = category.icon;
  return (
    <button
      onClick={onClick}
      data-category={category.key}
      className={cn(
        'px-3 py-2 rounded-full text-xs font-semibold shrink-0',
        'flex items-center gap-1.5',
        'active:scale-[0.95] transition-all duration-200',
        isActive
          ? 'bg-foreground text-background shadow-sm'
          : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/30'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {category.shortLabel}
      {isActive && leaderValue && (
        <span className="text-[10px] font-mono opacity-70 ml-0.5">
          • {leaderValue}
        </span>
      )}
    </button>
  );
}

function SectionDivider() {
  return (
    <div className="w-px h-5 bg-border/60 shrink-0 mx-0.5" />
  );
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

  // Split categories into sections for dividers
  const performance = categories.filter((c) => c.section === 'performance');
  const stats = categories.filter((c) => c.section === 'stats');

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)',
      }}
    >
      {/* Performance pills */}
      {performance.map((cat) => (
        <CategoryChip
          key={cat.key}
          category={cat}
          isActive={activeKey === cat.key}
          onClick={() => onCategoryChange(cat.key)}
          leaderValue={activeKey === cat.key ? leaderValue : undefined}
        />
      ))}

      <SectionDivider />

      {/* Ball Striking & Short Game pills */}
      {stats.map((cat) => (
        <CategoryChip
          key={cat.key}
          category={cat}
          isActive={activeKey === cat.key}
          onClick={() => onCategoryChange(cat.key)}
          leaderValue={activeKey === cat.key ? leaderValue : undefined}
        />
      ))}
    </div>
  );
}
