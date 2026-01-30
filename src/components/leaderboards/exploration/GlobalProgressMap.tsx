/**
 * GlobalProgressMap - Apple-grade world map using react-simple-maps
 * Uses real TopoJSON data from Natural Earth for accurate country shapes
 * Groups countries by continent for visualization
 */

import React, { useState, useCallback, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps';
import { cn } from '@/lib/utils';

// Use local TopoJSON file to avoid CORS issues
const WORLD_TOPOJSON_URL = '/data/world-countries.json';

// Map country codes to continents
const COUNTRY_TO_CONTINENT: Record<string, string> = {
  // Europe
  'ALB': 'europe', 'AND': 'europe', 'AUT': 'europe', 'BLR': 'europe', 'BEL': 'europe',
  'BIH': 'europe', 'BGR': 'europe', 'HRV': 'europe', 'CYP': 'europe', 'CZE': 'europe',
  'DNK': 'europe', 'EST': 'europe', 'FIN': 'europe', 'FRA': 'europe', 'DEU': 'europe',
  'GRC': 'europe', 'HUN': 'europe', 'ISL': 'europe', 'IRL': 'europe', 'ITA': 'europe',
  'XKX': 'europe', 'LVA': 'europe', 'LIE': 'europe', 'LTU': 'europe', 'LUX': 'europe',
  'MLT': 'europe', 'MDA': 'europe', 'MCO': 'europe', 'MNE': 'europe', 'NLD': 'europe',
  'MKD': 'europe', 'NOR': 'europe', 'POL': 'europe', 'PRT': 'europe', 'ROU': 'europe',
  'RUS': 'europe', 'SMR': 'europe', 'SRB': 'europe', 'SVK': 'europe', 'SVN': 'europe',
  'ESP': 'europe', 'SWE': 'europe', 'CHE': 'europe', 'UKR': 'europe', 'GBR': 'europe',
  'VAT': 'europe',
  
  // Asia
  'AFG': 'asia', 'ARM': 'asia', 'AZE': 'asia', 'BHR': 'asia', 'BGD': 'asia',
  'BTN': 'asia', 'BRN': 'asia', 'KHM': 'asia', 'CHN': 'asia', 'GEO': 'asia',
  'IND': 'asia', 'IDN': 'asia', 'IRN': 'asia', 'IRQ': 'asia', 'ISR': 'asia',
  'JPN': 'asia', 'JOR': 'asia', 'KAZ': 'asia', 'KWT': 'asia', 'KGZ': 'asia',
  'LAO': 'asia', 'LBN': 'asia', 'MYS': 'asia', 'MDV': 'asia', 'MNG': 'asia',
  'MMR': 'asia', 'NPL': 'asia', 'PRK': 'asia', 'OMN': 'asia', 'PAK': 'asia',
  'PSE': 'asia', 'PHL': 'asia', 'QAT': 'asia', 'SAU': 'asia', 'SGP': 'asia',
  'KOR': 'asia', 'LKA': 'asia', 'SYR': 'asia', 'TWN': 'asia', 'TJK': 'asia',
  'THA': 'asia', 'TLS': 'asia', 'TUR': 'asia', 'TKM': 'asia', 'ARE': 'asia',
  'UZB': 'asia', 'VNM': 'asia', 'YEM': 'asia',
  
  // Africa
  'DZA': 'africa', 'AGO': 'africa', 'BEN': 'africa', 'BWA': 'africa', 'BFA': 'africa',
  'BDI': 'africa', 'CPV': 'africa', 'CMR': 'africa', 'CAF': 'africa', 'TCD': 'africa',
  'COM': 'africa', 'COG': 'africa', 'COD': 'africa', 'CIV': 'africa', 'DJI': 'africa',
  'EGY': 'africa', 'GNQ': 'africa', 'ERI': 'africa', 'SWZ': 'africa', 'ETH': 'africa',
  'GAB': 'africa', 'GMB': 'africa', 'GHA': 'africa', 'GIN': 'africa', 'GNB': 'africa',
  'KEN': 'africa', 'LSO': 'africa', 'LBR': 'africa', 'LBY': 'africa', 'MDG': 'africa',
  'MWI': 'africa', 'MLI': 'africa', 'MRT': 'africa', 'MUS': 'africa', 'MAR': 'africa',
  'MOZ': 'africa', 'NAM': 'africa', 'NER': 'africa', 'NGA': 'africa', 'RWA': 'africa',
  'STP': 'africa', 'SEN': 'africa', 'SYC': 'africa', 'SLE': 'africa', 'SOM': 'africa',
  'ZAF': 'africa', 'SSD': 'africa', 'SDN': 'africa', 'TZA': 'africa', 'TGO': 'africa',
  'TUN': 'africa', 'UGA': 'africa', 'ZMB': 'africa', 'ZWE': 'africa',
  
  // North America
  'ATG': 'north_america', 'BHS': 'north_america', 'BRB': 'north_america', 'BLZ': 'north_america',
  'CAN': 'north_america', 'CRI': 'north_america', 'CUB': 'north_america', 'DMA': 'north_america',
  'DOM': 'north_america', 'SLV': 'north_america', 'GRD': 'north_america', 'GTM': 'north_america',
  'HTI': 'north_america', 'HND': 'north_america', 'JAM': 'north_america', 'MEX': 'north_america',
  'NIC': 'north_america', 'PAN': 'north_america', 'KNA': 'north_america', 'LCA': 'north_america',
  'VCT': 'north_america', 'TTO': 'north_america', 'USA': 'north_america', 'PRI': 'north_america',
  'GRL': 'north_america',
  
  // South America
  'ARG': 'south_america', 'BOL': 'south_america', 'BRA': 'south_america', 'CHL': 'south_america',
  'COL': 'south_america', 'ECU': 'south_america', 'GUY': 'south_america', 'PRY': 'south_america',
  'PER': 'south_america', 'SUR': 'south_america', 'URY': 'south_america', 'VEN': 'south_america',
  'FLK': 'south_america', 'GUF': 'south_america',
  
  // Oceania
  'AUS': 'oceania', 'FJI': 'oceania', 'KIR': 'oceania', 'MHL': 'oceania', 'FSM': 'oceania',
  'NRU': 'oceania', 'NZL': 'oceania', 'PLW': 'oceania', 'PNG': 'oceania', 'WSM': 'oceania',
  'SLB': 'oceania', 'TON': 'oceania', 'TUV': 'oceania', 'VUT': 'oceania', 'NCL': 'oceania',
  
  // Antarctica
  'ATA': 'antarctica',
};

// Brand colors matching the design mockup
const COLORS = {
  playedFill: '#8AAD6A',      // Sage green (matching mockup)
  playedFillHover: '#7A9D5A', // Darker on hover
  playedStroke: '#FFFFFF',
  notPlayedFill: '#E5E7EB',   // Light grey
  notPlayedStroke: '#D1D5DB',
};

interface GlobalProgressMapProps {
  playedContinents: string[];
  className?: string;
}

function GlobalProgressMapComponent({ playedContinents, className }: GlobalProgressMapProps) {
  const [, setHoveredCountry] = useState<string | null>(null);

  // Normalize the played continents array
  const normalizedPlayed = new Set(
    playedContinents.map(c => {
      // Handle both "North America" and "north_america" formats
      const normalized = c.toLowerCase().replace(/\s+/g, '_');
      return normalized;
    })
  );

  const isContinentPlayed = useCallback((continentId: string) => {
    return normalizedPlayed.has(continentId);
  }, [normalizedPlayed]);

  const getCountryContinent = useCallback((countryCode: string) => {
    return COUNTRY_TO_CONTINENT[countryCode] || null;
  }, []);

  const continentsPlayedCount = normalizedPlayed.size;

  return (
    <div className={cn('w-full', className)}>
      {/* Header with decorative lines */}
      <div className="mb-4 px-2">
        <div className="flex items-center justify-center gap-3">
          {/* Left decorative line */}
          <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-zinc-300" />
          
          {/* Title block */}
          <div className="text-center flex-shrink-0 px-2">
            <h3 className="text-lg font-semibold text-zinc-800 tracking-tight leading-tight">
              Global Progress
            </h3>
            <p className="text-sm mt-0.5 leading-tight">
              <span className="font-semibold text-zinc-700">{continentsPlayedCount}</span>
              <span className="mx-1 text-zinc-400">of</span>
              <span className="font-semibold text-zinc-700">7</span>
              <span className="ml-1 text-amber-600">Continents Played</span>
            </p>
          </div>
          
          {/* Right decorative line */}
          <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-zinc-300" />
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-white rounded-2xl shadow-sm border border-zinc-100/80 overflow-hidden mx-2">
        <div className="p-3 pb-1">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 115,
              center: [10, 30],
            }}
            style={{
              width: '100%',
              height: 'auto',
            }}
            viewBox="0 0 800 450"
          >
            <Geographies geography={WORLD_TOPOJSON_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // Get country code from properties
                  const countryCode = geo.properties?.ISO_A3 || geo.id;
                  const continent = getCountryContinent(countryCode);
                  const played = continent ? isContinentPlayed(continent) : false;
                  const isAntarctica = continent === 'antarctica';

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => setHoveredCountry(countryCode)}
                      onMouseLeave={() => setHoveredCountry(null)}
                      style={{
                        default: {
                          fill: played && !isAntarctica 
                            ? COLORS.playedFill 
                            : COLORS.notPlayedFill,
                          stroke: played && !isAntarctica 
                            ? COLORS.playedStroke 
                            : COLORS.notPlayedStroke,
                          strokeWidth: 0.4,
                          opacity: played && !isAntarctica ? 1 : isAntarctica ? 0.3 : 0.6,
                          outline: 'none',
                          cursor: played && !isAntarctica ? 'pointer' : 'default',
                          transition: 'all 0.2s ease-out',
                        },
                        hover: {
                          fill: played && !isAntarctica 
                            ? COLORS.playedFillHover 
                            : COLORS.notPlayedFill,
                          stroke: played && !isAntarctica 
                            ? COLORS.playedStroke 
                            : COLORS.notPlayedStroke,
                          strokeWidth: played && !isAntarctica ? 0.6 : 0.4,
                          opacity: played && !isAntarctica ? 1 : isAntarctica ? 0.3 : 0.6,
                          outline: 'none',
                          cursor: played && !isAntarctica ? 'pointer' : 'default',
                        },
                        pressed: {
                          fill: played && !isAntarctica 
                            ? COLORS.playedFillHover 
                            : COLORS.notPlayedFill,
                          outline: 'none',
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pb-3 pt-0">
          <div className="flex items-center gap-2">
            <span 
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: COLORS.playedFill }}
            />
            <span className="text-sm text-zinc-600 font-medium">Played</span>
          </div>
          <div className="flex items-center gap-2">
            <span 
              className="w-2.5 h-2.5 rounded-full"
              style={{ 
                backgroundColor: COLORS.notPlayedFill,
                opacity: 0.6,
              }}
            />
            <span className="text-sm text-zinc-500">Not played</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const GlobalProgressMap = memo(GlobalProgressMapComponent);
export default GlobalProgressMap;
