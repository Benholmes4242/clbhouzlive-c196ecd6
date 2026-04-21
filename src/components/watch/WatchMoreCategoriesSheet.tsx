import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Check } from 'lucide-react';
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
 * Lists the secondary categories that don't fit alongside the
 * three primary chips (For you, Nearby, Reviews).
 */
export default function WatchMoreCategoriesSheet({
  open,
  onOpenChange,
  categories,
  activeTag,
  onSelect,
}: WatchMoreCategoriesSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[70vh] rounded-t-2xl p-0 border-t"
        style={{ background: '#F8FAFC' }}
      >
        <SheetHeader className="px-5 pt-5 pb-3 text-left">
          <SheetTitle
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'hsl(var(--foreground))',
            }}
          >
            Browse categories
          </SheetTitle>
        </SheetHeader>

        <div style={{ padding: '4px 8px 24px' }}>
          {categories.length === 0 && (
            <div
              style={{
                padding: '24px 12px',
                fontSize: 13,
                color: 'hsl(var(--muted-foreground))',
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
                className="w-full active:bg-black/5 transition-colors"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 12px',
                  borderBottom: '0.5px solid hsl(var(--border) / 0.4)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#c97a10' : 'hsl(var(--foreground))',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {cat.label}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {cat.postCount}
                  </span>
                  {isActive && (
                    <Check
                      size={16}
                      style={{ color: '#F7931E' }}
                      strokeWidth={2.5}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
