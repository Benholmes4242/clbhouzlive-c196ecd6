import { BottomSheet } from '@/components/ui/BottomSheet';
import type { CategoryChip } from './hooks/useWatchCategoryChips';

interface WatchMoreCategoriesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryChip[];
  activeTag: string;
  onSelect: (id: string) => void;
}

/**
 * Bottom sheet for the "More" overflow chip on the Watch tab.
 * Uses 'The Dispatch' canonical bottom-sheet style:
 *   - Hairline-separated flat rows
 *   - Active row: 3px amber left stripe, 4% amber tint, 6px amber dot
 *   - 8.5px bold uppercase amber eyebrow + 20px black title
 */
export default function WatchMoreCategoriesSheet({
  open,
  onOpenChange,
  categories,
  activeTag,
  onSelect,
}: WatchMoreCategoriesSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={() => onOpenChange(false)}
      ariaLabelledBy="watch-more-categories-title"
    >
      {/* Dispatch header */}
      <div style={{ padding: '6px 20px 14px' }}>
        <div
          style={{
            fontSize: 8.5,
            fontWeight: 900,
            color: '#F7931E',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Categories
        </div>
        <div
          id="watch-more-categories-title"
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: '#0F172A',
            letterSpacing: '-0.03em',
          }}
        >
          Browse categories
        </div>
      </div>

      <div style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
        {categories.length === 0 && (
          <div
            style={{
              padding: '24px 20px',
              fontSize: 13,
              color: '#94A3B8',
              textAlign: 'center',
            }}
          >
            No more categories yet.
          </div>
        )}
        {categories.map((cat) => {
          const isActive = activeTag === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                onSelect(cat.id);
                onOpenChange(false);
              }}
              aria-pressed={isActive}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 20px',
                background: isActive ? 'rgba(247,147,30,0.04)' : 'transparent',
                border: 'none',
                borderLeft: isActive ? '3px solid #F7931E' : '3px solid transparent',
                borderBottom: '0.5px solid rgba(15,23,42,0.07)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: isActive ? 800 : 600,
                    color: '#0F172A',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {cat.label}
                </div>
              </div>

              <span
                style={{
                  fontSize: 13,
                  color: '#94A3B8',
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}
              >
                {cat.postCount}
              </span>

              {isActive && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#F7931E',
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Safe area bottom padding */}
      <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px)' }} />
    </BottomSheet>
  );
}
