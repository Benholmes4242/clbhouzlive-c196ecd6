import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AnimatePresence, motion } from 'framer-motion';

interface FeaturedCoursesCarouselProps {
  onRegionSelect: (slug: string) => void;
}

interface CarouselSlide {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  hero_image_url: string | null;
  courseCount: number;
}

export function FeaturedCoursesCarousel({ onRegionSelect }: FeaturedCoursesCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { data: slides, isLoading } = useQuery({
    queryKey: ['courses-tab-featured-carousel'],
    queryFn: async (): Promise<CarouselSlide[]> => {
      const { data, error } = await supabase
        .from('explore_regions')
        .select('id, slug, title, subtitle, hero_image_url')
        .order('sort_order')
        .limit(10);

      if (error || !data) return [];

      // Fetch all region members in one query
      const regionIds = data.map(r => r.id);
      const { data: allMembers } = await supabase
        .from('explore_region_members')
        .select('region_id, country')
        .in('region_id', regionIds);

      // Group countries by region
      const countriesByRegion = new Map<string, string[]>();
      for (const m of (allMembers ?? [])) {
        const list = countriesByRegion.get(m.region_id) ?? [];
        list.push(m.country);
        countriesByRegion.set(m.region_id, list);
      }

      // Collect all unique countries for a single count query
      const allCountries = [...new Set((allMembers ?? []).map(m => m.country))];
      let countsByCountry = new Map<string, number>();

      if (allCountries.length > 0) {
        // Get total per-country counts
        const { data: countRows } = await supabase
          .from('golf_courses')
          .select('country')
          .in('country', allCountries);

        if (countRows) {
          for (const row of countRows) {
            countsByCountry.set(row.country, (countsByCountry.get(row.country) ?? 0) + 1);
          }
        }
      }

      return data.map(r => {
        const countries = countriesByRegion.get(r.id) ?? [];
        const courseCount = countries.reduce((sum, c) => sum + (countsByCountry.get(c) ?? 0), 0);
        return { ...r, courseCount };
      });
    },
    staleTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (!slides || slides.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides?.length, isPaused]);

  if (isLoading) {
    return <div className="w-full h-[200px] sm:h-[230px] bg-muted animate-pulse" />;
  }

  if (!slides || slides.length === 0) return null;

  const slide = slides[currentSlide];

  return (
    <div
      className="relative w-full h-[200px] sm:h-[230px] overflow-hidden"
      style={{ background: '#1a1a1a' }}
      onPointerDown={() => setIsPaused(true)}
      onPointerUp={() => setIsPaused(false)}
      onPointerLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {slide.hero_image_url ? (
            <img
              src={slide.hero_image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0d2a1a] to-[#051408]" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-1.5">
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
              {slide.title}
            </h2>
            {slide.courseCount > 0 && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>
                {slide.courseCount.toLocaleString()} courses
              </p>
            )}
            <button
              onClick={() => onRegionSelect(slide.slug)}
              className="self-start active:scale-[0.97] transition-transform"
              style={{
                marginTop: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(255,255,255,0.15)',
                border: '0.5px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: 'white',
              }}
            >
              Explore →
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div
          className="absolute flex items-center"
          style={{ bottom: 16, right: 16, gap: 5 }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: currentSlide === i ? 16 : 6,
                height: 6,
                borderRadius: currentSlide === i ? 3 : '50%',
                background: currentSlide === i ? 'white' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s ease',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
