import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface Region {
  id: string;
  name: string;
  imageUrl?: string;
  courseCount?: number;
}

const REGIONS: Region[] = [
  { id: 'uk-ireland', name: 'UK & Ireland', courseCount: 42 },
  { id: 'continental-europe', name: 'Continental Europe', courseCount: 28 },
  { id: 'usa', name: 'USA', courseCount: 45 },
  { id: 'rest-of-world', name: 'Rest of World', courseCount: 31 },
];

interface RegionExploreRailProps {
  className?: string;
  onRegionClick?: (regionId: string) => void;
}

/**
 * RegionExploreRail - Explore by Region
 * 
 * Design:
 * - Horizontal rails
 * - Large course imagery
 * - Region name only
 * - No metrics (course count is subtle)
 */
export const RegionExploreRail: React.FC<RegionExploreRailProps> = ({
  className,
  onRegionClick,
}) => {
  return (
    <div className={cn("py-6", className)}>
      {/* Section Header */}
      <div className="px-5 mb-4">
        <h3 className="text-lg font-serif text-foreground">Explore by Region</h3>
      </div>
      
      {/* Horizontal scroll rail */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide snap-x snap-mandatory">
          {REGIONS.map((region) => (
            <button
              key={region.id}
              onClick={() => onRegionClick?.(region.id)}
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
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                
                {/* Bottom gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <h4 className="text-base font-medium text-white">{region.name}</h4>
                </div>
                
                {/* Hover arrow indicator */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-5 h-5 text-white/80" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RegionExploreRail;
