/**
 * LeadersCategorySheet — Full-width selector button + BottomSheet
 * for choosing leaderboard categories, organized in grouped grid.
 */

import { useState, useCallback } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { LeaderCategory } from './constants';

interface CategoryGroup {
  label: string;
  categories: LeaderCategory[];
}

const CATEGORY_GROUPS: { label: string; keys: string[] }[] = [
  { label: 'General', keys: ['world_rank', 'events_played', 'cuts_made', 'top_10'] },
  { label: 'Scoring', keys: ['earnings', 'scoring_avg'] },
  { label: 'Ball Striking', keys: ['drive_avg', 'drive_acc', 'gir_pct'] },
  { label: 'Short Game', keys: ['putt_avg', 'sand_saves_pct', 'scrambling_pct'] },
];

interface LeadersCategorySheetProps {
  categories: LeaderCategory[];
  activeKey: string;
  onCategoryChange: (key: string) => void;
}

export function LeadersCategorySheet({
  categories,
  activeKey,
  onCategoryChange,
}: LeadersCategorySheetProps) {
  const [open, setOpen] = useState(false);

  const activeCategory = categories.find((c) => c.key === activeKey) || categories[0];
  const ActiveIcon = activeCategory.icon;

  const groups: CategoryGroup[] = CATEGORY_GROUPS.map((g) => ({
    label: g.label,
    categories: g.keys
      .map((k) => categories.find((c) => c.key === k))
      .filter(Boolean) as LeaderCategory[],
  }));

  const handleSelect = useCallback(
    (key: string) => {
      onCategoryChange(key);
      setOpen(false);
    },
    [onCategoryChange]
  );

  return (
    <>
      {/* Selector Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'w-full flex items-center justify-between',
          'bg-card border border-border/50 rounded-[14px]',
          'px-4 py-3.5',
          'shadow-[0_1px_4px_rgba(0,0,0,0.04)]',
          'transition-all duration-200',
          'hover:border-[hsl(var(--accent-amber))] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
          'active:scale-[0.99]'
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <ActiveIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">{activeCategory.shortLabel}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
            Leaderboard
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Bottom Sheet */}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabelledBy="leaders-category-sheet-title"
      >
        <div
          className="overflow-y-auto overscroll-contain px-5 pb-6"
          style={{ maxHeight: 'calc(70vh - 60px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2
              id="leaders-category-sheet-title"
              className="text-lg font-bold text-foreground"
            >
              Leaderboard Category
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Grouped grid */}
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-muted-foreground mb-2">
                  {group.label}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {group.categories.map((cat) => {
                    const isActive = activeKey === cat.key;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => handleSelect(cat.key)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-[14px] px-4 py-3.5',
                          'text-left transition-all duration-150',
                          'border',
                          isActive
                            ? 'bg-[#1a472a] border-[#1a472a] text-white'
                            : 'bg-card border-border/40 text-foreground hover:border-border'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-4 h-4 shrink-0',
                            isActive ? 'text-white/80' : 'text-muted-foreground'
                          )}
                        />
                        <span className="text-sm font-semibold flex-1 truncate">
                          {cat.shortLabel}
                        </span>
                        {isActive && (
                          <Check className="w-4 h-4 text-[#E09F3E] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safe area bottom padding */}
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
      </BottomSheet>
    </>
  );
}