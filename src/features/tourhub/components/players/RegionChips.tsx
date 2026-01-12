/**
 * RegionChips - Tab-style region filters matching schedule page tabs exactly
 * Uses orange underline indicator (same as Schedule tabs)
 */

import { cn } from '@/lib/utils';

export type RegionType = 'all' | 'united-states' | 'europe' | 'asia-pacific' | 'rest-of-world';

interface RegionChipsProps {
  activeRegion: RegionType;
  onRegionChange: (region: RegionType) => void;
}

const regions: { value: RegionType; label: string }[] = [
  { value: 'all', label: 'All Regions' },
  { value: 'united-states', label: 'United States' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia-pacific', label: 'Asia-Pacific' },
  { value: 'rest-of-world', label: 'Rest of World' },
];

export function RegionChips({ activeRegion, onRegionChange }: RegionChipsProps) {
  return (
    <div 
      className="py-3"
      role="tablist"
      aria-label="Filter by region"
    >
      {/* Grid layout matching schedule page - 5 columns, centered */}
      <div className="grid w-full grid-cols-5 bg-transparent border-0 px-0 py-0 gap-0">
        {regions.map((region) => {
          const isActive = activeRegion === region.value;

          return (
            <button
              key={region.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onRegionChange(region.value)}
              className={cn(
                // Exact same styling as schedule page tabs
                "relative text-sm px-2 py-2.5 font-medium",
                "bg-transparent border-0 shadow-none rounded-none",
                "transition-colors duration-200 ease-out",
                "inline-flex items-center justify-center text-center",
                // Orange underline using after pseudo-element
                "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
                "after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))]",
                "after:transition-all after:duration-200 after:ease-out",
                isActive 
                  ? "text-foreground after:w-full after:opacity-[0.85]" 
                  : "text-muted-foreground hover:text-foreground after:w-0 after:opacity-0"
              )}
            >
              {region.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Region mapping utilities
export const REGION_COUNTRIES: Record<Exclude<RegionType, 'all'>, string[]> = {
  'united-states': ['United States', 'USA', 'U.S.A.', 'US'],
  'europe': [
    'England', 'Scotland', 'Ireland', 'Northern Ireland', 'Wales', 
    'Spain', 'France', 'Germany', 'Italy', 'Sweden', 'Norway', 
    'Denmark', 'Netherlands', 'Belgium', 'Austria', 'Switzerland', 
    'Portugal', 'Finland', 'Poland', 'Czech Republic', 'Hungary',
    'Greece', 'Romania', 'Croatia', 'Slovenia', 'Slovakia'
  ],
  'asia-pacific': [
    'Australia', 'Japan', 'South Korea', 'Korea', 'China', 'Taiwan', 
    'Thailand', 'Philippines', 'India', 'New Zealand', 'Singapore', 
    'Malaysia', 'Indonesia', 'Vietnam', 'Hong Kong'
  ],
  'rest-of-world': [], // Catch-all for anything not in the above
};

export function getPlayerRegion(country: string | null): RegionType {
  if (!country) return 'rest-of-world';
  const upperCountry = country.toUpperCase();
  
  for (const [region, countries] of Object.entries(REGION_COUNTRIES)) {
    if (region === 'rest-of-world') continue;
    if (countries.some(c => c.toUpperCase() === upperCountry)) {
      return region as RegionType;
    }
  }
  return 'rest-of-world';
}

export function getRegionLabel(region: RegionType): string {
  return regions.find(r => r.value === region)?.label || 'All Regions';
}
