/**
 * LeadersCategorySheet — Dispatch-styled bottom sheet for choosing leaderboard categories.
 * Flat full-width rows with amber left stripe on active.
 */

import { useState, useCallback, useEffect } from 'react';
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
  categoryLeaderValues?: Record<string, { name: string; value: string }>;
  externalOpen?: boolean;
  onExternalClose?: () => void;
  hideTrigger?: boolean;
}

export function LeadersCategorySheet({
  categories,
  activeKey,
  onCategoryChange,
  leaderValue,
  categoryLeaderValues = {},
  externalOpen,
  onExternalClose,
  hideTrigger = false,
}: LeadersCategorySheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);

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
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#ffffff', border: '1px solid rgba(15,23,42,0.09)',
            borderRadius: '12px', padding: '12px 16px', cursor: 'pointer',
          }}
          className="active:scale-[0.99] transition-all duration-200"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>{activeEmoji}</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{activeCategory.shortLabel}</span>
          </div>
          <span style={{ fontSize: '11px', color: '#94A3B8' }}>▾</span>
        </button>
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        open={open}
        onClose={closeSheet}
        ariaLabelledBy="leaders-category-sheet-title"
      >
        <div
          style={{ maxHeight: 'calc(70vh - 60px)', paddingTop: '8px', overflowY: 'auto' }}
          className="overscroll-contain"
        >
          {/* Dispatch header */}
          <div style={{ padding: '0 20px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>
              LEADERBOARDS
            </div>
            <div id="leaders-category-sheet-title" style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>
              Performance Rankings
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.label}>
              {/* Group rule marker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px 8px' }}>
                <div style={{ width: 3, height: 12, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>
                  {group.label}
                </span>
              </div>

              {/* Category rows — flat, not grid tiles */}
              {group.categories.map((cat) => {
                const isActive = activeKey === cat.key;
                const leaderData = categoryLeaderValues?.[cat.key];
                const emoji = (cat as any).emoji;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleSelect(cat.key)}
                    aria-pressed={isActive}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '11px 20px',
                      background: isActive ? 'rgba(247,147,30,0.04)' : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? '3px solid #F7931E' : '3px solid transparent',
                      cursor: 'pointer', textAlign: 'left' as const,
                    }}
                  >
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: isActive ? 800 : 600, color: '#0F172A' }}>
                        {cat.shortLabel}
                      </div>
                      {leaderData ? (
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {leaderData.name} · {leaderData.value}
                        </div>
                      ) : (cat as any).tourAverage && (cat as any).tourAverage !== '—' ? (
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                          Tour avg: {(cat as any).tourAverage}
                        </div>
                      ) : null}
                    </div>
                    {isActive && (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F7931E', flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Safe area bottom padding */}
        <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px)' }} />
      </BottomSheet>
    </>
  );
}
