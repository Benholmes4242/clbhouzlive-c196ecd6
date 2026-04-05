import { memo } from 'react';
import { Search } from 'lucide-react';

interface RegionChip {
  slug: string | null;
  title: string;
}

interface ExploreHeaderProps {
  activeRegion: string | null;
  regions: RegionChip[];
  regionsLoading: boolean;
  onRegionChange: (slug: string | null) => void;
  onOpenSearch: () => void;
  embedded?: boolean;
}

function ExploreHeaderInner({
  activeRegion,
  regions,
  regionsLoading,
  onRegionChange,
  onOpenSearch,
}: ExploreHeaderProps) {
  return (
    <div
      className="sticky z-30 bg-background pb-0 pt-0 px-0"
      style={{ top: '0px', borderBottom: '1px solid hsl(var(--border) / 0.12)' }}
    >
      <div className="px-4 pt-3.5 pb-2.5">
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search courses and videos"
          className="w-full flex items-center gap-2 h-11 px-4 rounded-2xl bg-muted text-muted-foreground text-[15px]"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>Search courses & videos...</span>
        </button>
      </div>

      <div role="tablist" aria-label="Filter by region" className="flex justify-center gap-2 px-4 pb-3.5 overflow-x-auto scrollbar-hide">
        {regions.map((region) => {
          const isActive = activeRegion === region.slug;
          return (
            <button
              key={region.slug ?? '__all'}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onRegionChange(region.slug)}
              className="shrink-0 min-h-[40px] px-5 text-[15px] font-semibold transition-colors"
              style={{
                borderRadius: 10,
                background: isActive ? 'hsl(var(--foreground))' : 'transparent',
                color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
                border: isActive ? 'none' : '1.5px solid hsl(var(--border))',
              }}
            >
              {region.title}
            </button>
          );
        })}

        {regionsLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="shrink-0 min-h-[40px] w-24 rounded-[10px] bg-muted animate-pulse"
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export const ExploreHeader = memo(ExploreHeaderInner);
