import { memo } from 'react';
import { Globe } from 'lucide-react';
import { PinMark } from './DiscoverMarks';
import { useExploreRegionsWithImages } from './hooks/useExploreRegionsWithImages';
import SectionHeader from '@/components/ui/SectionHeader';

interface ExploreDestinationsProps {
  activeRegion: string | null;
  onRegionSelect: (slug: string | null) => void;
}

function ExploreDestinationsInner({ activeRegion, onRegionSelect }: ExploreDestinationsProps) {
  const { data: regions, isLoading } = useExploreRegionsWithImages();

  if (isLoading) {
    return (
      <section style={{ padding: '0 0 0' }}>
        <SectionHeader tier="editorial" title="Destinations" mark={<PinMark />} paddingX={16} />
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
    <section style={{ padding: '0 0 0' }}>
      <SectionHeader tier="editorial" title="Destinations" mark={<PinMark />} sub="Pick a region to filter the feed" paddingX={16} />
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
        {/* Worldwide — resets to all regions (activeRegion === null) */}
        <button
          type="button"
          onClick={() => onRegionSelect(null)}
          className="active:scale-[0.97] transition-transform"
          style={{
            position: 'relative',
            width: 140,
            height: 180,
            flexShrink: 0,
            borderRadius: 12,
            overflow: 'hidden',
            padding: 0,
            border: activeRegion === null ? '1px solid #F7931E' : '1px solid transparent',
            background: `
              radial-gradient(120% 80% at 20% 15%, rgba(247,147,30,0.28) 0%, transparent 45%),
              radial-gradient(120% 90% at 85% 90%, rgba(16,185,129,0.25) 0%, transparent 50%),
              linear-gradient(135deg, #0F172A 0%, #1e293b 100%)
            `,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={40} color="rgba(255,255,255,0.85)" strokeWidth={1.6} />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.5) 100%)' }} />
          <span style={{ position: 'absolute', bottom: 12, left: 14, fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Worldwide</span>
        </button>
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
                border: isActive ? '1px solid #F7931E' : '1px solid transparent',
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
