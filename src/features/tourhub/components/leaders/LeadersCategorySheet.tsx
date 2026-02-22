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
  { label: 'General', keys: ['world_rank', 'events_played', 'cuts_made', 'top_10', 'earnings', 'scoring_avg'] },
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
      {/* Selector Button — rounded-2xl, bg-card, border */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between active:scale-[0.99] transition-all duration-200"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border) / 0.5)',
          borderRadius: 16,
          padding: '12px 16px',
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <ActiveIcon className="w-5 h-5 text-muted-foreground" />
          <span style={{ fontSize: 14, fontWeight: 600 }} className="text-foreground">{activeCategory.shortLabel}</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const }} className="text-muted-foreground">
            Leaderboard
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground opacity-60" />
      </button>

      {/* Bottom Sheet */}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabelledBy="leaders-category-sheet-title"
      >
        <div
          className="overflow-y-auto overscroll-contain pb-6"
          style={{ maxHeight: 'calc(70vh - 60px)', padding: '0 20px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between" style={{ padding: '20px 0 16px' }}>
            <h2
              id="leaders-category-sheet-title"
              style={{ fontSize: 18, fontWeight: 700 }}
              className="text-foreground"
            >
              Leaderboard Category
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-full bg-muted"
              style={{ width: 36, height: 36 }}
              aria-label="Close"
            >
              <X style={{ width: 20, height: 20 }} className="text-muted-foreground" />
            </button>
          </div>

          {/* Grouped grid */}
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.label}>
                {/* Section label */}
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase' as const,
                    marginTop: 20,
                    marginBottom: 10,
                  }}
                  className="text-muted-foreground/60"
                >
                  {group.label}
                </p>
                <div className="grid grid-cols-2" style={{ gap: 8 }}>
                  {group.categories.map((cat) => {
                    const isActive = activeKey === cat.key;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => handleSelect(cat.key)}
                        className={cn(
                          'flex items-center gap-2.5 text-left transition-all duration-150',
                        )}
                        style={{
                          borderRadius: 12,
                          padding: '14px 16px',
                          border: isActive
                            ? '1px solid hsl(var(--foreground))'
                            : '1px solid hsl(var(--border) / 0.5)',
                          background: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--card))',
                          color: isActive ? 'white' : 'hsl(var(--foreground))',
                          fontWeight: isActive ? 600 : 500,
                        }}
                      >
                        <Icon
                          className="w-5 h-5 shrink-0"
                          style={{
                            color: isActive ? 'white' : 'hsl(var(--muted-foreground) / 0.5)',
                          }}
                        />
                        <span style={{ fontSize: 14 }} className="flex-1 truncate">
                          {cat.shortLabel}
                        </span>
                        {isActive && (
                          <Check className="w-4 h-4 shrink-0" style={{ color: 'white' }} />
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
