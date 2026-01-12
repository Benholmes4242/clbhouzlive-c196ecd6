/**
 * RegionChips - Pill-style region chips (world map feel)
 * Horizontal scrollable chip row with soft backgrounds
 */

import { cn } from '@/lib/utils';

export type RegionType = 'all' | 'united-states' | 'europe' | 'asia-pacific' | 'rest-of-world';

interface RegionChipsProps {
  activeRegion: RegionType;
  onRegionChange: (region: RegionType) => void;
}

// Cleaner labels
const regions: { value: RegionType; label: string }[] = [
  { value: 'all', label: 'All Regions' },
  { value: 'united-states', label: 'USA' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia-pacific', label: 'Asia-Pacific' },
  { value: 'rest-of-world', label: 'Global' },
];

export function RegionChips({ activeRegion, onRegionChange }: RegionChipsProps) {
  return (
    <div 
      className="py-2 -mx-4 px-4 overflow-x-auto scrollbar-hide"
      role="tablist"
      aria-label="Filter by region"
    >
      {/* Horizontal scrollable chip row */}
      <div className="flex items-center gap-2">
        {regions.map((region) => {
          const isActive = activeRegion === region.value;

          return (
            <button
              key={region.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onRegionChange(region.value)}
              className={cn(
                "shrink-0 px-3 py-1.5 text-sm font-medium rounded-full",
                "transition-all duration-200 ease-out",
                "border",
                isActive 
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-transparent text-muted-foreground border-border/60 hover:border-border hover:text-foreground"
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
