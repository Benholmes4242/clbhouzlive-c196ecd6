import { memo } from 'react';
import { useExploreRegionsWithImages } from './hooks/useExploreRegionsWithImages';

interface ExploreRegionsStripProps {
  onRegionSelect: (slug: string) => void;
  activeRegion: string | null;
}

function ExploreRegionsStripInner({ onRegionSelect, activeRegion }: ExploreRegionsStripProps) {
  const { data: regions } = useExploreRegionsWithImages();

  if (activeRegion !== null) return null;
  if (!regions || regions.length === 0) return null;

  return (
    <div className="py-4" style={{ gridColumn: '1 / -1' }}>
      <h3 className="text-sm font-semibold text-foreground px-4 pb-3">
        Explore Regions
      </h3>
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
        {regions.map((region) => (
          <button
            key={region.id}
            type="button"
            onClick={() => onRegionSelect(region.slug)}
            className="shrink-0 w-[200px] rounded-xl overflow-hidden relative focus:outline-none"
          >
            {region.hero_image_url ? (
              <img
                src={region.hero_image_url}
                alt={region.title}
                loading="lazy"
                className="aspect-[16/10] w-full object-cover"
              />
            ) : (
              <div className="aspect-[16/10] w-full bg-gradient-to-br from-emerald-600 to-emerald-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-sm font-bold text-white">{region.title}</p>
              {region.subtitle && (
                <p className="text-[11px] text-white/70 line-clamp-1 mt-0.5">
                  {region.subtitle}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export const ExploreRegionsStrip = memo(ExploreRegionsStripInner);
