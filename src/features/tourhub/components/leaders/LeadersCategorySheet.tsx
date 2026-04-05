/**
 * LeadersCategorySheet — Full-width selector button + BottomSheet
 * for choosing leaderboard categories, organized in grouped grid.
 * Supports external open control via optional externalOpen/onExternalClose props.
 */

import { useState, useCallback, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { LeaderCategory } from './constants';

interface CategoryGroup {
  label: string;
  categories: LeaderCategory[];
}

const CATEGORY_GROUPS: { label: string; keys: string[] }[] = [
  { label: 'General', keys: ['world_rank', 'events_played', 'cuts_made', 'top_10', 'earnings', 'strokes_gained_total', 'scoring_avg'] },
  { label: 'Ball Striking', keys: ['drive_avg', 'drive_acc', 'gir_pct'] },
  { label: 'Short Game', keys: ['putt_avg', 'sand_saves_pct', 'scrambling_pct'] },
];

interface LeadersCategorySheetProps {
  categories: LeaderCategory[];
  activeKey: string;
  onCategoryChange: (key: string) => void;
  leaderValue?: string;
  /** When provided, external code controls open state */
  externalOpen?: boolean;
  onExternalClose?: () => void;
  /** Hide the built-in trigger button when using external trigger */
  hideTrigger?: boolean;
}

export function LeadersCategorySheet({
  categories,
  activeKey,
  onCategoryChange,
  leaderValue,
  externalOpen,
  onExternalClose,
  hideTrigger = false,
}: LeadersCategorySheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Sync external open state
  useEffect(() => {
    if (externalOpen !== undefined) {
      setInternalOpen(externalOpen);
    }
  }, [externalOpen]);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const closeSheet = useCallback(() => {
    setInternalOpen(false);
    onExternalClose?.();
  }, [onExternalClose]);

  const activeCategory = categories.find((c) => c.key === activeKey) || categories[0];
  const activeEmoji = (activeCategory as any).emoji;

  const groups: CategoryGroup[] = CATEGORY_GROUPS.map((g) => ({
    label: g.label,
    categories: g.keys
      .map((k) => categories.find((c) => c.key === k))
      .filter(Boolean) as LeaderCategory[],
  }));

  const handleSelect = useCallback(
    (key: string) => {
      onCategoryChange(key);
      setInternalOpen(false);
      onExternalClose?.();
    },
    [onCategoryChange, onExternalClose]
  );

  return (
    <>
      {/* Selector Button — hidden when external trigger is used */}
      {!hideTrigger && (
        <button
          onClick={() => setInternalOpen(true)}
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
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
              {activeEmoji}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600 }} className="text-foreground">{activeCategory.shortLabel}</span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const }} className="text-muted-foreground">
              Leaderboard
            </span>
            {leaderValue && (
              <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                · {leaderValue}
              </span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground opacity-60" />
        </button>
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        open={open}
        onClose={closeSheet}
        ariaLabelledBy="leaders-category-sheet-title"
      >
        <div
          className="overflow-y-auto overscroll-contain px-4 pb-2"
          style={{ maxHeight: 'calc(70vh - 60px)' }}
        >
          {/* Header */}
          <div style={{ paddingBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Category
            </div>
            <div id="leaders-category-sheet-title" style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }} className="text-foreground">
              Performance Category
            </div>
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
                  className="text-muted-foreground/70"
                >
                  {group.label}
                </p>
                <div className="grid grid-cols-2" style={{ gap: 8 }} role="group" aria-label={group.label}>
                  {group.categories.map((cat) => {
                    const isActive = activeKey === cat.key;
                    const emoji = (cat as any).emoji;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => handleSelect(cat.key)}
                        aria-pressed={isActive}
                        className={cn(
                          'flex flex-col text-left transition-all duration-150',
                        )}
                        style={{
                          borderRadius: 12,
                          padding: '12px 14px',
                          minWidth: 0,
                          border: isActive
                            ? '1.5px solid hsl(var(--accent-amber) / 0.40)'
                            : '1px solid hsl(var(--border) / 0.5)',
                          background: isActive ? 'hsl(var(--accent-amber) / 0.10)' : 'hsl(var(--card))',
                          color: 'hsl(var(--foreground))',
                          fontWeight: isActive ? 700 : 500,
                        }}
                      >
                        <div className="flex items-center gap-2.5 w-full min-w-0">
                          <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>
                            {emoji}
                          </span>
                          <span style={{ fontSize: 14 }} className="flex-1 truncate">
                            {cat.shortLabel}
                          </span>


                        </div>
                        {(cat as any).tourAverage && (
                          <span
                            style={{
                              fontSize: 11,
                              color: 'hsl(var(--muted-foreground) / 0.5)',
                              display: 'block',
                              marginTop: 2,
                              lineHeight: 1.3,
                            }}
                            className="truncate"
                          >
                            Tour avg: {(cat as any).tourAverage}
                          </span>
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
        <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px)' }} />
      </BottomSheet>
    </>
  );
}
