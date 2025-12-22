import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Region {
  id: string;
  name: string;
  hoverCopy?: string;
  imageUrl?: string;
  courseCount?: number;
}

const REGIONS: Region[] = [
  { 
    id: 'uk-ireland', 
    name: 'UK & Ireland', 
    hoverCopy: 'Timeless links and legendary fairways',
    courseCount: 42 
  },
  { 
    id: 'continental-europe', 
    name: 'Continental Europe', 
    hoverCopy: 'Drama, elevation, unforgettable settings',
    courseCount: 28 
  },
  { 
    id: 'usa', 
    name: 'USA', 
    hoverCopy: 'Championship courses across every landscape',
    courseCount: 45 
  },
  { 
    id: 'rest-of-world', 
    name: 'Rest of the World', 
    hoverCopy: 'Hidden gems waiting to be discovered',
    courseCount: 31 
  },
];

interface RegionExploreRailProps {
  className?: string;
  onRegionClick?: (regionId: string) => void;
}

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
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

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
      
      {/* Horizontal scroll rail */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide snap-x snap-mandatory">
          {REGIONS.map((region) => (
            <button
              key={region.id}
              onClick={() => onRegionClick?.(region.id)}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              className="flex-shrink-0 snap-start group"
            >
              <div className="relative w-44 md:w-56 aspect-[4/3] rounded-xl overflow-hidden">
                {/* Placeholder gradient - replace with actual imagery */}
                <div className={cn(
                  "absolute inset-0",
                  region.id === 'uk-ireland' && "bg-gradient-to-br from-slate-700 via-emerald-800 to-slate-900",
                  region.id === 'continental-europe' && "bg-gradient-to-br from-amber-800 via-slate-700 to-slate-900",
                  region.id === 'usa' && "bg-gradient-to-br from-blue-800 via-slate-700 to-slate-900",
                  region.id === 'rest-of-world' && "bg-gradient-to-br from-teal-800 via-slate-700 to-slate-900",
                )} />
                
                {/* Overlay for hover effect */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-200" />
                
                {/* Bottom gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <h4 className="text-base font-medium text-white">{region.name}</h4>
                  
                  {/* Hover micro-copy - only shows on hover/tap */}
                  {region.hoverCopy && (
                    <p className={cn(
                      "mt-1 text-xs text-white/70 font-light transition-all duration-200",
                      hoveredRegion === region.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                    )}>
                      {region.hoverCopy}
                    </p>
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
