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
  embedded,
}: ExploreHeaderProps) {
  return (
    <div
      className="sticky z-20 pb-0 pt-0 px-0"
      style={{
        top: embedded ? '45px' : 0,
        background: 'rgba(248,250,252,0.97)',
        borderBottom: '0.5px solid rgba(15,23,42,0.08)',
        ...(!embedded && { paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)' }),
      }}
    >
      <div className={embedded ? "px-3 pt-2 pb-1.5" : "px-4 pt-3.5 pb-2.5"}>
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
              className="shrink-0 transition-colors active:scale-[0.97]"
              style={{
                minHeight: 36,
                padding: '0 16px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 20,
                background: isActive ? 'rgba(247,147,30,0.12)' : 'transparent',
                border: isActive ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
                color: isActive ? '#c97a10' : 'hsl(var(--muted-foreground))',
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
                className="shrink-0 w-20 bg-muted animate-pulse"
                style={{ minHeight: 36, borderRadius: 20 }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export const ExploreHeader = memo(ExploreHeaderInner);
