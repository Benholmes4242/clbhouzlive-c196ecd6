import { memo } from 'react';
import { useExploreRegionsWithImages } from './hooks/useExploreRegionsWithImages';

/**
 * Fallback images: iconic #1 course per region.
 * Used when hero_image_url is not set in the DB.
 */
const REGION_FALLBACK_IMAGES: Record<string, string> = {
  'great-britain-ireland': 'https://images.unsplash.com/photo-1600005082646-7077db1d0567?w=600&q=80', // Royal County Down style links
  'europe': 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600&q=80', // European parkland course
  'usa': 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&q=80', // Cypress Point style coastal
  'asia': 'https://images.unsplash.com/photo-1593111774240-004412370337?w=600&q=80',
  'middle-east': 'https://images.unsplash.com/photo-1624727828489-a1e03b79bba8?w=600&q=80',
  'africa': 'https://images.unsplash.com/photo-1622397815925-39e0a0723bd2?w=600&q=80',
  'australia-nz': 'https://images.unsplash.com/photo-1592919505780-303950717480?w=600&q=80',
  'canada': 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600&q=80',
  'caribbean': 'https://images.unsplash.com/photo-1600005082646-7077db1d0567?w=600&q=80',
};

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
        {regions.map((region) => {
          const imageUrl = region.hero_image_url || REGION_FALLBACK_IMAGES[region.slug] || null;

          return (
            <button
              key={region.id}
              type="button"
              onClick={() => onRegionSelect(region.slug)}
              className="shrink-0 w-[220px] rounded-xl overflow-hidden relative focus:outline-none"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={region.title}
                  loading="lazy"
                  className="aspect-[16/10] w-full object-cover"
                />
              ) : (
                <div className="aspect-[16/10] w-full bg-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-sm font-bold text-white">{region.title}</p>
                {region.subtitle && (
                  <p className="text-[11px] text-white/70 mt-0.5">
                    {region.subtitle}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const ExploreRegionsStrip = memo(ExploreRegionsStripInner);
