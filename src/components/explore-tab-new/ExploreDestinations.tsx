import { memo } from 'react';
import { useExploreRegionsWithImages } from './hooks/useExploreRegionsWithImages';

interface ExploreDestinationsProps {
  activeRegion: string | null;
  onRegionSelect: (slug: string | null) => void;
}

function ExploreDestinationsInner({ activeRegion, onRegionSelect }: ExploreDestinationsProps) {
  const { data: regions, isLoading } = useExploreRegionsWithImages();

  if (isLoading) {
    return (
      <section style={{ padding: '24px 0 0' }}>
        <div style={{ padding: '0 16px 12px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', margin: 0 }}>
            Destinations
          </h2>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="animate-pulse"
              style={{ width: 140, height: 180, flexShrink: 0, background: 'rgba(15,23,42,0.06)', borderRadius: 12 }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (!regions || regions.length === 0) return null;

  return (
    <section style={{ padding: '24px 0 0' }}>
      <div style={{ padding: '0 16px 12px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', margin: 0 }}>
          Destinations
        </h2>
        <p style={{ fontSize: 12, color: 'rgba(15,23,42,0.55)', margin: '2px 0 0', fontWeight: 500 }}>
          Pick a region to filter the feed
        </p>
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
        {regions.map((r: any) => {
          const slug = r.slug ?? r.id ?? r.region_slug;
          const title = r.title ?? r.name ?? r.label ?? 'Region';
          const image = r.image_url ?? r.hero_image_url ?? r.cover_image ?? null;
          const isActive = activeRegion === slug;
          const initial = (title || '?').charAt(0).toUpperCase();
          return (
            <button
              key={slug ?? title}
              type="button"
              onClick={() => onRegionSelect(isActive ? null : slug)}
              className="active:scale-[0.97] transition-transform"
              style={{
                position: 'relative',
                width: 140,
                height: 180,
                flexShrink: 0,
                borderRadius: 12,
                overflow: 'hidden',
                background: '#F8FAFC',
                border: isActive ? '2px solid #F7931E' : 'none',
                padding: 0,
              }}
            >
              {image ? (
                <img
                  src={image}
                  alt={title}
                  loading="lazy"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 48,
                    fontWeight: 900,
                  }}
                >
                  {initial}
                </div>
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  right: 12,
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                  textAlign: 'left',
                }}
              >
                {title}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export const ExploreDestinations = memo(ExploreDestinationsInner);
