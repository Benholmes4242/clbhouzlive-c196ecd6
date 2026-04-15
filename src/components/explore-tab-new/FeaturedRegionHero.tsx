import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FeaturedRegionHeroProps {
  onRegionSelect: (slug: string) => void;
  activeRegion: string | null;
}

interface FeaturedRegion {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  hero_image_url: string | null;
  courseCount: number;
}

function FeaturedRegionHeroInner({ onRegionSelect, activeRegion }: FeaturedRegionHeroProps) {
  const { data: region } = useQuery({
    queryKey: ['explore-featured-region'],
    queryFn: async (): Promise<FeaturedRegion | null> => {
      const { data: regions, error } = await supabase
        .from('explore_regions')
        .select('id, slug, title, subtitle, hero_image_url')
        .order('sort_order')
        .limit(6);

      if (error || !regions || regions.length === 0) {
        if (import.meta.env.DEV) console.error('[FeaturedRegionHero] fetch error:', error);
        return null;
      }

      // Rotate based on day of week
      const dayIndex = new Date().getDay() % regions.length;
      const picked = regions[dayIndex];

      // Fetch countries in this region, then count actual golf courses
      const { data: memberRows } = await supabase
        .from('explore_region_members')
        .select('country')
        .eq('region_id', picked.id);

      const countries = (memberRows ?? []).map((r: any) => r.country);

      let courseCount = 0;
      if (countries.length > 0) {
        const { count } = await supabase
          .from('golf_courses')
          .select('*', { count: 'exact', head: true })
          .in('country', countries);
        courseCount = count ?? 0;
      }

      return {
        id: picked.id,
        slug: picked.slug,
        title: picked.title,
        subtitle: picked.subtitle,
        hero_image_url: picked.hero_image_url,
        courseCount: courseCount ?? 0,
      };
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  if (activeRegion !== null) return null;
  if (!region) {
    return (
      <div className="mx-[2px] mb-[2px] aspect-[16/9] rounded-xl bg-muted animate-pulse" />
    );
  }

  return (
    <div className="mx-[2px] mb-[2px]">
      <button
        type="button"
        onClick={() => onRegionSelect(region.slug)}
        className="w-full rounded-xl overflow-hidden relative block focus:outline-none"
      >
        {region.hero_image_url ? (
          <img
            src={region.hero_image_url}
            alt={region.title}
            className="aspect-[16/9] w-full object-cover"
          />
        ) : (
          <div className="w-full aspect-[16/9] bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
          <h2 className="text-xl font-bold text-white">{region.title}</h2>
          {region.subtitle && (
            <p className="text-sm text-white/80 mt-0.5">{region.subtitle}</p>
          )}
          <span
103:             className="inline-block mt-2.5 text-xs font-semibold text-white rounded-full liquid-glass"
            style={{ padding: '6px 14px' }}
          >
            Explore →
          </span>
        </div>
      </button>
    </div>
  );
}

export const FeaturedRegionHero = memo(FeaturedRegionHeroInner);
