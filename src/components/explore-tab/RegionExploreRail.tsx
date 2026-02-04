import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useExploreRegions, ExploreRegion } from '@/hooks/useExploreData';

interface RegionExploreRailProps {
  className?: string;
  onRegionClick?: (regionId: string) => void;
}

// Gradient colors for regions
const REGION_GRADIENTS: Record<string, string> = {
  'uk-ireland': "bg-gradient-to-br from-slate-700 via-emerald-800 to-slate-900",
  'continental-europe': "bg-gradient-to-br from-amber-800 via-slate-700 to-slate-900",
  'usa': "bg-gradient-to-br from-blue-800 via-slate-700 to-slate-900",
  'rest-of-world': "bg-gradient-to-br from-teal-800 via-slate-700 to-slate-900",
};

/**
 * RegionExploreRail - Explore by Region
 * 
 * Cinematic spec:
 * - Section header: "Explore by Region"
 * - Sub-copy: editorial description
 * - Region cards with hover micro-copy
 */
export const RegionExploreRail: React.FC<RegionExploreRailProps> = ({
  className,
  onRegionClick,
}) => {
  const navigate = useNavigate();
  const { data: regions, isLoading } = useExploreRegions();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const handleRegionClick = (region: ExploreRegion) => {
    if (onRegionClick) {
      onRegionClick(region.id);
    }
    navigate(`/discover/explore/region/${region.slug}`);
  };

  if (isLoading) {
    return (
      <div className={cn("py-6", className)}>
        <div className="px-5 mb-4">
          <div className="h-6 w-40 bg-muted motion-safe:animate-shimmer-down rounded" />
          <div className="h-4 w-64 bg-muted motion-safe:animate-shimmer-down rounded mt-2" style={{ animationDelay: '50ms' }} />
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className="flex-shrink-0 w-44 aspect-[4/3] rounded-xl bg-muted motion-safe:animate-shimmer-down" 
              style={{ animationDelay: `${i * 75}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!regions?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
      className={cn("py-6", className)}
    >
      {/* Section Header */}
      <div className="px-5 mb-4">
        <h3 className="text-lg font-serif text-foreground">Explore by Region</h3>
        <p className="mt-1.5 text-sm text-muted-foreground font-light leading-relaxed max-w-md">
          From rugged coastlines to rolling parkland, discover the world's greatest courses — one destination at a time.
        </p>
      </div>
      
      {/* Horizontal scroll rail - GPU accelerated */}
      <div className="relative will-change-transform">
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide snap-x snap-mandatory">
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => handleRegionClick(region)}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              className="flex-shrink-0 snap-start group"
            >
              <div className="relative w-44 md:w-56 aspect-[4/3] rounded-xl overflow-hidden">
                {/* Background - use hero_image_url or gradient */}
                {region.hero_image_url ? (
                  <img 
                    src={region.hero_image_url} 
                    alt={region.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    decoding="async"
                    loading="lazy"
                  />
                ) : (
                  <div className={cn(
                    "absolute inset-0",
                    REGION_GRADIENTS[region.slug] || "bg-gradient-to-br from-slate-700 to-slate-900"
                  )} />
                )}
                
                {/* Overlay for hover effect */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-200" />
                
                {/* Bottom gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <h4 className="text-base font-medium text-white">{region.title}</h4>
                  
                  {/* Hover micro-copy */}
                  {region.subtitle && (
                    <p className={cn(
                      "mt-1 text-xs text-white/70 font-light transition-all duration-200",
                      hoveredRegion === region.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                    )}>
                      {region.subtitle}
                    </p>
                  )}
                  
                  {/* Activity indicator */}
                  {(region.moments_7d ?? 0) > 0 && (
                    <div className="mt-2 text-xs text-white/50">
                      {region.moments_7d} moments this week
                    </div>
                  )}
                </div>
                
                {/* Hover arrow indicator */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ChevronRight className="w-5 h-5 text-white/80" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default RegionExploreRail;
