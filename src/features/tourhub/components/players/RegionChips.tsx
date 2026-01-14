/**
 * RegionChips - Segmented control region filters matching Schedule page tabs
 */

import { cn } from '@/lib/utils';

export type RegionType = 'all' | 'united-states' | 'europe' | 'asia-pacific' | 'rest-of-world';

interface RegionChipsProps {
  activeRegion: RegionType;
  onRegionChange: (region: RegionType) => void;
}

const regions: { value: RegionType; label: string; shortLabel: string }[] = [
  { value: 'all', label: 'All Regions', shortLabel: 'All' },
  { value: 'united-states', label: 'United States', shortLabel: 'USA' },
  { value: 'europe', label: 'Europe', shortLabel: 'Europe' },
  { value: 'asia-pacific', label: 'Asia-Pacific', shortLabel: 'Asia' },
  { value: 'rest-of-world', label: 'Rest of World', shortLabel: 'Other' },
];

export function RegionChips({ activeRegion, onRegionChange }: RegionChipsProps) {
  return (
    <div 
      className="py-2"
      role="tablist"
      aria-label="Filter by region"
    >
      {/* Full-width segmented control - matching Schedule page */}
      <div 
        className="flex items-stretch rounded-xl overflow-hidden"
        style={{ background: '#e2e8f0' }}
      >
        {regions.map((region) => {
          const isActive = activeRegion === region.value;

          return (
            <button
              key={region.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => onRegionChange(region.value)}
              className={cn(
                "relative flex-1 py-2.5 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap",
                "min-h-[44px]", // Accessibility touch target
                isActive 
                  ? "bg-white text-slate-800 shadow-sm m-1 rounded-lg" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {region.shortLabel}
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
