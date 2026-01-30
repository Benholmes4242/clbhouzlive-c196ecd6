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

// Map numeric ISO codes (from TopoJSON geo.id) to ISO3 alpha codes
const NUMERIC_TO_ISO3: Record<string, string> = {
  // Europe
  '826': 'GBR', '250': 'FRA', '276': 'DEU', '380': 'ITA', '724': 'ESP',
  '620': 'PRT', '528': 'NLD', '56': 'BEL', '372': 'IRL', '756': 'CHE',
  '40': 'AUT', '208': 'DNK', '578': 'NOR', '752': 'SWE', '246': 'FIN',
  '616': 'POL', '203': 'CZE', '300': 'GRC', '792': 'TUR', '643': 'RUS',
  '804': 'UKR', '642': 'ROU', '100': 'BGR', '348': 'HUN', '703': 'SVK',
  '705': 'SVN', '191': 'HRV', '70': 'BIH', '688': 'SRB', '499': 'MNE',
  '807': 'MKD', '8': 'ALB', '112': 'BLR', '440': 'LTU', '428': 'LVA',
  '233': 'EST', '352': 'ISL', '442': 'LUX', '470': 'MLT', '498': 'MDA',
  '196': 'CYP',
  
  // Asia
  '392': 'JPN', '156': 'CHN', '410': 'KOR', '764': 'THA', '704': 'VNM',
  '356': 'IND', '608': 'PHL', '458': 'MYS', '702': 'SGP', '360': 'IDN',
  '784': 'ARE', '682': 'SAU', '408': 'PRK', '586': 'PAK', '50': 'BGD',
  '144': 'LKA', '104': 'MMR', '116': 'KHM', '418': 'LAO', '496': 'MNG',
  '398': 'KAZ', '860': 'UZB', '795': 'TKM', '762': 'TJK', '417': 'KGZ',
  '4': 'AFG', '364': 'IRN', '368': 'IRQ', '400': 'JOR', '422': 'LBN',
  '760': 'SYR', '376': 'ISR', '275': 'PSE', '634': 'QAT', '414': 'KWT',
  '48': 'BHR', '512': 'OMN', '887': 'YEM', '268': 'GEO', '51': 'ARM',
  '31': 'AZE', '626': 'TLS', '96': 'BRN', '158': 'TWN', '524': 'NPL',
  '64': 'BTN',
  
  // North America
  '840': 'USA', '124': 'CAN', '484': 'MEX', '192': 'CUB', '332': 'HTI',
  '214': 'DOM', '388': 'JAM', '44': 'BHS', '780': 'TTO', '52': 'BRB',
  '630': 'PRI', '320': 'GTM', '340': 'HND', '222': 'SLV', '558': 'NIC',
  '188': 'CRI', '591': 'PAN', '84': 'BLZ', '304': 'GRL',
  
  // South America
  '76': 'BRA', '32': 'ARG', '152': 'CHL', '170': 'COL', '604': 'PER',
  '858': 'URY', '862': 'VEN', '218': 'ECU', '68': 'BOL', '600': 'PRY',
  '328': 'GUY', '740': 'SUR', '254': 'GUF', '238': 'FLK',
  
  // Africa
  '710': 'ZAF', '818': 'EGY', '504': 'MAR', '404': 'KEN', '566': 'NGA',
  '788': 'TUN', '12': 'DZA', '288': 'GHA', '834': 'TZA', '800': 'UGA',
  '180': 'COD', '24': 'AGO', '508': 'MOZ', '716': 'ZWE', '894': 'ZMB',
  '454': 'MWI', '450': 'MDG', '72': 'BWA', '516': 'NAM', '748': 'SWZ',
  '426': 'LSO', '434': 'LBY', '729': 'SDN', '728': 'SSD', '140': 'CAF',
  '178': 'COG', '266': 'GAB', '226': 'GNQ', '120': 'CMR', '148': 'TCD',
  '562': 'NER', '466': 'MLI', '854': 'BFA', '686': 'SEN', '270': 'GMB',
  '624': 'GNB', '324': 'GIN', '430': 'LBR', '694': 'SLE', '384': 'CIV',
  '768': 'TGO', '204': 'BEN', '646': 'RWA', '108': 'BDI', '232': 'ERI',
  '262': 'DJI', '706': 'SOM', '231': 'ETH', '174': 'COM', '480': 'MUS',
  '690': 'SYC',
  
  // Oceania
  '36': 'AUS', '554': 'NZL', '242': 'FJI', '598': 'PNG', '540': 'NCL',
  '90': 'SLB', '548': 'VUT', '882': 'WSM', '776': 'TON', '296': 'KIR',
  '583': 'FSM', '584': 'MHL', '585': 'PLW', '520': 'NRU', '798': 'TUV',
  
  // Antarctica
  '10': 'ATA',
};

// Map ISO3 country codes to continents (using proper capitalization)
const COUNTRY_TO_CONTINENT: Record<string, string> = {
  // Europe
  'ALB': 'Europe', 'AND': 'Europe', 'AUT': 'Europe', 'BLR': 'Europe', 'BEL': 'Europe',
  'BIH': 'Europe', 'BGR': 'Europe', 'HRV': 'Europe', 'CYP': 'Europe', 'CZE': 'Europe',
  'DNK': 'Europe', 'EST': 'Europe', 'FIN': 'Europe', 'FRA': 'Europe', 'DEU': 'Europe',
  'GRC': 'Europe', 'HUN': 'Europe', 'ISL': 'Europe', 'IRL': 'Europe', 'ITA': 'Europe',
  'XKX': 'Europe', 'LVA': 'Europe', 'LIE': 'Europe', 'LTU': 'Europe', 'LUX': 'Europe',
  'MLT': 'Europe', 'MDA': 'Europe', 'MCO': 'Europe', 'MNE': 'Europe', 'NLD': 'Europe',
  'MKD': 'Europe', 'NOR': 'Europe', 'POL': 'Europe', 'PRT': 'Europe', 'ROU': 'Europe',
  'RUS': 'Europe', 'SMR': 'Europe', 'SRB': 'Europe', 'SVK': 'Europe', 'SVN': 'Europe',
  'ESP': 'Europe', 'SWE': 'Europe', 'CHE': 'Europe', 'UKR': 'Europe', 'GBR': 'Europe',
  'VAT': 'Europe',
  
  // Asia
  'AFG': 'Asia', 'ARM': 'Asia', 'AZE': 'Asia', 'BHR': 'Asia', 'BGD': 'Asia',
  'BTN': 'Asia', 'BRN': 'Asia', 'KHM': 'Asia', 'CHN': 'Asia', 'GEO': 'Asia',
  'IND': 'Asia', 'IDN': 'Asia', 'IRN': 'Asia', 'IRQ': 'Asia', 'ISR': 'Asia',
  'JPN': 'Asia', 'JOR': 'Asia', 'KAZ': 'Asia', 'KWT': 'Asia', 'KGZ': 'Asia',
  'LAO': 'Asia', 'LBN': 'Asia', 'MYS': 'Asia', 'MDV': 'Asia', 'MNG': 'Asia',
  'MMR': 'Asia', 'NPL': 'Asia', 'PRK': 'Asia', 'OMN': 'Asia', 'PAK': 'Asia',
  'PSE': 'Asia', 'PHL': 'Asia', 'QAT': 'Asia', 'SAU': 'Asia', 'SGP': 'Asia',
  'KOR': 'Asia', 'LKA': 'Asia', 'SYR': 'Asia', 'TWN': 'Asia', 'TJK': 'Asia',
  'THA': 'Asia', 'TLS': 'Asia', 'TUR': 'Asia', 'TKM': 'Asia', 'ARE': 'Asia',
  'UZB': 'Asia', 'VNM': 'Asia', 'YEM': 'Asia',
  
  // Africa
  'DZA': 'Africa', 'AGO': 'Africa', 'BEN': 'Africa', 'BWA': 'Africa', 'BFA': 'Africa',
  'BDI': 'Africa', 'CPV': 'Africa', 'CMR': 'Africa', 'CAF': 'Africa', 'TCD': 'Africa',
  'COM': 'Africa', 'COG': 'Africa', 'COD': 'Africa', 'CIV': 'Africa', 'DJI': 'Africa',
  'EGY': 'Africa', 'GNQ': 'Africa', 'ERI': 'Africa', 'SWZ': 'Africa', 'ETH': 'Africa',
  'GAB': 'Africa', 'GMB': 'Africa', 'GHA': 'Africa', 'GIN': 'Africa', 'GNB': 'Africa',
  'KEN': 'Africa', 'LSO': 'Africa', 'LBR': 'Africa', 'LBY': 'Africa', 'MDG': 'Africa',
  'MWI': 'Africa', 'MLI': 'Africa', 'MRT': 'Africa', 'MUS': 'Africa', 'MAR': 'Africa',
  'MOZ': 'Africa', 'NAM': 'Africa', 'NER': 'Africa', 'NGA': 'Africa', 'RWA': 'Africa',
  'STP': 'Africa', 'SEN': 'Africa', 'SYC': 'Africa', 'SLE': 'Africa', 'SOM': 'Africa',
  'ZAF': 'Africa', 'SSD': 'Africa', 'SDN': 'Africa', 'TZA': 'Africa', 'TGO': 'Africa',
  'TUN': 'Africa', 'UGA': 'Africa', 'ZMB': 'Africa', 'ZWE': 'Africa',
  
  // North America
  'ATG': 'North America', 'BHS': 'North America', 'BRB': 'North America', 'BLZ': 'North America',
  'CAN': 'North America', 'CRI': 'North America', 'CUB': 'North America', 'DMA': 'North America',
  'DOM': 'North America', 'SLV': 'North America', 'GRD': 'North America', 'GTM': 'North America',
  'HTI': 'North America', 'HND': 'North America', 'JAM': 'North America', 'MEX': 'North America',
  'NIC': 'North America', 'PAN': 'North America', 'KNA': 'North America', 'LCA': 'North America',
  'VCT': 'North America', 'TTO': 'North America', 'USA': 'North America', 'PRI': 'North America',
  'GRL': 'North America',
  
  // South America
  'ARG': 'South America', 'BOL': 'South America', 'BRA': 'South America', 'CHL': 'South America',
  'COL': 'South America', 'ECU': 'South America', 'GUY': 'South America', 'PRY': 'South America',
  'PER': 'South America', 'SUR': 'South America', 'URY': 'South America', 'VEN': 'South America',
  'FLK': 'South America', 'GUF': 'South America',
  
  // Oceania
  'AUS': 'Oceania', 'FJI': 'Oceania', 'KIR': 'Oceania', 'MHL': 'Oceania', 'FSM': 'Oceania',
  'NRU': 'Oceania', 'NZL': 'Oceania', 'PLW': 'Oceania', 'PNG': 'Oceania', 'WSM': 'Oceania',
  'SLB': 'Oceania', 'TON': 'Oceania', 'TUV': 'Oceania', 'VUT': 'Oceania', 'NCL': 'Oceania',
  
  // Antarctica
  'ATA': 'Antarctica',
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

  // Create a Set of played continents (proper capitalization from DB: "Asia", "Europe", etc.)
  const playedSet = new Set(playedContinents);

  // Check if a continent is played (direct string match)
  const isContinentPlayed = useCallback((continent: string | null) => {
    if (!continent) return false;
    return playedSet.has(continent);
  }, [playedSet]);

  // Convert numeric geo.id to ISO3, then lookup continent
  const getCountryContinent = useCallback((numericId: string) => {
    const iso3Code = NUMERIC_TO_ISO3[numericId];
    return iso3Code ? COUNTRY_TO_CONTINENT[iso3Code] : null;
  }, []);

  const continentsPlayedCount = playedContinents.length;

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
                  // Convert numeric geo.id to continent
                  const numericId = geo.id?.toString();
                  const continent = getCountryContinent(numericId);
                  const played = isContinentPlayed(continent);
                  const isAntarctica = continent === 'Antarctica';

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => setHoveredCountry(numericId)}
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
