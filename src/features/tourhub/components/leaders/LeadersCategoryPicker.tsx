/**
 * LeadersCategoryPicker — Chip selector grouped by section.
 * Semantic tokens only, active:scale tap feedback.
 */

import { cn } from '@/lib/utils';
import {
  PERFORMANCE_CATEGORIES,
  STATS_CATEGORIES,
  type LeaderCategory,
} from './constants';

interface LeadersCategoryPickerProps {
  categories: LeaderCategory[];
  activeKey: string;
  onCategoryChange: (key: string) => void;
}

function CategoryChip({
  category,
  isActive,
  onClick,
}: {
  category: LeaderCategory;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = category.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 rounded-lg text-xs font-semibold',
        'flex items-center gap-1.5',
        'active:scale-[0.95] transition-all duration-200',
        isActive
          ? 'bg-foreground text-background shadow-sm'
          : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/30'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {category.shortLabel}
    </button>
  );
}

export function LeadersCategoryPicker({
  categories,
  activeKey,
  onCategoryChange,
}: LeadersCategoryPickerProps) {
  const performance = categories.filter((c) => c.section === 'performance');
  const stats = categories.filter((c) => c.section === 'stats');

  return (
    <div className="space-y-4">
      {/* Season Performance */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Season Performance
        </p>
        <div className="flex flex-wrap gap-2">
          {performance.map((cat) => (
            <CategoryChip
              key={cat.key}
              category={cat}
              isActive={activeKey === cat.key}
              onClick={() => onCategoryChange(cat.key)}
            />
          ))}
        </div>
      </div>

      {/* Ball Striking & Short Game */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Ball Striking & Short Game
        </p>
        <div className="flex flex-wrap gap-2">
          {stats.map((cat) => (
            <CategoryChip
              key={cat.key}
              category={cat}
              isActive={activeKey === cat.key}
              onClick={() => onCategoryChange(cat.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
