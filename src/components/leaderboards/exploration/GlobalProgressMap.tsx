/**
 * GlobalProgressMap - Consolidated global progress section
 * Includes stats, map, and legend - all on page background (no cards)
 * 
 * Three-state styling:
 * - Played: Sage green (#8B9D77) with white stroke, 100% opacity
 * - Not Played: Light grey (#E5E7EB), 45% opacity (achievable)
 * - Disabled (Antarctica): Darker grey (#9CA3AF), 25% opacity (not part of game)
 */

import React, { useState, useCallback, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps';
import { Flag, Globe } from 'lucide-react';

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

// Map ISO3 country codes to continents
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
  
  // Antarctica (disabled - no golf courses)
  'ATA': 'Antarctica',
};

// Brand colors with three-state system
const COLORS = {
  playedFill: '#8B9D77',
  playedFillHover: '#7A8C68',
  playedStroke: '#FFFFFF',
  playedOpacity: 1,
  notPlayedFill: '#E5E7EB',
  notPlayedStroke: '#D1D5DB',
  notPlayedOpacity: 0.45,
  disabledFill: '#9CA3AF',
  disabledStroke: 'transparent',
  disabledOpacity: 0.25,
};

// Total achievable continents (excluding Antarctica)
const TOTAL_CONTINENTS = 6;

// Country milestones for progress indicator
interface Milestone {
  count: number;
  title: string;
}

const COUNTRY_MILESTONES: Milestone[] = [
  { count: 5, title: 'Explorer' },
  { count: 10, title: 'Traveller' },
  { count: 20, title: 'Globetrotter' },
  { count: 50, title: 'World Class' },
  { count: 100, title: 'Elite Explorer' },
  { count: 195, title: 'Worldwide Legend' },
];

const getNextMilestone = (currentCount: number): Milestone | null => {
  return COUNTRY_MILESTONES.find(m => m.count > currentCount) || null;
};

interface GlobalProgressMapProps {
  playedContinents: string[];
  countriesCount: number;
  className?: string;
}

function GlobalProgressMapComponent({ playedContinents, countriesCount, className }: GlobalProgressMapProps) {
  const [, setHoveredCountry] = useState<string | null>(null);

  const playedSet = new Set(playedContinents);

  const isContinentPlayed = useCallback((continent: string | null) => {
    if (!continent) return false;
    return playedSet.has(continent);
  }, [playedSet]);

  const getCountryContinent = useCallback((numericId: string) => {
    const iso3Code = NUMERIC_TO_ISO3[numericId];
    return iso3Code ? COUNTRY_TO_CONTINENT[iso3Code] : null;
  }, []);

  // Count played continents (excluding Antarctica)
  const continentsPlayedCount = playedContinents.filter(c => c !== 'Antarctica').length;
  
  // Next milestone
  const nextMilestone = getNextMilestone(countriesCount);
  const milestoneDelta = nextMilestone ? nextMilestone.count - countriesCount : 0;

  return (
    <div className={className}>
      {/* Header with decorative lines */}
      <div className="mb-3 px-4">
        <div className="flex items-center justify-center gap-3">
          <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-zinc-300" />
          
          <div className="text-center flex-shrink-0 px-2">
            <h3 className="text-lg font-semibold text-zinc-800 tracking-tight leading-tight">
              Global Progress
            </h3>
            <p className="text-sm mt-0.5 leading-tight">
              <span className="font-semibold text-zinc-700">{continentsPlayedCount}</span>
              <span className="mx-1 text-zinc-400">of</span>
              <span className="font-semibold text-zinc-700">{TOTAL_CONTINENTS}</span>
              <span className="ml-1 text-amber-600">Continents Played</span>
            </p>
          </div>
          
          <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-zinc-300" />
        </div>
      </div>

      {/* Stats Row - No card, just dividers */}
      <div className="flex items-center justify-center gap-0 mx-4 mb-3">
        {/* Countries Stat */}
        <div className="flex-1 text-center py-2">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <Flag className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xl font-bold text-zinc-900">
              {countriesCount}
            </span>
          </div>
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
            Countries
          </p>
        </div>
        
        {/* Divider with Globe */}
        <div className="flex items-center justify-center px-4">
          <div className="w-px h-8 bg-zinc-200" />
          <Globe className="w-4 h-4 text-zinc-300 mx-3" />
          <div className="w-px h-8 bg-zinc-200" />
        </div>
        
        {/* Continents Stat */}
        <div className="flex-1 text-center py-2">
          <div className="flex items-center justify-center gap-0.5 mb-0.5">
            <span className="text-xl font-bold text-zinc-900">
              {continentsPlayedCount}
            </span>
            <span className="text-sm text-zinc-400">/6</span>
          </div>
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
            Continents
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 px-4 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <p className="text-sm text-zinc-600">
          {nextMilestone ? (
            <>
              <span className="font-medium text-emerald-600">
                {milestoneDelta} more
              </span>
              {' '}to {nextMilestone.count} countries ({nextMilestone.title})
            </>
          ) : (
            <span className="font-semibold text-emerald-600">All countries explored!</span>
          )}
        </p>
      </div>

      {/* Map - Full bleed */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 140,
            center: [0, 20],
          }}
          style={{
            width: '100%',
            height: 'auto',
            minHeight: '240px',
          }}
          viewBox="0 0 800 480"
        >
          <Geographies geography={WORLD_TOPOJSON_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numericId = geo.id?.toString();
                const continent = getCountryContinent(numericId);
                const isAntarctica = continent === 'Antarctica';
                const played = !isAntarctica && isContinentPlayed(continent);

                const getFill = (hover: boolean) => {
                  if (isAntarctica) return COLORS.disabledFill;
                  if (played) return hover ? COLORS.playedFillHover : COLORS.playedFill;
                  return COLORS.notPlayedFill;
                };

                const getStroke = () => {
                  if (isAntarctica) return COLORS.disabledStroke;
                  if (played) return COLORS.playedStroke;
                  return COLORS.notPlayedStroke;
                };

                const getOpacity = () => {
                  if (isAntarctica) return COLORS.disabledOpacity;
                  if (played) return COLORS.playedOpacity;
                  return COLORS.notPlayedOpacity;
                };

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => !isAntarctica && setHoveredCountry(numericId)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    style={{
                      default: {
                        fill: getFill(false),
                        stroke: getStroke(),
                        strokeWidth: played ? 0.5 : 0.3,
                        opacity: getOpacity(),
                        outline: 'none',
                        cursor: played ? 'pointer' : 'default',
                        transition: 'all 0.2s ease-out',
                      },
                      hover: {
                        fill: isAntarctica ? COLORS.disabledFill : getFill(true),
                        stroke: getStroke(),
                        strokeWidth: played ? 0.6 : 0.3,
                        opacity: getOpacity(),
                        outline: 'none',
                        cursor: played ? 'pointer' : 'default',
                      },
                      pressed: {
                        fill: isAntarctica ? COLORS.disabledFill : getFill(true),
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-3 px-4">
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
                opacity: COLORS.notPlayedOpacity,
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
