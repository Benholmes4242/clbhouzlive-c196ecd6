import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AnimatePresence, motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface FeaturedCoursesCarouselProps {
  onRegionSelect: (slug: string) => void;
}

interface CarouselSlide {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  hero_image_url: string | null;
}

export function FeaturedCoursesCarousel({ onRegionSelect }: FeaturedCoursesCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { data: slides, isLoading } = useQuery({
    queryKey: ['courses-tab-featured-carousel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explore_regions')
        .select('id, slug, title, subtitle, hero_image_url')
        .order('sort_order')
        .limit(3);

      if (error) return [];
      return (data ?? []) as CarouselSlide[];
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
          {/* Background image */}
          {slide.hero_image_url ? (
            <img
              src={slide.hero_image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.75 }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0d2a1a] to-[#051408]" />
          )}

          {/* Gradient overlay */}
          <div
            className="absolute inset-0 flex flex-col justify-end"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)',
              padding: 16,
            }}
          >
            {/* Featured badge — clbhouz called it style, angled */}
            <span
              className="self-start"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#F59E0B',
                color: '#451A03',
                fontSize: 11,
                fontWeight: 800,
                padding: '5px 10px',
                borderRadius: 8,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                marginBottom: 8,
                transform: 'rotate(-2deg)',
              }}
            >
              <span style={{ fontSize: 12 }}>⭐</span>
              Featured this week
            </span>

            {/* Title */}
            <p
              className="font-serif"
              style={{
                fontSize: 24,
                color: 'white',
                lineHeight: 1.1,
                marginBottom: 4,
              }}
            >
              {slide.title}
            </p>

            {/* Meta row */}
            {slide.subtitle && (
              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: 10,
                }}
              >
                {slide.subtitle}
              </p>
            )}

            {/* Explore button */}
            <button
              onClick={() => onRegionSelect(slide.slug)}
              className="self-start active:scale-[0.97] transition-transform"
              style={{
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
