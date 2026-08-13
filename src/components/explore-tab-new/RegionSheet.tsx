import { BottomSheet } from '@/components/ui/BottomSheet';
import { useExploreRegionChips } from './hooks/useExploreRegionChips';
import { TITLE as TITLE_METRICS } from '@/lib/tokens/type';

interface RegionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeRegion: string | null;
  onSelect: (slug: string | null) => void;
}

/**
 * Bottom sheet listing every Explore region. Single-select. "All regions"
 * row at the top clears the param. Mirrors WatchMoreCategoriesSheet styling
 * (Dispatch hairline rows, 3px amber stripe on active).
 */
export default function RegionSheet({
  open,
  onOpenChange,
  activeRegion,
  onSelect,
}: RegionSheetProps) {
  const { regions, isLoading } = useExploreRegionChips();

  // Filter out the synthetic "All" entry — we render it explicitly at the top.
  const realRegions = regions.filter(r => r.slug !== null);

  return (
    <BottomSheet
      open={open}
      onClose={() => onOpenChange(false)}
      ariaLabelledBy="explore-region-sheet-title"
      maxHeight="95dvh"
    >
      <div style={{ padding: '8px 20px 12px' }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: '#0E1216',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Region
        </div>
        <div
          id="explore-region-sheet-title"
          style={{
            ...TITLE_METRICS,
            color: '#0F172A',
          }}
        >
          Browse by region
        </div>
      </div>

      <div style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
        {/* All regions — clears the param */}
        <SheetRow
          label="All regions"
          isActive={activeRegion === null}
          onClick={() => {
            onSelect(null);
            onOpenChange(false);
          }}
        />

        {isLoading && realRegions.length === 0 && (
          <div
            style={{
              padding: '32px 20px',
              fontSize: 13,
              color: '#94A3B8',
              textAlign: 'center',
            }}
          >
            Loading regions…
          </div>
        )}

        {realRegions.map((r) => {
          const isActive = activeRegion === r.slug;
          return (
            <SheetRow
              key={r.slug ?? '__all'}
              label={r.title}
              isActive={isActive}
              onClick={() => {
                onSelect(r.slug);
                onOpenChange(false);
              }}
            />
          );
        })}
      </div>

      <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px)' }} />
    </BottomSheet>
  );
}

function SheetRow({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
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
            fontWeight: isActive ? 700 : 600,
            color: '#0F172A',
            letterSpacing: '-0.01em',
          }}
        >
          {label}
        </div>
      </div>
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
}
